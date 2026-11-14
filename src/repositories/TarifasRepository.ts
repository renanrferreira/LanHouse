import type { PrismaClient, Tarifa } from '@prisma/client';
import type {
  AtualizarTarifaInput,
  CriarTarifaInput,
} from '../schemas/TarifasSchema.js';

export class TarifasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Substitui a tarifa vigente da categoria preservando o registro anterior.
  criar(dados: CriarTarifaInput): Promise<Tarifa> {
    return this.prisma.$transaction(async (transacao) => {
      await transacao.tarifa.updateMany({
        where: { categoria: dados.categoria, ativo: true },
        data: { ativo: false },
      });

      return transacao.tarifa.create({
        data: { ...dados, ativo: true },
      });
    });
  }

  // Lista somente as tarifas vigentes.
  listarAtivas(): Promise<Tarifa[]> {
    return this.prisma.tarifa.findMany({
      where: { ativo: true },
      orderBy: [{ categoria: 'asc' }, { criadoEm: 'desc' }],
    });
  }

  // Consulta o histórico, incluindo tarifas inativas.
  obter(id: string): Promise<Tarifa | null> {
    return this.prisma.tarifa.findUnique({ where: { id } });
  }

  // Atualiza o valor somente enquanto a tarifa estiver ativa.
  async atualizar(
    id: string,
    dados: AtualizarTarifaInput,
  ): Promise<Tarifa | null> {
    return this.prisma.$transaction(async (transacao) => {
      const resultado = await transacao.tarifa.updateMany({
        where: { id, ativo: true },
        data: dados,
      });

      if (resultado.count === 0) {
        return null;
      }

      return transacao.tarifa.findUnique({ where: { id } });
    });
  }

  // Desativa logicamente uma tarifa ativa.
  async desativar(id: string): Promise<boolean> {
    const resultado = await this.prisma.tarifa.updateMany({
      where: { id, ativo: true },
      data: { ativo: false },
    });

    return resultado.count > 0;
  }
}
