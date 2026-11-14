import { Prisma, type Cliente } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { ClientesRepository } from '../repositories/ClientesRepository.js';
import type {
  AtualizarClienteInput,
  CriarClienteInput,
  ListarClientesQuery,
} from '../schemas/ClientesSchema.js';

export class ClientesService {
  constructor(private readonly clientesRepository: ClientesRepository) {}

  // Cria um cliente e converte violações da unicidade do CPF.
  async criar(dados: CriarClienteInput): Promise<Cliente> {
    try {
      return await this.clientesRepository.criar(dados);
    } catch (error) {
      this.lancarConflitoDeDocumento(error);
    }
  }

  // Lista clientes ativos com a paginação definida pelo contrato.
  async listar(consulta: ListarClientesQuery) {
    const { dados, totalItens } = await this.clientesRepository.listar(consulta);

    return {
      dados,
      paginacao: {
        pagina: consulta.pagina,
        itensPorPagina: consulta.itensPorPagina,
        totalItens,
        totalPaginas: Math.ceil(totalItens / consulta.itensPorPagina),
      },
    };
  }

  // Retorna um cliente ativo ou lança o erro de não localizado.
  async obter(id: string): Promise<Cliente> {
    const cliente = await this.clientesRepository.obterAtivo(id);

    if (!cliente) {
      throw this.erroClienteNaoEncontrado();
    }

    return cliente;
  }

  // Atualiza um cliente ativo e preserva o saldo de créditos.
  async atualizar(id: string, dados: AtualizarClienteInput): Promise<Cliente> {
    try {
      const cliente = await this.clientesRepository.atualizar(id, dados);

      if (!cliente) {
        throw this.erroClienteNaoEncontrado();
      }

      return cliente;
    } catch (error) {
      this.lancarConflitoDeDocumento(error);
    }
  }

  // Desativa logicamente um cliente ativo.
  async desativar(id: string): Promise<void> {
    const desativado = await this.clientesRepository.desativar(id);

    if (!desativado) {
      throw this.erroClienteNaoEncontrado();
    }
  }

  // Traduz conflitos de unicidade do banco para o erro público do contrato.
  private lancarConflitoDeDocumento(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        ErrorCodes.DOCUMENT_ALREADY_EXISTS,
        'CPF já cadastrado para outro cliente.',
      );
    }

    throw error;
  }

  // Cria o erro público usado para clientes ausentes ou inativos.
  private erroClienteNaoEncontrado(): AppError {
    return new AppError(ErrorCodes.CLIENT_NOT_FOUND, 'Cliente não encontrado.');
  }
}
