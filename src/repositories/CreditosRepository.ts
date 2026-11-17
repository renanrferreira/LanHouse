import type { PrismaClient, TransacaoCredito } from '@prisma/client';

type ResultadoRecarga =
  | { status: 'criada'; transacao: TransacaoCredito }
  | { status: 'clienteNaoEncontrado' | 'saldoExcedido' };

export class CreditosRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Incrementa o saldo e registra o histórico sob o mesmo bloqueio transacional.
  recarregar(
    clienteId: string,
    valorCentavos: number,
    operadorId: string,
    saldoMaximoCentavos: number,
  ): Promise<ResultadoRecarga> {
    return this.prisma.$transaction(async (transacao) => {
      const resultado = await transacao.cliente.updateMany({
        where: {
          id: clienteId,
          ativo: true,
          saldoCentavos: { lte: saldoMaximoCentavos - valorCentavos },
        },
        data: { saldoCentavos: { increment: valorCentavos } },
      });

      if (resultado.count === 0) {
        const cliente = await transacao.cliente.findUnique({ where: { id: clienteId } });
        return {
          status: cliente?.ativo ? 'saldoExcedido' : 'clienteNaoEncontrado',
        };
      }

      const cliente = await transacao.cliente.findUniqueOrThrow({ where: { id: clienteId } });
      const registro = await transacao.transacaoCredito.create({
        data: {
          clienteId,
          operadorId,
          tipo: 'RECARGA',
          valorCentavos,
          saldoAposCentavos: cliente.saldoCentavos,
        },
      });

      return { status: 'criada', transacao: registro };
    });
  }

  // Consulta o histórico de um cliente, preservando o acesso aos inativos.
  async obterExtrato(clienteId: string): Promise<TransacaoCredito[] | null> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { transacoesCredito: { orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }] } },
    });

    return cliente?.transacoesCredito ?? null;
  }
}
