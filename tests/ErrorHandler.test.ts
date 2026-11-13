import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { after, before, describe, it } from 'node:test';
import { AppError } from '../src/errors/AppError.ts';
import { ErrorCodes } from '../src/constants/ErrorCodes.ts';
import { ErrorHandler } from '../src/middlewares/ErrorHandler.ts';

const app = express();
let server: Server | undefined;
let baseUrl: string;

app.get('/application-error', (_request, _response, next) => {
  next(
    new AppError(ErrorCodes.INVALID_INPUT, 'Dados de entrada inválidos.', [
      'nome: campo obrigatório',
    ]),
  );
});

app.get('/unexpected-error', (_request, _response, next) => {
  next(new Error('detalhe interno que não pode chegar ao cliente'));
});

app.use(ErrorHandler);

describe('Tratamento e catálogo de erros', () => {
  before(async () => {
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
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('mapeia os 18 códigos para os status HTTP do contrato', () => {
    assert.deepEqual(
      Object.entries(ErrorCodes).map(([key, definition]) => [
        key,
        definition.statusCode,
      ]),
      [
        ['INVALID_INPUT', 400],
        ['INVALID_CREDIT_AMOUNT', 400],
        ['INVALID_CREDENTIALS', 401],
        ['UNAUTHORIZED', 401],
        ['FORBIDDEN', 403],
        ['CLIENT_NOT_FOUND', 404],
        ['STATION_NOT_FOUND', 404],
        ['RATE_NOT_FOUND', 404],
        ['SESSION_NOT_FOUND', 404],
        ['DOCUMENT_ALREADY_EXISTS', 409],
        ['STATION_NUMBER_ALREADY_EXISTS', 409],
        ['STATION_IP_ALREADY_EXISTS', 409],
        ['CLIENT_ALREADY_HAS_ACTIVE_SESSION', 409],
        ['STATION_NOT_AVAILABLE', 409],
        ['SESSION_ALREADY_FINISHED', 409],
        ['INSUFFICIENT_FUNDS', 422],
        ['RATE_LIMIT_EXCEEDED', 429],
        ['INTERNAL_SERVER_ERROR', 500],
      ],
    );
  });

  it('responde erros da aplicação no formato padronizado', async () => {
    const response = await fetch(`${baseUrl}/application-error`);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      sucesso: false,
      erro: {
        codigo: 'INVALID_INPUT',
        mensagem: 'Dados de entrada inválidos.',
        detalhes: ['nome: campo obrigatório'],
      },
    });
  });

  it('oculta a mensagem interna de erros inesperados', async () => {
    const response = await fetch(`${baseUrl}/unexpected-error`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(body, {
      sucesso: false,
      erro: {
        codigo: 'INTERNAL_SERVER_ERROR',
        mensagem: 'Ocorreu um erro inesperado no servidor.',
        detalhes: [],
      },
    });
    assert.equal(JSON.stringify(body).includes('detalhe interno'), false);
  });
});
