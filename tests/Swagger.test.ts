import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';

const app = createApp({} as PrismaClient);
let server: Server;
let baseUrl: string;

describe('Documentação interativa com Swagger / OpenAPI', () => {
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

  it('retorna status 200 e conteúdo HTML no Swagger UI em GET /docs', async () => {
    const response = await fetch(`${baseUrl}/docs/`);

    assert.equal(response.status, 200);
    const contentType = response.headers.get('content-type') ?? '';
    assert.ok(contentType.includes('text/html'));
    const body = await response.text();
    assert.ok(body.includes('swagger-ui'));
  });

  it('retorna a especificação OpenAPI 3.0 em JSON com status 200 em GET /docs/json', async () => {
    const response = await fetch(`${baseUrl}/docs/json`);

    assert.equal(response.status, 200);
    const contentType = response.headers.get('content-type') ?? '';
    assert.ok(contentType.includes('application/json'));

    const spec = (await response.json()) as {
      openapi: string;
      info: { title: string; version: string };
      components?: {
        securitySchemes?: {
          bearerAuth?: {
            type: string;
            scheme: string;
            bearerFormat: string;
          };
        };
        schemas?: Record<string, unknown>;
      };
      paths: Record<string, Record<string, unknown>>;
    };

    assert.ok(spec.openapi.startsWith('3.0'));
    assert.ok(spec.info.title.length > 0);
    assert.equal(spec.components?.securitySchemes?.bearerAuth?.type, 'http');
    assert.equal(spec.components?.securitySchemes?.bearerAuth?.scheme, 'bearer');
    assert.equal(
      spec.components?.securitySchemes?.bearerAuth?.bearerFormat,
      'JWT',
    );
  });

  it('documenta exatamente os 24 endpoints e métodos aprovados na especificação', async () => {
    const response = await fetch(`${baseUrl}/docs/json`);
    assert.equal(response.status, 200);

    const spec = (await response.json()) as {
      paths: Record<string, Record<string, unknown>>;
    };

    const allowedMethods = new Set(['get', 'post', 'put', 'delete', 'patch']);
    const operations: string[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of Object.keys(pathItem)) {
        if (allowedMethods.has(method.toLowerCase())) {
          operations.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    assert.equal(operations.length, 24);

    const expectedEndpoints = [
      'POST /auth/login',
      'GET /clientes',
      'POST /clientes',
      'GET /clientes/{id}',
      'PUT /clientes/{id}',
      'DELETE /clientes/{id}',
      'GET /estacoes',
      'POST /estacoes',
      'GET /estacoes/{id}',
      'PUT /estacoes/{id}',
      'DELETE /estacoes/{id}',
      'PATCH /estacoes/{id}/status',
      'POST /sessoes',
      'GET /sessoes/ativas',
      'GET /sessoes/{id}',
      'POST /sessoes/{id}/finalizar',
      'POST /creditos/recarga',
      'GET /creditos/extrato/{clienteId}',
      'POST /tarifas',
      'GET /tarifas',
      'GET /tarifas/{id}',
      'PUT /tarifas/{id}',
      'DELETE /tarifas/{id}',
      'GET /docs',
    ];

    for (const endpoint of expectedEndpoints) {
      assert.ok(
        operations.includes(endpoint),
        `Esperado encontrar a operação ${endpoint} no Swagger OpenAPI`,
      );
    }
  });

  it('define schemas estruturados para erros, respostas e requisições', async () => {
    const response = await fetch(`${baseUrl}/docs/json`);
    const spec = (await response.json()) as {
      components?: { schemas?: Record<string, unknown> };
    };

    const schemas = spec.components?.schemas ?? {};
    assert.ok(schemas.ErroResposta);
    assert.ok(schemas.LoginRequisicao);
    assert.ok(schemas.LoginResposta);
    assert.ok(schemas.ClienteCriarRequisicao);
    assert.ok(schemas.ClienteResposta);
    assert.ok(schemas.EstacaoCriarRequisicao);
    assert.ok(schemas.EstacaoResposta);
    assert.ok(schemas.TarifaCriarRequisicao);
    assert.ok(schemas.TarifaResposta);
    assert.ok(schemas.SessaoIniciarRequisicao);
    assert.ok(schemas.SessaoResposta);
    assert.ok(schemas.RecargaRequisicao);
  });
});
