import { Prisma, type Estacao } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { EstacoesRepository } from '../repositories/EstacoesRepository.js';
import type {
  AtualizarEstacaoInput,
  AtualizarStatusEstacaoInput,
  CriarEstacaoInput,
} from '../schemas/EstacoesSchema.js';

export class EstacoesService {
  constructor(private readonly estacoesRepository: EstacoesRepository) {}

  // Cria uma estação e converte violações dos campos únicos.
  async criar(dados: CriarEstacaoInput): Promise<Estacao> {
    try {
      return await this.estacoesRepository.criar(dados);
    } catch (error) {
      return await this.lancarConflitoDeUnicidade(error, dados);
    }
  }

  // Lista todas as estações e seus estados operacionais.
  listar(): Promise<Estacao[]> {
    return this.estacoesRepository.listar();
  }

  // Retorna uma estação cadastrada ou lança o erro de não localizada.
  async obter(id: string): Promise<Estacao> {
    const estacao = await this.estacoesRepository.obter(id);

    if (!estacao) {
      throw this.erroEstacaoNaoEncontrada();
    }

    return estacao;
  }

  // Atualiza os dados cadastrais de uma estação ativa.
  async atualizar(
    id: string,
    dados: AtualizarEstacaoInput,
  ): Promise<Estacao> {
    const estacaoExistente = await this.estacoesRepository.obterAtiva(id);

    if (!estacaoExistente) {
      throw this.erroEstacaoNaoEncontrada();
    }

    try {
      const estacao = await this.estacoesRepository.atualizar(id, dados);

      if (!estacao) {
        throw this.erroEstacaoNaoEncontrada();
      }

      return estacao;
    } catch (error) {
      return await this.lancarConflitoDeUnicidade(error, dados, id);
    }
  }

  // Altera o status sem permitir que o CRUD ocupe uma estação.
  async atualizarStatus(
    id: string,
    dados: AtualizarStatusEstacaoInput,
  ): Promise<Estacao> {
    const estacaoExistente = await this.estacoesRepository.obterAtiva(id);

    if (!estacaoExistente) {
      throw this.erroEstacaoNaoEncontrada();
    }

    if (estacaoExistente.status === 'OCUPADA') {
      throw this.erroEstacaoIndisponivel();
    }

    const estacao = await this.estacoesRepository.atualizarStatus(id, dados);

    if (!estacao) {
      const estacaoAtual = await this.estacoesRepository.obterAtiva(id);

      if (estacaoAtual?.status === 'OCUPADA') {
        throw this.erroEstacaoIndisponivel();
      }

      throw this.erroEstacaoNaoEncontrada();
    }

    return estacao;
  }

  // Desativa logicamente uma estação que não esteja ocupada.
  async desativar(id: string): Promise<void> {
    const estacao = await this.estacoesRepository.obterAtiva(id);

    if (!estacao) {
      throw this.erroEstacaoNaoEncontrada();
    }

    if (estacao.status === 'OCUPADA') {
      throw this.erroEstacaoIndisponivel();
    }

    const desativada = await this.estacoesRepository.desativar(id);

    if (!desativada) {
      const estacaoAtual = await this.estacoesRepository.obterAtiva(id);

      if (estacaoAtual?.status === 'OCUPADA') {
        throw this.erroEstacaoIndisponivel();
      }

      throw this.erroEstacaoNaoEncontrada();
    }
  }

  // Traduz violações dos índices únicos para os códigos públicos da API.
  private async lancarConflitoDeUnicidade(
    error: unknown,
    dados: { numero?: number; ipHost: string },
    idIgnorado?: string,
  ): Promise<never> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const campos = Array.isArray(target)
        ? target.map(String).join(' ').toLowerCase()
        : String(target ?? '').toLowerCase();

      if (campos.includes('numero')) {
        throw new AppError(
          ErrorCodes.STATION_NUMBER_ALREADY_EXISTS,
          'Número de estação já cadastrado.',
        );
      }

      if (campos.includes('iphost')) {
        throw new AppError(
          ErrorCodes.STATION_IP_ALREADY_EXISTS,
          'Endereço IP já associado a outra estação.',
        );
      }

      if (
        dados.numero !== undefined &&
        (await this.estacoesRepository.existeNumero(
          dados.numero,
          idIgnorado,
        ))
      ) {
        throw new AppError(
          ErrorCodes.STATION_NUMBER_ALREADY_EXISTS,
          'Número de estação já cadastrado.',
        );
      }

      if (
        await this.estacoesRepository.existeIp(dados.ipHost, idIgnorado)
      ) {
        throw new AppError(
          ErrorCodes.STATION_IP_ALREADY_EXISTS,
          'Endereço IP já associado a outra estação.',
        );
      }
    }

    throw error;
  }

  // Cria o erro público usado para estações não localizadas ou inativas.
  private erroEstacaoNaoEncontrada(): AppError {
    return new AppError(
      ErrorCodes.STATION_NOT_FOUND,
      'Estação não encontrada.',
    );
  }

  // Cria o erro público usado quando uma estação está ocupada.
  private erroEstacaoIndisponivel(): AppError {
    return new AppError(
      ErrorCodes.STATION_NOT_AVAILABLE,
      'Estação ocupada não pode ser alterada.',
    );
  }
}
