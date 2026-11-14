import type { Estacao, Prisma, PrismaClient } from '@prisma/client';
import type {
  AtualizarEstacaoInput,
  AtualizarStatusEstacaoInput,
  CriarEstacaoInput,
} from '../schemas/EstacoesSchema.js';

export class EstacoesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Persiste uma estação com status inicial disponível.
  criar(dados: CriarEstacaoInput): Promise<Estacao> {
    return this.prisma.estacao.create({
      data: { ...dados, status: 'DISPONIVEL' },
    });
  }

  // Lista todas as estações, inclusive as inativas.
  listar(): Promise<Estacao[]> {
    return this.prisma.estacao.findMany();
  }

  // Localiza uma estação por identificador, ativa ou inativa.
  obter(id: string): Promise<Estacao | null> {
    return this.prisma.estacao.findUnique({ where: { id } });
  }

  // Localiza uma estação que não foi desativada logicamente.
  obterAtiva(id: string): Promise<Estacao | null> {
    return this.prisma.estacao.findFirst({ where: { id, ativo: true } });
  }

  // Verifica se o número já pertence a outra estação.
  async existeNumero(numero: number, idIgnorado?: string): Promise<boolean> {
    const estacao = await this.prisma.estacao.findFirst({
      where: {
        numero,
        ...(idIgnorado ? { id: { not: idIgnorado } } : {}),
      },
      select: { id: true },
    });

    return estacao !== null;
  }

  // Verifica se o endereço IP já pertence a outra estação.
  async existeIp(ipHost: string, idIgnorado?: string): Promise<boolean> {
    const estacao = await this.prisma.estacao.findFirst({
      where: {
        ipHost,
        ...(idIgnorado ? { id: { not: idIgnorado } } : {}),
      },
      select: { id: true },
    });

    return estacao !== null;
  }

  // Atualiza os dados cadastrais de uma estação ativa.
  async atualizar(
    id: string,
    dados: AtualizarEstacaoInput,
  ): Promise<Estacao | null> {
    const resultado = await this.prisma.estacao.updateMany({
      where: { id, ativo: true },
      data: dados,
    });

    if (resultado.count === 0) {
      return null;
    }

    return this.prisma.estacao.findUnique({ where: { id } });
  }

  // Altera o status sem interferir em uma sessão em andamento.
  async atualizarStatus(
    id: string,
    dados: AtualizarStatusEstacaoInput,
  ): Promise<Estacao | null> {
    const resultado = await this.prisma.estacao.updateMany({
      where: { id, ativo: true, status: { not: 'OCUPADA' } },
      data: dados,
    });

    if (resultado.count === 0) {
      return null;
    }

    return this.prisma.estacao.findUnique({ where: { id } });
  }

  // Desativa logicamente uma estação que não esteja ocupada.
  async desativar(id: string): Promise<boolean> {
    const resultado = await this.prisma.estacao.updateMany({
      where: { id, ativo: true, status: { not: 'OCUPADA' } },
      data: { ativo: false, status: 'INATIVA' },
    });

    return resultado.count > 0;
  }
}
