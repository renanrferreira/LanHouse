import type { Sessao } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { SessoesRepository } from '../repositories/SessoesRepository.js';
import type { SessoesInicio } from '../schemas/SessoesSchema.js';

const MAX_VALOR_CENTAVOS = 2147483647;
const INTERVALO_MONITORAMENTO_MS = 1000;

export class SessoesService {
  constructor(private readonly sessoesRepository: SessoesRepository) {}

  // Abre uma sessão com ocupação exclusiva e validação do limite pré-pago.
  async iniciar(dados: SessoesInicio, operadorInicioId: string) {
    await this.sessoesRepository.bloquearExpiradas();
    return this.sessoesRepository.emTransacao(async repository => {
      const cliente = await repository.bloquearCliente(dados.clienteId);
      if (!cliente?.ativo) {
        throw new AppError(ErrorCodes.CLIENT_NOT_FOUND, 'Cliente não encontrado.');
      }
      const estacao = await repository.bloquearEstacao(dados.estacaoId);
      if (!estacao) {
        throw new AppError(ErrorCodes.STATION_NOT_FOUND, 'Estação não encontrada.');
      }
      if (!estacao.ativo || estacao.status !== 'DISPONIVEL') {
        throw new AppError(ErrorCodes.STATION_NOT_AVAILABLE, 'A estação não está disponível.');
      }
      const emAndamento = await repository.obterEmAndamento(cliente.id, estacao.id);
      if (emAndamento.some(sessao => sessao.clienteId === cliente.id)) {
        throw new AppError(
          ErrorCodes.CLIENT_ALREADY_HAS_ACTIVE_SESSION,
          'O cliente já possui uma sessão em andamento.',
        );
      }
      if (emAndamento.length > 0) {
        throw new AppError(ErrorCodes.STATION_NOT_AVAILABLE, 'A estação já possui uma sessão em andamento.');
      }
      const tarifa = await repository.obterTarifa(estacao.categoria);
      if (!tarifa) {
        throw new AppError(ErrorCodes.RATE_NOT_FOUND, 'Tarifa ativa da categoria não encontrada.');
      }
      const minutosContratados = dados.modalidade === 'PRE_PAGA' ? dados.minutosContratados : null;
      const valorEstimadoCentavos = (minutosContratados ?? 0) * tarifa.valorPorMinutoCentavos;
      if (!Number.isSafeInteger(valorEstimadoCentavos) || valorEstimadoCentavos > MAX_VALOR_CENTAVOS) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'O valor estimado excede o limite permitido em centavos.');
      }
      if (dados.modalidade === 'PRE_PAGA' && cliente.saldoCentavos < valorEstimadoCentavos) {
        throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS, 'Saldo insuficiente para os minutos contratados.');
      }
      const sessao = await repository.criar({
        clienteId: cliente.id,
        estacaoId: estacao.id,
        operadorInicioId,
        modalidade: dados.modalidade,
        minutosContratados,
        status: 'ATIVA',
      });
      return {
        id: sessao.id,
        clienteId: sessao.clienteId,
        estacaoId: sessao.estacaoId,
        modalidade: sessao.modalidade,
        status: sessao.status,
        iniciadoEm: sessao.iniciadoEm,
        valorEstimadoCentavos,
      };
    });
  }

  // Atualiza os bloqueios antes de retornar as sessões em andamento.
  async listarAtivas(): Promise<Sessao[]> {
    await this.sessoesRepository.bloquearExpiradas();
    return this.sessoesRepository.listarAtivas();
  }

  // Obtém uma sessão incluindo seu bloqueio por limite contratado.
  async obterPorId(id: string): Promise<Sessao> {
    await this.sessoesRepository.bloquearExpiradas();
    const sessao = await this.sessoesRepository.obterPorId(id);
    if (!sessao) {
      throw new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Sessão não encontrada.');
    }
    return sessao;
  }

  // Monitora os limites persistidos e retorna uma função para encerrar o monitor.
  iniciarMonitoramento(): () => Promise<void> {
    let pendente: Promise<void> | undefined;
    const verificar = () => {
      if (pendente) return;
      pendente = this.sessoesRepository.bloquearExpiradas()
        .catch(() => {
          console.error('Falha ao verificar os limites das sessões. Uma nova tentativa será realizada.');
        })
        .finally(() => { pendente = undefined; });
    };
    verificar();
    const intervalo = setInterval(verificar, INTERVALO_MONITORAMENTO_MS);
    intervalo.unref();
    return async () => {
      clearInterval(intervalo);
      await pendente;
    };
  }
}
