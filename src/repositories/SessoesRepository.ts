import type { Prisma, PrismaClient, Sessao } from '@prisma/client';

export class SessoesRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly contexto: Prisma.TransactionClient = prisma,
  ) {}

  // Executa operações com leituras atualizadas após cada bloqueio de linha.
  emTransacao<T>(operacao: (repository: SessoesRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      transacao => operacao(new SessoesRepository(this.prisma, transacao)),
      { isolationLevel: 'ReadCommitted' },
    );
  }

  // Serializa as aberturas e alterações de saldo do mesmo cliente.
  async bloquearCliente(id: string) {
    await this.contexto.$queryRaw`SELECT id FROM clientes WHERE id = ${id} FOR UPDATE`;
    return this.contexto.cliente.findUnique({ where: { id } });
  }

  // Serializa a alocação e as alterações operacionais da estação.
  async bloquearEstacao(id: string) {
    await this.contexto.$queryRaw`SELECT id FROM estacoes WHERE id = ${id} FOR UPDATE`;
    return this.contexto.estacao.findUnique({ where: { id } });
  }

  // Protege o encerramento contra alterações simultâneas na sessão.
  async bloquearSessao(id: string) {
    await this.contexto.$queryRaw`SELECT id FROM sessoes WHERE id = ${id} FOR UPDATE`;
    return this.obterPorId(id);
  }

  // Debita créditos e insere o registro de auditoria na mesma transação.
  async debitar(sessao: Sessao, valorCentavos: number, operadorId: string) {
    const cliente = await this.contexto.cliente.update({
      where: { id: sessao.clienteId },
      data: { saldoCentavos: { decrement: valorCentavos } },
    });
    await this.contexto.transacaoCredito.create({ data: {
      clienteId: cliente.id,
      operadorId,
      sessaoId: sessao.id,
      tipo: 'DEBITO_SESSAO',
      valorCentavos,
      saldoAposCentavos: cliente.saldoCentavos,
    } });
  }

  // Persiste o encerramento e libera a estação dentro da transação.
  async encerrar(id: string, dados: Prisma.SessaoUncheckedUpdateInput): Promise<Sessao> {
    const sessao = await this.contexto.sessao.update({ where: { id }, data: dados });
    await this.contexto.estacao.update({
      where: { id: sessao.estacaoId }, data: { status: 'DISPONIVEL' },
    });
    return sessao;
  }

  // Busca ocupações ainda não encerradas do cliente ou da estação.
  obterEmAndamento(clienteId: string, estacaoId: string) {
    return this.contexto.sessao.findMany({
      where: {
        status: { in: ['ATIVA', 'PAUSADA'] },
        OR: [{ clienteId }, { estacaoId }],
      },
    });
  }

  // Consulta o preço vigente da categoria da estação.
  obterTarifa(categoria: string) {
    return this.contexto.tarifa.findFirst({
      where: { categoria, ativo: true },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    });
  }

  // Registra a sessão e ocupa a estação dentro da transação de abertura.
  async criar(dados: Prisma.SessaoUncheckedCreateInput): Promise<Sessao> {
    const sessao = await this.contexto.sessao.create({ data: dados });
    await this.contexto.estacao.update({
      where: { id: sessao.estacaoId }, data: { status: 'OCUPADA' },
    });
    return sessao;
  }

  // Bloqueia limites vencidos em uma atualização atômica recuperável após reinícios.
  async bloquearExpiradas(): Promise<void> {
    await this.contexto.$executeRaw`
      UPDATE sessoes SET status = 'PAUSADA'
      WHERE status = 'ATIVA' AND modalidade = 'PRE_PAGA'
        AND minutosContratados IS NOT NULL
        AND TIMESTAMPADD(MINUTE, minutosContratados, iniciadoEm) <= UTC_TIMESTAMP()
    `;
  }

  // Lista todas as ocupações em andamento para monitoramento.
  listarAtivas(): Promise<Sessao[]> {
    return this.contexto.sessao.findMany({
      where: { status: { in: ['ATIVA', 'PAUSADA'] } },
      orderBy: [{ iniciadoEm: 'asc' }, { id: 'asc' }],
    });
  }

  // Consulta o histórico de uma sessão pelo identificador.
  obterPorId(id: string): Promise<Sessao | null> {
    return this.contexto.sessao.findUnique({ where: { id } });
  }
}
