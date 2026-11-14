import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';

const app = createApp({} as PrismaClient);
let server: Server;
let baseUrl: string;

describe('Segurança e respostas HTTP da aplicação', () => {
  before(async () => {
    server = createServer(app);

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address() as AddressInfo | null;
    assert.ok(address);
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('adiciona os cabeçalhos de segurança definidos para a API', async () => {
    const response = await fetch(`${baseUrl}/rota-inexistente`);

    assert.ok(response.headers.get('content-security-policy'));
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('strict-transport-security'));
  });

  it('retorna erro JSON padronizado para uma rota inexistente', async () => {
    const response = await fetch(`${baseUrl}/rota-inexistente`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      sucesso: false,
      erro: {
        codigo: 'ROUTE_NOT_FOUND',
        mensagem: 'Rota não encontrada.',
        detalhes: [],
      },
    });
  });

  it('retorna INVALID_INPUT para um corpo JSON malformado', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      sucesso: false,
      erro: {
        codigo: 'INVALID_INPUT',
        mensagem: 'Corpo JSON inválido.',
        detalhes: [],
      },
    });
  });
});
