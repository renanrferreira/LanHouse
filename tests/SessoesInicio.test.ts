import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { setTimeout as esperar } from 'node:timers/promises';
import { seedLanhouse } from '../prisma/seed.ts';
import { createPrismaClient } from '../src/database/PrismaClient.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createApp } = await import('../src/app.ts');
const databaseTestUrl = process.env.DATABASE_TEST_URL;
assert.ok(databaseTestUrl, 'DATABASE_TEST_URL deve apontar para o banco isolado.');
assert.equal(new URL(databaseTestUrl).pathname, '/lanhouse_test');
const prisma = createPrismaClient(databaseTestUrl);
const clientesIds: string[] = [];
const estacoesIds: string[] = [];
let server: Server | undefined;
let baseUrl: string;
let headers: Record<string, string>;
let operadorId: string;

// Cria um cliente fictício exclusivo desta execução.
const criarCliente = async (saldoCentavos = 7000) => {
  const cliente = await prisma.cliente.create({ data: {
    nome: 'Cliente fictício de sessões', documento: randomUUID().slice(0, 20), saldoCentavos,
  } });
  clientesIds.push(cliente.id);
  return cliente;
};

// Cria uma estação exclusiva usando a tarifa HIGH_END da seed.
const criarEstacao = async (status = 'DISPONIVEL', ativo = true) => {
  const estacao = await prisma.estacao.create({ data: {
    numero: randomInt(10_000, 2_000_000_000), nome: 'Estação fictícia de sessões',
    categoria: 'HIGH_END', ipHost: 'fd00:' + randomUUID().replaceAll('-', '').slice(0, 4) +
      ':' + randomUUID().replaceAll('-', '').slice(0, 4) + '::1', status, ativo,
  } });
  estacoesIds.push(estacao.id);
  return estacao;
};

// Envia a abertura pela aplicação HTTP montada.
const iniciar = (dados: unknown) => fetch(baseUrl + '/sessoes', {
  method: 'POST', headers, body: JSON.stringify(dados),
});

// Confere o status HTTP e o código público do erro.
const conferirErro = async (resposta: Response, status: number, codigo: string) => {
  assert.equal(resposta.status, status);
  const corpo = await resposta.json();
  assert.equal(corpo.sucesso, false);
  assert.equal(corpo.erro.codigo, codigo);
};

describe('Abertura e monitoramento de sessões', () => {
  before(async () => {
    await prisma.$connect();
    await seedLanhouse(prisma);
    server = createServer(createApp(prisma));
    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
    const login = await fetch(baseUrl + '/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });
    assert.equal(login.status, 200);
    const resultado = await login.json();
    operadorId = resultado.dados.usuario.id;
    headers = { authorization: 'Bearer ' + resultado.dados.token,
      'content-type': 'application/json' };
  });

  after(async () => {
    try {
      if (server) await new Promise<void>((resolve, reject) => {
        server!.close(error => error ? reject(error) : resolve());
      });
      await prisma.sessao.updateMany({
        where: { clienteId: { in: clientesIds }, status: { in: ['ATIVA', 'PAUSADA'] } },
        data: { status: 'CANCELADA', finalizadoEm: new Date() },
      });
      await prisma.estacao.updateMany({
        where: { id: { in: estacoesIds } }, data: { ativo: false, status: 'INATIVA' },
      });
      await prisma.cliente.updateMany({
        where: { id: { in: clientesIds } }, data: { ativo: false },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('abre sessão pré-paga atomicamente, consulta e rejeita cliente já ocupado', async () => {
    const cliente = await criarCliente();
    const estacao = await criarEstacao();
    const outra = await criarEstacao();
    const entrada = { clienteId: cliente.id, estacaoId: estacao.id,
      modalidade: 'PRE_PAGA', minutosContratados: 2 };
    const resposta = await iniciar(entrada);
    assert.equal(resposta.status, 201);
    const { dados, sucesso } = await resposta.json();
    assert.equal(sucesso, true);
    assert.deepEqual(dados, { id: dados.id, clienteId: cliente.id, estacaoId: estacao.id,
      modalidade: 'PRE_PAGA', status: 'ATIVA', iniciadoEm: dados.iniciadoEm,
      valorEstimadoCentavos: 70 });
    assert.match(dados.iniciadoEm, /Z$/);
    assert.ok(Math.abs(Date.now() - Date.parse(dados.iniciadoEm)) < 5000);
    const sessao = await prisma.sessao.findUniqueOrThrow({ where: { id: dados.id } });
    assert.equal(sessao.operadorInicioId, operadorId);
    assert.equal(sessao.minutosContratados, 2);
    assert.equal(sessao.finalizadoEm, null);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: estacao.id } })).status, 'OCUPADA');
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos, 7000);
    assert.equal(await prisma.transacaoCredito.count({ where: { clienteId: cliente.id } }), 0);
    const consulta = await fetch(baseUrl + '/sessoes/' + dados.id, { headers });
    assert.equal(consulta.status, 200);
    assert.deepEqual((await consulta.json()).dados, JSON.parse(JSON.stringify(sessao)));
    const lista = await fetch(baseUrl + '/sessoes/ativas', { headers });
    assert.equal(lista.status, 200);
    assert.ok((await lista.json()).dados.some((item: { id: string }) => item.id === dados.id));
    await conferirErro(await iniciar({ ...entrada, estacaoId: outra.id }), 409, 'CLIENT_ALREADY_HAS_ACTIVE_SESSION');
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: outra.id } })).status, 'DISPONIVEL');
    assert.equal(await prisma.sessao.count({ where: { clienteId: cliente.id } }), 1);
  });

  it('protege as rotas e valida entradas, saldo e disponibilidade sem efeitos parciais', async () => {
    for (const caminho of ['/sessoes', '/sessoes/ativas', '/sessoes/' + randomUUID()]) {
      await conferirErro(await fetch(baseUrl + caminho, caminho === '/sessoes' ? {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      } : {}), 401, 'UNAUTHORIZED');
    }
    const cliente = await criarCliente(69);
    const estacao = await criarEstacao();
    const entrada = { clienteId: cliente.id, estacaoId: estacao.id,
      modalidade: 'PRE_PAGA', minutosContratados: 2 };
    for (const minutosContratados of [undefined, null, 0, -1, 1.5, '2', 2147483648]) {
      await conferirErro(await iniciar({ ...entrada, minutosContratados }), 400, 'INVALID_INPUT');
    }
    await conferirErro(await iniciar({ ...entrada, operadorInicioId: operadorId }), 400, 'INVALID_INPUT');
    await conferirErro(await iniciar({ ...entrada, modalidade: 'INVALIDA' }), 400, 'INVALID_INPUT');
    await conferirErro(await iniciar({ ...entrada, clienteId: '' }), 400, 'INVALID_INPUT');
    await conferirErro(await iniciar(entrada), 422, 'INSUFFICIENT_FUNDS');
    await conferirErro(await iniciar({ ...entrada, minutosContratados: 2147483647 }), 400, 'INVALID_INPUT');
    await conferirErro(await iniciar({ ...entrada, clienteId: randomUUID() }), 404, 'CLIENT_NOT_FOUND');
    await conferirErro(await iniciar({ ...entrada, estacaoId: randomUUID() }), 404, 'STATION_NOT_FOUND');
    await prisma.cliente.update({ where: { id: cliente.id }, data: { ativo: false } });
    await conferirErro(await iniciar(entrada), 404, 'CLIENT_NOT_FOUND');
    await prisma.cliente.update({ where: { id: cliente.id }, data: { ativo: true } });
    for (const status of ['OCUPADA', 'MANUTENCAO', 'INATIVA']) {
      const indisponivel = await criarEstacao(status);
      await conferirErro(await iniciar({ ...entrada, estacaoId: indisponivel.id }), 409, 'STATION_NOT_AVAILABLE');
    }
    const inativa = await criarEstacao('DISPONIVEL', false);
    await conferirErro(await iniciar({ ...entrada, estacaoId: inativa.id }), 409, 'STATION_NOT_AVAILABLE');
    await conferirErro(await fetch(baseUrl + '/sessoes/ativas?extra=1', { headers }), 400, 'INVALID_INPUT');
    await conferirErro(await fetch(baseUrl + '/sessoes/' + randomUUID() + '?extra=1', { headers }), 400, 'INVALID_INPUT');
    await conferirErro(await fetch(baseUrl + '/sessoes/' + randomUUID(), { headers }), 404, 'SESSION_NOT_FOUND');
    assert.equal(await prisma.sessao.count({ where: { clienteId: cliente.id } }), 0);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: estacao.id } })).status, 'DISPONIVEL');
  });

  it('permite pós-paga sem saldo e impede aberturas simultâneas duplicadas', async () => {
    const cliente = await criarCliente(0);
    const estacoes = await Promise.all([criarEstacao(), criarEstacao()]);
    const entrada = { clienteId: cliente.id, estacaoId: estacoes[0].id, modalidade: 'POS_PAGA' };
    await conferirErro(await iniciar({ ...entrada, minutosContratados: 1 }), 400, 'INVALID_INPUT');
    const simultaneas = await Promise.all(estacoes.map(estacao => iniciar({ ...entrada, estacaoId: estacao.id })));
    assert.deepEqual(simultaneas.map(resposta => resposta.status).sort(), [201, 409]);
    const criada = simultaneas.find(resposta => resposta.status === 201)!;
    assert.equal((await criada.json()).dados.valorEstimadoCentavos, 0);
    await conferirErro(simultaneas.find(resposta => resposta.status === 409)!, 409, 'CLIENT_ALREADY_HAS_ACTIVE_SESSION');
    assert.equal(await prisma.sessao.count({ where: { clienteId: cliente.id } }), 1);
    assert.equal(await prisma.estacao.count({ where: { id: { in: estacoes.map(item => item.id) }, status: 'OCUPADA' } }), 1);

    const disputada = await criarEstacao();
    const clientes = await Promise.all([criarCliente(), criarCliente()]);
    const disputa = await Promise.all(clientes.map(item => iniciar({ ...entrada, clienteId: item.id, estacaoId: disputada.id })));
    assert.deepEqual(disputa.map(resposta => resposta.status).sort(), [201, 409]);
    await conferirErro(disputa.find(resposta => resposta.status === 409)!, 409, 'STATION_NOT_AVAILABLE');
    assert.equal(await prisma.sessao.count({ where: { estacaoId: disputada.id } }), 1);
  });

  it('bloqueia pré-paga vencida automaticamente e preserva a ocupação até o encerramento', async () => {
    const cliente = await criarCliente();
    const estacao = await criarEstacao();
    const resposta = await iniciar({ clienteId: cliente.id, estacaoId: estacao.id,
      modalidade: 'PRE_PAGA', minutosContratados: 1 });
    assert.equal(resposta.status, 201);
    const { dados } = await resposta.json();
    await prisma.sessao.update({ where: { id: dados.id }, data: {
      iniciadoEm: new Date(Date.now() - 61_000),
    } });
    const { SessoesService } = await import('../src/services/SessoesService.ts');
    const { SessoesRepository } = await import('../src/repositories/SessoesRepository.ts');
    const service = new SessoesService(new SessoesRepository(prisma));
    const parar = service.iniciarMonitoramento();
    try {
      let sessao = await prisma.sessao.findUniqueOrThrow({ where: { id: dados.id } });
      const prazo = Date.now() + 5000;
      while (sessao.status === 'ATIVA' && Date.now() < prazo) {
        await esperar(100);
        sessao = await prisma.sessao.findUniqueOrThrow({ where: { id: dados.id } });
      }
      assert.equal(sessao.status, 'PAUSADA');
      assert.equal(sessao.finalizadoEm, null);
      assert.equal(sessao.valorFinalCentavos, null);
      assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: estacao.id } })).status, 'OCUPADA');
      const lista = await fetch(baseUrl + '/sessoes/ativas', { headers });
      assert.ok((await lista.json()).dados.some((item: { id: string; status: string }) =>
        item.id === dados.id && item.status === 'PAUSADA'));
      const outra = await criarEstacao();
      await conferirErro(await iniciar({ clienteId: cliente.id, estacaoId: outra.id,
        modalidade: 'POS_PAGA' }), 409, 'CLIENT_ALREADY_HAS_ACTIVE_SESSION');
      await prisma.sessao.update({ where: { id: dados.id }, data: {
        status: 'FINALIZADA', finalizadoEm: new Date(),
      } });
      const consulta = await fetch(baseUrl + '/sessoes/' + dados.id, { headers });
      assert.equal(consulta.status, 200);
      assert.equal((await consulta.json()).dados.status, 'FINALIZADA');
      const listaFinal = await fetch(baseUrl + '/sessoes/ativas', { headers });
      assert.ok(!(await listaFinal.json()).dados.some((item: { id: string }) => item.id === dados.id));
    } finally {
      await parar();
    }
  });
});
