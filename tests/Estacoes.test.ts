import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
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
const idsEstacoesTeste: string[] = [];

interface EstacaoResposta {
  id: string;
  numero: number;
  nome: string;
  categoria: string;
  ipHost: string;
  status: string;
  ativo: boolean;
}

interface RespostaApi<T> {
  sucesso: boolean;
  dados: T;
  erro?: { codigo: string };
}

const gerarDadosEstacao = () => ({
  numero: randomInt(10_000, 2_000_000_000),
  nome: 'Estação de teste',
  categoria: 'COMUM',
  ipHost:
    '172.20.' + randomInt(1, 255) + '.' + randomInt(1, 255),
});

const cabecalhosJson = () => ({
  authorization,
  'content-type': 'application/json',
});

describe('CRUD de estações', () => {
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

      if (prismaConectado && idsEstacoesTeste.length > 0) {
        await prisma.estacao.updateMany({
          where: { id: { in: idsEstacoesTeste } },
          data: { ativo: false, status: 'INATIVA' },
        });
      }
    } finally {
      if (prismaConectado) {
        await prisma.$disconnect();
      }
    }
  });

  it('exige autenticação e recusa entradas inválidas ou campos desconhecidos', async () => {
    const acessoSemToken = await fetch(baseUrl + '/estacoes');
    assert.equal(acessoSemToken.status, 401);
    assert.equal(
      ((await acessoSemToken.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'UNAUTHORIZED',
    );

    const dadosInvalidos = gerarDadosEstacao();
    const ipInvalido = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({ ...dadosInvalidos, ipHost: 'ip-invalido' }),
    });
    assert.equal(ipInvalido.status, 400);
    assert.equal(
      ((await ipInvalido.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'INVALID_INPUT',
    );

    const campoDesconhecido = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({ ...gerarDadosEstacao(), saldoCentavos: 100 }),
    });
    assert.equal(campoDesconhecido.status, 400);
    assert.equal(
      ((await campoDesconhecido.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'INVALID_INPUT',
    );
  });

  it('executa o CRUD, mantém estações inativas visíveis e valida unicidade e status', async () => {
    const dadosPrimeira = gerarDadosEstacao();
    const criacao = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify(dadosPrimeira),
    });
    const primeiraResposta =
      (await criacao.json()) as RespostaApi<EstacaoResposta>;

    assert.equal(criacao.status, 201);
    assert.equal(primeiraResposta.sucesso, true);
    assert.equal(primeiraResposta.dados.numero, dadosPrimeira.numero);
    assert.equal(primeiraResposta.dados.status, 'DISPONIVEL');
    assert.equal(primeiraResposta.dados.ativo, true);
    idsEstacoesTeste.push(primeiraResposta.dados.id);

    const consulta = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id,
      { headers: { authorization } },
    );
    assert.equal(consulta.status, 200);
    assert.equal(
      ((await consulta.json()) as RespostaApi<EstacaoResposta>).dados.id,
      primeiraResposta.dados.id,
    );

    const listagem = await fetch(baseUrl + '/estacoes', {
      headers: { authorization },
    });
    const listagemBody =
      (await listagem.json()) as RespostaApi<EstacaoResposta[]>;
    assert.equal(listagem.status, 200);
    assert.ok(
      listagemBody.dados.some(
        (estacao) => estacao.id === primeiraResposta.dados.id,
      ),
    );

    const dadosSegunda = gerarDadosEstacao();
    const segundaCriacao = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify(dadosSegunda),
    });
    const segundaResposta =
      (await segundaCriacao.json()) as RespostaApi<EstacaoResposta>;
    assert.equal(segundaCriacao.status, 201);
    idsEstacoesTeste.push(segundaResposta.dados.id);

    const numeroDuplicado = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({
        ...gerarDadosEstacao(),
        numero: dadosPrimeira.numero,
      }),
    });
    assert.equal(numeroDuplicado.status, 409);
    assert.equal(
      ((await numeroDuplicado.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'STATION_NUMBER_ALREADY_EXISTS',
    );

    const ipDuplicado = await fetch(baseUrl + '/estacoes', {
      method: 'POST',
      headers: cabecalhosJson(),
      body: JSON.stringify({
        ...gerarDadosEstacao(),
        ipHost: dadosPrimeira.ipHost,
      }),
    });
    assert.equal(ipDuplicado.status, 409);
    assert.equal(
      ((await ipDuplicado.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'STATION_IP_ALREADY_EXISTS',
    );

    const ipAtualizado = gerarDadosEstacao().ipHost;
    const atualizacao = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id,
      {
        method: 'PUT',
        headers: cabecalhosJson(),
        body: JSON.stringify({
          nome: 'Estação gamer editada',
          categoria: 'GAMER',
          ipHost: ipAtualizado,
        }),
      },
    );
    const atualizacaoBody =
      (await atualizacao.json()) as RespostaApi<EstacaoResposta>;
    assert.equal(atualizacao.status, 200);
    assert.equal(atualizacaoBody.dados.nome, 'Estação gamer editada');
    assert.equal(atualizacaoBody.dados.categoria, 'GAMER');
    assert.equal(atualizacaoBody.dados.ipHost, ipAtualizado);
    assert.equal(atualizacaoBody.dados.numero, dadosPrimeira.numero);

    const ipAtualizacaoDuplicado = await fetch(
      baseUrl + '/estacoes/' + segundaResposta.dados.id,
      {
        method: 'PUT',
        headers: cabecalhosJson(),
        body: JSON.stringify({
          nome: 'Estação editada',
          categoria: 'COMUM',
          ipHost: ipAtualizado,
        }),
      },
    );
    assert.equal(ipAtualizacaoDuplicado.status, 409);
    assert.equal(
      ((await ipAtualizacaoDuplicado.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'STATION_IP_ALREADY_EXISTS',
    );

    const manutencao = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id + '/status',
      {
        method: 'PATCH',
        headers: cabecalhosJson(),
        body: JSON.stringify({ status: 'MANUTENCAO' }),
      },
    );
    assert.equal(manutencao.status, 200);
    assert.equal(
      ((await manutencao.json()) as RespostaApi<EstacaoResposta>).dados.status,
      'MANUTENCAO',
    );

    const retornoDisponivel = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id + '/status',
      {
        method: 'PATCH',
        headers: cabecalhosJson(),
        body: JSON.stringify({ status: 'DISPONIVEL' }),
      },
    );
    assert.equal(retornoDisponivel.status, 200);
    assert.equal(
      ((await retornoDisponivel.json()) as RespostaApi<EstacaoResposta>).dados
        .status,
      'DISPONIVEL',
    );

    const statusControladoPorSessao = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id + '/status',
      {
        method: 'PATCH',
        headers: cabecalhosJson(),
        body: JSON.stringify({ status: 'OCUPADA' }),
      },
    );
    assert.equal(statusControladoPorSessao.status, 400);
    assert.equal(
      ((await statusControladoPorSessao.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'INVALID_INPUT',
    );

    const dadosOcupada = gerarDadosEstacao();
    const ocupada = await prisma.estacao.create({
      data: { ...dadosOcupada, status: 'OCUPADA' },
    });
    idsEstacoesTeste.push(ocupada.id);

    const exclusaoOcupada = await fetch(
      baseUrl + '/estacoes/' + ocupada.id,
      { method: 'DELETE', headers: { authorization } },
    );
    assert.equal(exclusaoOcupada.status, 409);
    assert.equal(
      ((await exclusaoOcupada.json()) as RespostaApi<never> & {
        erro: { codigo: string };
      }).erro.codigo,
      'STATION_NOT_AVAILABLE',
    );

    const statusInativa = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id + '/status',
      {
        method: 'PATCH',
        headers: cabecalhosJson(),
        body: JSON.stringify({ status: 'INATIVA' }),
      },
    );
    assert.equal(statusInativa.status, 200);
    assert.equal(
      ((await statusInativa.json()) as RespostaApi<EstacaoResposta>).dados
        .status,
      'INATIVA',
    );

    const exclusao = await fetch(
      baseUrl + '/estacoes/' + primeiraResposta.dados.id,
      { method: 'DELETE', headers: { authorization } },
    );
    const exclusaoBody =
      (await exclusao.json()) as RespostaApi<{
        mensagem: string;
        ativo: boolean;
      }>;
    assert.equal(exclusao.status, 200);
    assert.equal(exclusaoBody.dados.ativo, false);

    const estacaoPersistida = await prisma.estacao.findUnique({
      where: { id: primeiraResposta.dados.id },
    });
    assert.ok(estacaoPersistida);
    assert.equal(estacaoPersistida.ativo, false);
    assert.equal(estacaoPersistida.status, 'INATIVA');

    const listagemComInativa = await fetch(baseUrl + '/estacoes', {
      headers: { authorization },
    });
    const dadosComInativa =
      (await listagemComInativa.json()) as RespostaApi<EstacaoResposta[]>;
    assert.ok(
      dadosComInativa.dados.some(
        (estacao) =>
          estacao.id === primeiraResposta.dados.id && estacao.ativo === false,
      ),
    );
  });
});
