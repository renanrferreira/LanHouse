import type { Cliente, Prisma, PrismaClient } from '@prisma/client';
import type {
  AtualizarClienteInput,
  CriarClienteInput,
  ListarClientesQuery,
} from '../schemas/ClientesSchema.js';

export class ClientesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Persiste um cliente novo com o CPF já normalizado.
  criar(dados: CriarClienteInput): Promise<Cliente> {
    return this.prisma.cliente.create({ data: dados });
  }

  // Lista clientes ativos e calcula os metadados da paginação.
  async listar(
    consulta: ListarClientesQuery,
  ): Promise<{ dados: Cliente[]; totalItens: number }> {
    const where: Prisma.ClienteWhereInput = { ativo: true };

    if (consulta.busca) {
      const buscaDocumento = consulta.busca.replace(/[.-]/g, '');
      const filtros: Prisma.ClienteWhereInput[] = [
        { nome: { contains: consulta.busca } },
      ];

      if (buscaDocumento.length > 0) {
        filtros.push({ documento: { contains: buscaDocumento } });
      }

      where.OR = filtros;
    }

    const [dados, totalItens] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip: (consulta.pagina - 1) * consulta.itensPorPagina,
        take: consulta.itensPorPagina,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { dados, totalItens };
  }

  // Localiza um cliente que ainda está ativo.
  obterAtivo(id: string): Promise<Cliente | null> {
    return this.prisma.cliente.findFirst({ where: { id, ativo: true } });
  }

  // Atualiza os dados cadastrais sem permitir alterar o saldo.
  async atualizar(
    id: string,
    dados: AtualizarClienteInput,
  ): Promise<Cliente | null> {
    const resultado = await this.prisma.cliente.updateMany({
      where: { id, ativo: true },
      data: dados,
    });

    if (resultado.count === 0) {
      return null;
    }

    return this.prisma.cliente.findUnique({ where: { id } });
  }

  // Desativa logicamente um cliente ativo sem apagar seu histórico.
  async desativar(id: string): Promise<boolean> {
    const resultado = await this.prisma.cliente.updateMany({
      where: { id, ativo: true },
      data: { ativo: false },
    });

    return resultado.count > 0;
  }
}
