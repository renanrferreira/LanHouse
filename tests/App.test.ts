import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { after, before, describe, it } from 'node:test';
import { seedLanhouse } from '../prisma/seed.ts';

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

const { createApp } = await import('../src/app.ts');

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

const app = createApp(prisma);
let server: Server | undefined;
let baseUrl: string;

describe('Inicialização da aplicação HTTP', () => {
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

  it('monta POST /auth/login e processa o corpo JSON', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.sucesso, true);
    assert.equal(body.dados.usuario.perfil, 'ATENDENTE');
    assert.equal(typeof body.dados.token, 'string');
  });

  it('encaminha erros de rota ao middleware global', async () => {
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
});
