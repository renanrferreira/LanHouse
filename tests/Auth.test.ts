import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { jwtVerify, SignJWT } from 'jose';
import { after, before, describe, it } from 'node:test';
import { seedLanhouse } from '../prisma/seed.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createAuthRouter } = await import('../src/routes/AuthRoutes.ts');
const { Authenticate } = await import('../src/middlewares/Authenticate.ts');
const { ErrorHandler } = await import('../src/middlewares/ErrorHandler.ts');

const databaseTestUrl =
  process.env.DATABASE_TEST_URL ??
  'mysql://lanhouse_app:senha_dev_local@127.0.0.1:3307/lanhouse_test';
const parsedDatabaseUrl = new URL(databaseTestUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: parsedDatabaseUrl.hostname,
    port: Number(parsedDatabaseUrl.port || 3306),
    user: decodeURIComponent(parsedDatabaseUrl.username),
    password: decodeURIComponent(parsedDatabaseUrl.password),
    database: databaseName,
    connectionLimit: 1,
  }),
});

const app = express();
app.use(express.json());
app.use('/auth', createAuthRouter(prisma));
app.use('/rate-limited-auth', createAuthRouter(prisma));
app.get('/protected', Authenticate, (_request, response) => {
  response.json({ sucesso: true, dados: response.locals.usuario });
});
app.use(ErrorHandler);

let server: Server | undefined;
let baseUrl: string;

describe('Autenticação de atendentes', () => {
  before(async () => {
    assert.equal(databaseName, 'lanhouse_test');
    await prisma.$connect();
    await seedLanhouse(prisma);

    server = createServer(app);
    await new Promise<void>((resolve, reject) => {
      server?.once('error', reject);
      server?.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address() as AddressInfo | null;
    assert.ok(address);
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    try {
      if (!server) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('autentica o atendente e retorna um JWT com validade de até oito horas', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.sucesso, true);
    assert.equal(body.dados.usuario.nome, 'Atendente Padrão');
    assert.equal(body.dados.usuario.perfil, 'ATENDENTE');
    assert.equal(typeof body.dados.usuario.id, 'string');
    assert.deepEqual(Object.keys(body.dados.usuario).sort(), [
      'id',
      'nome',
      'perfil',
    ]);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload, protectedHeader } = await jwtVerify(
      body.dados.token,
      secret,
      { algorithms: ['HS256'] },
    );

    assert.equal(protectedHeader.alg, 'HS256');
    assert.equal(payload.sub, body.dados.usuario.id);
    assert.equal(payload.perfil, 'ATENDENTE');
    assert.ok(payload.iat);
    assert.ok(payload.exp);
    assert.ok(payload.exp - payload.iat <= 8 * 60 * 60);
    assert.ok(payload.exp > payload.iat);
  });

  it('recusa credenciais inválidas com INVALID_CREDENTIALS', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'incorreta' }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      sucesso: false,
      erro: {
        codigo: 'INVALID_CREDENTIALS',
        mensagem: 'Login ou senha incorretos.',
        detalhes: [],
      },
    });
  });

  it('rejeita campos desconhecidos no corpo do login', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        login: 'atendente',
        senha: 'senha123',
        perfil: 'ADMIN',
      }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.sucesso, false);
    assert.equal(body.erro.codigo, 'INVALID_INPUT');
  });

  it('autoriza uma requisição protegida com token válido', async () => {
    const token = await new SignJWT({ perfil: 'ATENDENTE' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('00000000-0000-4000-8000-000000000001')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const response = await fetch(`${baseUrl}/protected`, {
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      sucesso: true,
      dados: {
        id: '00000000-0000-4000-8000-000000000001',
        perfil: 'ATENDENTE',
      },
    });
  });

  it('recusa token ausente ou inválido com UNAUTHORIZED', async () => {
    for (const authorization of [undefined, 'Bearer token-invalido']) {
      const response = await fetch(`${baseUrl}/protected`, {
        headers: authorization ? { authorization } : {},
      });

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.sucesso, false);
      assert.equal(body.erro.codigo, 'UNAUTHORIZED');
    }
  });

  it('limita cinco logins por IP e envia Retry-After ao exceder o limite', async () => {
    const loginUrl = `${baseUrl}/rate-limited-auth/login`;
    const successfulLogin = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });

    assert.equal(successfulLogin.status, 200);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const failedLogin = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'atendente', senha: 'incorreta' }),
      });

      assert.equal(failedLogin.status, 401);
    }

    const limitedResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'incorreta' }),
    });

    assert.equal(limitedResponse.status, 429);
    assert.ok(Number(limitedResponse.headers.get('retry-after')) > 0);
    assert.deepEqual(await limitedResponse.json(), {
      sucesso: false,
      erro: {
        codigo: 'RATE_LIMIT_EXCEEDED',
        mensagem: 'Limite de tentativas de login excedido. Tente novamente mais tarde.',
        detalhes: [],
      },
    });
  });
});
