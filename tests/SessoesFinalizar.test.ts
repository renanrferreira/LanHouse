import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { hash } from 'bcryptjs';
import { SignJWT } from 'jose';
import { createPrismaClient } from '../src/database/PrismaClient.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createApp } = await import('../src/app.ts');
const databaseTestUrl = process.env.DATABASE_TEST_URL;
assert.ok(databaseTestUrl, 'DATABASE_TEST_URL deve apontar para o banco isolado.');
const url = new URL(databaseTestUrl);
assert.ok(['localhost', '127.0.0.1', '::1'].includes(url.hostname));
assert.equal(url.pathname, '/lanhouse_test');
const prisma = createPrismaClient(databaseTestUrl);
const clientesIds: string[] = [];
const estacoesIds: string[] = [];
let server: Server | undefined;
let baseUrl: string;
let headers: Record<string, string>;
let operadorId: string;
let tarifaCentavos: number;

// Prepara uma sessão exclusiva com duração controlada no banco isolado.
const criarSessao = async (modalidade = 'PRE_PAGA', duracaoMs = 61_000,
  saldoCentavos = 10_000, minutosContratados = 10) => {
  const cliente = await prisma.cliente.create({ data: {
    nome: 'Cliente fictício de encerramento', documento: randomUUID().slice(0, 20), saldoCentavos,
  } });
  clientesIds.push(cliente.id);
  const estacao = await prisma.estacao.create({ data: {
    numero: randomInt(10_000, 2_000_000_000), nome: 'Estação fictícia de encerramento',
    categoria: 'HIGH_END', status: 'OCUPADA',
    ipHost: 'fd01:' + randomUUID().replaceAll('-', '').slice(0, 4) + ':' +
      randomUUID().replaceAll('-', '').slice(0, 4) + '::1',
  } });
  estacoesIds.push(estacao.id);
  const sessao = await prisma.sessao.create({ data: {
    clienteId: cliente.id, estacaoId: estacao.id, operadorInicioId: operadorId,
    modalidade, status: 'ATIVA', iniciadoEm: new Date(Date.now() - duracaoMs),
    minutosContratados: modalidade === 'PRE_PAGA' ? minutosContratados : null,
  } });
  return { cliente, estacao, sessao };
};

// Solicita o encerramento pelo endpoint autenticado.
const finalizar = (id: string, dados: unknown = {}, cabecalhos = headers, query = '') =>
  fetch(baseUrl + '/sessoes/' + id + '/finalizar' + query, {
    method: 'POST', headers: cabecalhos, body: JSON.stringify(dados),
  });

// Confere o contrato público de erro.
const conferirErro = async (resposta: Response, status: number, codigo: string) => {
  assert.equal(resposta.status, status);
  const corpo = await resposta.json();
  assert.equal(corpo.sucesso, false);
  assert.equal(corpo.erro.codigo, codigo);
};

describe('Encerramento e tarifação de sessões', () => {
  before(async () => {
    await prisma.$connect();
    const operador = await prisma.usuario.create({ data: {
      nome: 'Atendente fictício de encerramento', login: 'fim_' + randomUUID(),
      senhaHash: await hash('senha_ficticia_finalizar', 10), perfil: 'ATENDENTE',
    } });
    operadorId = operador.id;
    const tarifa = await prisma.tarifa.findFirstOrThrow({ where: { categoria: 'HIGH_END', ativo: true } });
    tarifaCentavos = tarifa.valorPorMinutoCentavos;
    server = createServer(createApp(prisma));
    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
    const login = await fetch(baseUrl + '/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: operador.login, senha: 'senha_ficticia_finalizar' }),
    });
    assert.equal(login.status, 200);
    headers = { authorization: 'Bearer ' + (await login.json()).dados.token,
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
      await prisma.estacao.updateMany({ where: { id: { in: estacoesIds } },
        data: { ativo: false, status: 'INATIVA' } });
      await prisma.cliente.updateMany({ where: { id: { in: clientesIds } }, data: { ativo: false } });
      if (operadorId) await prisma.usuario.update({ where: { id: operadorId }, data: { ativo: false } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('encerra pré-paga em centavos, registra débito e operador e libera a estação', async () => {
    const { cliente, estacao, sessao } = await criarSessao();
    const resposta = await finalizar(sessao.id);
    assert.equal(resposta.status, 200);
    const corpo = await resposta.json();
    assert.equal(corpo.sucesso, true);
    assert.deepEqual(corpo.dados, {
      id: sessao.id, status: 'FINALIZADA', iniciadoEm: sessao.iniciadoEm.toISOString(),
      finalizadoEm: corpo.dados.finalizadoEm, minutosUtilizados: 2,
      tarifaAplicadaPorMinutoCentavos: tarifaCentavos, valorFinalCentavos: 2 * tarifaCentavos,
      pagoComSaldo: true, estacaoLiberada: true,
    });
    assert.match(corpo.dados.finalizadoEm, /Z$/);
    assert.ok(Math.abs(Date.now() - Date.parse(corpo.dados.finalizadoEm)) < 5000);
    const persistida = await prisma.sessao.findUniqueOrThrow({ where: { id: sessao.id } });
    assert.equal(persistida.status, 'FINALIZADA');
    assert.equal(persistida.operadorFimId, operadorId);
    assert.equal(persistida.finalizadoEm!.toISOString(), corpo.dados.finalizadoEm);
    assert.equal(persistida.minutosUtilizados, 2);
    assert.equal(persistida.valorFinalCentavos, 2 * tarifaCentavos);
    assert.equal(persistida.pagoComSaldo, true);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: estacao.id } })).status, 'DISPONIVEL');
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos,
      cliente.saldoCentavos - 2 * tarifaCentavos);
    const debito = await prisma.transacaoCredito.findUniqueOrThrow({ where: { sessaoId: sessao.id } });
    assert.equal(debito.tipo, 'DEBITO_SESSAO');
    assert.equal(debito.valorCentavos, 2 * tarifaCentavos);
    assert.equal(debito.clienteId, cliente.id);
    assert.equal(debito.operadorId, operadorId);
    assert.equal(debito.saldoAposCentavos, cliente.saldoCentavos - 2 * tarifaCentavos);
    await conferirErro(await finalizar(sessao.id), 409, 'SESSION_ALREADY_FINISHED');
    assert.deepEqual(await prisma.transacaoCredito.findUnique({ where: { id: debito.id } }), debito);
  });

  it('limita pré-paga pausada ao contratado e cobra pós-paga no balcão', async () => {
    const pre = await criarSessao('PRE_PAGA', 600_000, 10_000, 2);
    await prisma.sessao.update({ where: { id: pre.sessao.id }, data: { status: 'PAUSADA' } });
    const limitada = await finalizar(pre.sessao.id);
    assert.equal(limitada.status, 200);
    const dados = (await limitada.json()).dados;
    assert.equal(dados.minutosUtilizados, 2);
    assert.equal(dados.valorFinalCentavos, 2 * tarifaCentavos);
    const pos = await criarSessao('POS_PAGA', 121_000, 0);
    const resposta = await finalizar(pos.sessao.id);
    assert.equal(resposta.status, 200);
    const resultado = (await resposta.json()).dados;
    assert.equal(resultado.minutosUtilizados, 3);
    assert.equal(resultado.valorFinalCentavos, 3 * tarifaCentavos);
    assert.equal(resultado.pagoComSaldo, false);
    assert.equal(resultado.estacaoLiberada, true);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: pos.cliente.id } })).saldoCentavos, 0);
    assert.equal(await prisma.transacaoCredito.count({ where: { sessaoId: pos.sessao.id } }), 0);
  });

  it('isenta cancelamento técnico antes de 3 minutos e cobra a partir da carência', async () => {
    const curta = await criarSessao('PRE_PAGA', 150_000);
    const resposta = await finalizar(curta.sessao.id, { cancelamentoTecnico: true });
    assert.equal(resposta.status, 200);
    const dados = (await resposta.json()).dados;
    assert.equal(dados.status, 'CANCELADA');
    assert.equal(dados.minutosUtilizados, 3);
    assert.equal(dados.valorFinalCentavos, 0);
    assert.equal(dados.pagoComSaldo, false);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: curta.cliente.id } })).saldoCentavos,
      curta.cliente.saldoCentavos);
    assert.equal(await prisma.transacaoCredito.count({ where: { sessaoId: curta.sessao.id } }), 0);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: curta.estacao.id } })).status, 'DISPONIVEL');
    await conferirErro(await finalizar(curta.sessao.id), 409, 'SESSION_ALREADY_FINISHED');
    const longa = await criarSessao('PRE_PAGA', 181_000);
    const cobrada = await finalizar(longa.sessao.id, { cancelamentoTecnico: true });
    assert.equal(cobrada.status, 200);
    const normal = (await cobrada.json()).dados;
    assert.equal(normal.status, 'FINALIZADA');
    assert.equal(normal.valorFinalCentavos, 4 * tarifaCentavos);
  });

  it('valida autenticação e entradas e desfaz operações com saldo insuficiente ou falha no banco', async () => {
    const { cliente, estacao, sessao } = await criarSessao('PRE_PAGA', 61_000, 0);
    await conferirErro(await finalizar(sessao.id, {}, { 'content-type': 'application/json' }), 401, 'UNAUTHORIZED');
    for (const dados of [{ extra: 1 }, { operadorFimId: operadorId }, { cancelamentoTecnico: 'true' }, null, []]) {
      await conferirErro(await finalizar(sessao.id, dados), 400, 'INVALID_INPUT');
    }
    await conferirErro(await finalizar(sessao.id, {}, headers, '?extra=1'), 400, 'INVALID_INPUT');
    await conferirErro(await finalizar('x'.repeat(37)), 400, 'INVALID_INPUT');
    await conferirErro(await finalizar(randomUUID()), 404, 'SESSION_NOT_FOUND');
    await conferirErro(await finalizar(sessao.id), 422, 'INSUFFICIENT_FUNDS');
    assert.deepEqual(await prisma.sessao.findUnique({ where: { id: sessao.id } }), sessao);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: estacao.id } })).status, 'OCUPADA');
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos, 0);
    assert.equal(await prisma.transacaoCredito.count({ where: { sessaoId: sessao.id } }), 0);

    const falha = await criarSessao();
    const token = await new SignJWT({ perfil: 'ATENDENTE' }).setProtectedHeader({ alg: 'HS256' })
      .setSubject(randomUUID()).setIssuedAt().setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    await conferirErro(await finalizar(falha.sessao.id, {}, {
      ...headers, authorization: 'Bearer ' + token,
    }), 500, 'INTERNAL_SERVER_ERROR');
    assert.deepEqual(await prisma.sessao.findUnique({ where: { id: falha.sessao.id } }), falha.sessao);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: falha.cliente.id } })).saldoCentavos,
      falha.cliente.saldoCentavos);
    assert.equal((await prisma.estacao.findUniqueOrThrow({ where: { id: falha.estacao.id } })).status, 'OCUPADA');
    assert.equal(await prisma.transacaoCredito.count({ where: { sessaoId: falha.sessao.id } }), 0);
  });

  it('encerra uma única vez em requisições simultâneas sem duplicar o débito', async () => {
    const { cliente, sessao } = await criarSessao();
    const respostas = await Promise.all([finalizar(sessao.id), finalizar(sessao.id)]);
    assert.deepEqual(respostas.map(item => item.status).sort(), [200, 409]);
    await conferirErro(respostas.find(item => item.status === 409)!, 409, 'SESSION_ALREADY_FINISHED');
    assert.equal(await prisma.transacaoCredito.count({ where: { sessaoId: sessao.id } }), 1);
    assert.equal((await prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })).saldoCentavos,
      cliente.saldoCentavos - 2 * tarifaCentavos);
  });
});
