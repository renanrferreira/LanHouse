import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { seedLanhouse } from '../prisma/seed.ts';
import { createPrismaClient } from '../src/database/PrismaClient.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createApp } = await import('../src/app.ts');
const databaseTestUrl = process.env.DATABASE_TEST_URL ??
  'mysql://lanhouse_app:senha_dev_local@127.0.0.1:3308/lanhouse_test';
const prisma = createPrismaClient(databaseTestUrl);
let server: Server | undefined;
let baseUrl: string;
let headers: Record<string, string>;
let operadorId: string;
const clientesIds: string[] = [];

// Envia uma recarga pela aplicação HTTP completa.
const recarregar = (clienteId: string, valorCentavos: unknown) => fetch(
  baseUrl + '/creditos/recarga',
  { method: 'POST', headers, body: JSON.stringify({ clienteId, valorCentavos }) },
);

describe('Créditos e transações financeiras', () => {
  before(async () => {
    const url = new URL(databaseTestUrl);
    assert.equal(url.hostname, '127.0.0.1');
    assert.equal(url.port, '3308');
    assert.equal(url.pathname, '/lanhouse_test');
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
      if (clientesIds.length) await prisma.cliente.updateMany({
        where: { id: { in: clientesIds } }, data: { ativo: false },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('soma centavos atomicamente, mantém histórico imutável e consulta extrato', async () => {
    assert.equal((await fetch(baseUrl + '/creditos/extrato/' + randomUUID())).status, 401);
    assert.equal((await fetch(baseUrl + '/creditos/recarga', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    })).status, 401);

    const cliente = await prisma.cliente.create({ data: {
      nome: 'Cliente fictício de créditos', documento: randomUUID().slice(0, 20),
    } });
    clientesIds.push(cliente.id);
    const extrato = () => fetch(baseUrl + '/creditos/extrato/' + cliente.id, { headers });
    const vazio = await extrato();
    assert.equal(vazio.status, 200);
    assert.deepEqual((await vazio.json()).dados, []);

    const primeira = await recarregar(cliente.id, 2001);
    assert.equal(primeira.status, 201);
    const { dados } = await primeira.json();
    assert.equal(dados.clienteId, cliente.id);
    assert.equal(dados.tipo, 'RECARGA');
    assert.equal(dados.valorCentavos, 2001);
    assert.equal(dados.novoSaldoCentavos, 2001);
    assert.match(dados.criadoEm, /Z$/);
    const registro = await prisma.transacaoCredito.findUniqueOrThrow({ where: { id: dados.transacaoId } });
    assert.equal(registro.operadorId, operadorId);
    assert.equal(registro.saldoAposCentavos, 2001);
    assert.equal(registro.sessaoId, null);

    const simultaneas = await Promise.all([recarregar(cliente.id, 101), recarregar(cliente.id, 203)]);
    for (const resposta of simultaneas) assert.equal(resposta.status, 201);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos, 2305);
    assert.deepEqual(await prisma.transacaoCredito.findUnique({ where: { id: registro.id } }), registro);
    const lista = (await (await extrato()).json()).dados;
    assert.equal(lista.length, 3);
    assert.deepEqual(lista.map((item: { id: string }) => item.id),
      (await prisma.transacaoCredito.findMany({ where: { clienteId: cliente.id },
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }] })).map(item => item.id));
    assert.ok(lista.every((item: { clienteId: string; operadorId: string }) =>
      item.clienteId === cliente.id && item.operadorId === operadorId));

    for (const valor of [0, -1, 1.5, '100', null, 2147483648, 2147483647]) {
      const invalida = await recarregar(cliente.id, valor);
      assert.equal(invalida.status, 400);
      assert.equal((await invalida.json()).erro.codigo, 'INVALID_CREDIT_AMOUNT');
    }
    const extra = await fetch(baseUrl + '/creditos/recarga', {
      method: 'POST', headers, body: JSON.stringify({ clienteId: cliente.id,
        valorCentavos: 100, operadorId }),
    });
    assert.equal(extra.status, 400);
    assert.equal((await extra.json()).erro.codigo, 'INVALID_INPUT');
    assert.equal((await fetch(baseUrl + '/creditos/extrato/' + cliente.id + '?extra=1', { headers })).status, 400);
    const ausente = await recarregar(randomUUID(), 100);
    assert.equal(ausente.status, 404);
    assert.equal((await ausente.json()).erro.codigo, 'CLIENT_NOT_FOUND');
    assert.equal((await fetch(baseUrl + '/creditos/extrato/' + randomUUID(), { headers })).status, 404);
    assert.equal(await prisma.transacaoCredito.count({ where: { clienteId: cliente.id } }), 3);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos, 2305);

    for (const method of ['PUT', 'DELETE']) {
      assert.equal((await fetch(baseUrl + '/creditos/' + registro.id, { method, headers })).status, 404);
    }
    await prisma.cliente.update({ where: { id: cliente.id }, data: { ativo: false } });
    assert.equal((await recarregar(cliente.id, 100)).status, 404);
    assert.equal((await extrato()).status, 200);
    assert.deepEqual((await (await extrato()).json()).dados, lista);
  });
});
