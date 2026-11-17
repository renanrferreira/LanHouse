import type { Sessao } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { SessoesRepository } from '../repositories/SessoesRepository.js';
import type { SessoesInicio } from '../schemas/SessoesSchema.js';

const MAX_VALOR_CENTAVOS = 2147483647;
const INTERVALO_MONITORAMENTO_MS = 1000;
const MINUTO_MS = 60_000;
const CARENCIA_TECNICA_MS = 3 * MINUTO_MS;

export class SessoesService {
  constructor(private readonly sessoesRepository: SessoesRepository) {}

  // Apura a cobrança e encerra a ocupação sem efeitos financeiros parciais.
  async finalizar(id: string, operadorFimId: string, cancelamentoTecnico = false) {
    await this.sessoesRepository.bloquearExpiradas();
    return this.sessoesRepository.emTransacao(async repository => {
      const referencia = await repository.obterPorId(id);
      if (!referencia) {
        throw new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Sessão não encontrada.');
      }
      // Mantém a ordem de bloqueios usada na abertura e nas operações de créditos.
      const cliente = await repository.bloquearCliente(referencia.clienteId);
      const estacao = await repository.bloquearEstacao(referencia.estacaoId);
      const sessao = await repository.bloquearSessao(id);
      if (!sessao) {
        throw new AppError(ErrorCodes.SESSION_NOT_FOUND, 'Sessão não encontrada.');
      }
      if (sessao.status !== 'ATIVA' && sessao.status !== 'PAUSADA') {
        throw new AppError(ErrorCodes.SESSION_ALREADY_FINISHED, 'A sessão já foi encerrada.');
      }
      if (!cliente || !estacao) {
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Não foi possível encerrar a sessão.');
      }
      const tarifa = await repository.obterTarifa(estacao.categoria);
      if (!tarifa) {
        throw new AppError(ErrorCodes.RATE_NOT_FOUND, 'Tarifa ativa da categoria não encontrada.');
      }
      // O banco armazena os carimbos de sessão com precisão de segundos.
      const finalizadoEm = new Date(Math.round(Date.now() / 1000) * 1000);
      const duracaoMs = finalizadoEm.getTime() - sessao.iniciadoEm.getTime();
      const minutosDecorridos = Math.ceil(duracaoMs / MINUTO_MS);
      const prePaga = sessao.modalidade === 'PRE_PAGA';
      if (duracaoMs < 0 || (prePaga && (sessao.minutosContratados ?? 0) <= 0)) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'A duração da sessão é inválida.');
      }
      const minutosUtilizados = prePaga
        ? Math.min(minutosDecorridos, sessao.minutosContratados!) : minutosDecorridos;
      const cancelada = cancelamentoTecnico && duracaoMs < CARENCIA_TECNICA_MS;
      const valorFinalCentavos = cancelada ? 0 : minutosUtilizados * tarifa.valorPorMinutoCentavos;
      if (!Number.isSafeInteger(minutosUtilizados) || minutosUtilizados > MAX_VALOR_CENTAVOS ||
        !Number.isSafeInteger(valorFinalCentavos) || valorFinalCentavos < 0 ||
        valorFinalCentavos > MAX_VALOR_CENTAVOS) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'A cobrança excede o limite permitido.');
      }
      const pagoComSaldo = prePaga && valorFinalCentavos > 0;
      if (pagoComSaldo) {
        if (cliente.saldoCentavos < valorFinalCentavos) {
          throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS, 'Saldo insuficiente para encerrar a sessão.');
        }
        await repository.debitar(sessao, valorFinalCentavos, operadorFimId);
      }
      const encerrada = await repository.encerrar(id, {
        status: cancelada ? 'CANCELADA' : 'FINALIZADA',
        operadorFimId, finalizadoEm, minutosUtilizados, valorFinalCentavos, pagoComSaldo,
      });
      return {
        id: encerrada.id,
        status: encerrada.status,
        iniciadoEm: encerrada.iniciadoEm,
        finalizadoEm: encerrada.finalizadoEm,
        minutosUtilizados: encerrada.minutosUtilizados,
        tarifaAplicadaPorMinutoCentavos: tarifa.valorPorMinutoCentavos,
        valorFinalCentavos: encerrada.valorFinalCentavos,
        pagoComSaldo: encerrada.pagoComSaldo,
        estacaoLiberada: true,
      };
    });
  }

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
