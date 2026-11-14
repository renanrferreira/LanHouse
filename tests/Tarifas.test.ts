import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { seedLanhouse } from '../prisma/seed.ts';
import { createPrismaClient } from '../src/database/PrismaClient.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createApp } = await import('../src/app.ts');

const databaseTestUrl =
  process.env.DATABASE_TEST_URL ??
  'mysql://lanhouse_app:senha_dev_local@127.0.0.1:3307/lanhouse_test';
const parsedDatabaseUrl = new URL(databaseTestUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));
const prisma = createPrismaClient(databaseTestUrl);
const app = createApp(prisma);
let server: Server | undefined;
let baseUrl: string;
let authorization: string;
let prismaConectado = false;
const idsTarifasTeste: string[] = [];

interface TarifaResposta {
  id: string;
  categoria: string;
  valorPorMinutoCentavos: number;
  ativo: boolean;
}

interface RespostaApi<T> {
  sucesso: boolean;
  dados: T;
  erro?: { codigo: string };
}

const cabecalhosJson = () => ({
  authorization,
  'content-type': 'application/json',
});

describe('CRUD de tarifas', () => {
  before(async () => {
    assert.equal(databaseName, 'lanhouse_test');
    await prisma.$connect();
    prismaConectado = true;
    await seedLanhouse(prisma);

    server = createServer(app);
    await new Promise<void>((resolve, reject) => {
      server?.once('error', reject);
      server?.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address() as AddressInfo | null;
    assert.ok(address);
    baseUrl = 'http://127.0.0.1:' + address.port;

    const login = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });
    const loginBody = (await login.json()) as RespostaApi<{
      token: string;
    }>;

    assert.equal(login.status, 200);
    authorization = 'Bearer ' + loginBody.dados.token;
  });

  after(async () => {
    try {
      if (server) {
        await new Promise<void>((resolve, reject) => {
          server?.close((error) => (error ? reject(error) : resolve()));
        });
      }

      if (prismaConectado && idsTarifasTeste.length > 0) {
        await prisma.tarifa.updateMany({
          where: { id: { in: idsTarifasTeste } },
          data: { ativo: false },
        });
      }
    } finally {
      if (prismaConectado) {
        await prisma.$disconnect();
      }
    }
  });

  it('valida centavos, preserva histórico e executa as cinco operações', async () => {
    const acessoSemToken = await fetch(baseUrl + '/tarifas');
    assert.equal(acessoSemToken.status, 401);
    assert.equal(
      ((await acessoSemToken.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'UNAUTHORIZED',
    );

    const valorDecimal = await fetch(baseUrl + '/tarifas', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({
        categoria: 'COMUM',
        valorPorMinutoCentavos: 10.5,
      }),
    });
    assert.equal(valorDecimal.status, 400);
    assert.equal(
      ((await valorDecimal.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'INVALID_INPUT',
    );

    const campoDesconhecido = await fetch(baseUrl + '/tarifas', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({
        categoria: 'COMUM',
        valorPorMinutoCentavos: 10,
        ativo: true,
      }),
    });
    assert.equal(campoDesconhecido.status, 400);

    const tarifaAnterior = await prisma.tarifa.create({
      data: {
        categoria: 'COMUM',
        valorPorMinutoCentavos: 777,
        ativo: true,
      },
    });
    idsTarifasTeste.push(tarifaAnterior.id);

    const criacao = await fetch(baseUrl + '/tarifas', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({
        categoria: 'COMUM',
        valorPorMinutoCentavos: 15,
      }),
    });
    const criadaResposta =
      (await criacao.json()) as RespostaApi<TarifaResposta>;

    assert.equal(criacao.status, 201);
    assert.equal(criadaResposta.sucesso, true);
    assert.equal(criadaResposta.dados.categoria, 'COMUM');
    assert.equal(criadaResposta.dados.valorPorMinutoCentavos, 15);
    assert.equal(criadaResposta.dados.ativo, true);
    idsTarifasTeste.push(criadaResposta.dados.id);

    const tarifaAnteriorPersistida = await prisma.tarifa.findUnique({
      where: { id: tarifaAnterior.id },
    });
    assert.ok(tarifaAnteriorPersistida);
    assert.equal(tarifaAnteriorPersistida.ativo, false);

    const lista = await fetch(baseUrl + '/tarifas', {
      headers: { authorization },
    });
    const listaBody = (await lista.json()) as RespostaApi<TarifaResposta[]>;
    assert.equal(lista.status, 200);
    assert.ok(
      listaBody.dados.some(
        (tarifa) => tarifa.id === criadaResposta.dados.id,
      ),
    );
    assert.ok(listaBody.dados.every((tarifa) => tarifa.ativo));
    assert.ok(
      !listaBody.dados.some((tarifa) => tarifa.id === tarifaAnterior.id),
    );

    const consultaInativa = await fetch(
      baseUrl + '/tarifas/' + tarifaAnterior.id,
      { headers: { authorization } },
    );
    const consultaInativaBody =
      (await consultaInativa.json()) as RespostaApi<TarifaResposta>;
    assert.equal(consultaInativa.status, 200);
    assert.equal(consultaInativaBody.dados.id, tarifaAnterior.id);
    assert.equal(consultaInativaBody.dados.ativo, false);

    const consultaInexistente = await fetch(
      baseUrl + '/tarifas/00000000-0000-4000-8000-000000000999',
      { headers: { authorization } },
    );
    assert.equal(consultaInexistente.status, 404);
    assert.equal(
      ((await consultaInexistente.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'RATE_NOT_FOUND',
    );

    const atualizacao = await fetch(
      baseUrl + '/tarifas/' + criadaResposta.dados.id,
      {
        method: 'PUT',
        headers: cabecalhosJson(),
        body: JSON.stringify({ valorPorMinutoCentavos: 23 }),
      },
    );
    const atualizadaResposta =
      (await atualizacao.json()) as RespostaApi<TarifaResposta>;
    assert.equal(atualizacao.status, 200);
    assert.equal(atualizadaResposta.dados.id, criadaResposta.dados.id);
    assert.equal(atualizadaResposta.dados.categoria, 'COMUM');
    assert.equal(atualizadaResposta.dados.valorPorMinutoCentavos, 23);

    const atualizacaoInativa = await fetch(
      baseUrl + '/tarifas/' + tarifaAnterior.id,
      {
        method: 'PUT',
        headers: cabecalhosJson(),
        body: JSON.stringify({ valorPorMinutoCentavos: 25 }),
      },
    );
    assert.equal(atualizacaoInativa.status, 404);
    assert.equal(
      ((await atualizacaoInativa.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'RATE_NOT_FOUND',
    );

    const exclusao = await fetch(
      baseUrl + '/tarifas/' + criadaResposta.dados.id,
      { method: 'DELETE', headers: { authorization } },
    );
    const exclusaoBody =
      (await exclusao.json()) as RespostaApi<{
        mensagem: string;
        ativo: boolean;
      }>;
    assert.equal(exclusao.status, 200);
    assert.equal(exclusaoBody.dados.ativo, false);

    const tarifaExcluida = await prisma.tarifa.findUnique({
      where: { id: criadaResposta.dados.id },
    });
    assert.ok(tarifaExcluida);
    assert.equal(tarifaExcluida.ativo, false);
  });
});
