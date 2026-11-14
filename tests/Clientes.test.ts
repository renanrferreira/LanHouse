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

// Gera um CPF fictício com dígitos verificadores válidos.
const gerarCpfTeste = (): string => {
  const base = randomInt(100_000_000, 1_000_000_000).toString();
  const calcularDigito = (digitos: string): string => {
    const soma = [...digitos].reduce(
      (total, digito, indice) =>
        total + Number(digito) * (digitos.length + 1 - indice),
      0,
    );
    const resto = soma % 11;

    return resto < 2 ? '0' : String(11 - resto);
  };

  const primeiroDigito = calcularDigito(base);
  const digitosParciais = `${base}${primeiroDigito}`;

  return `${digitosParciais}${calcularDigito(digitosParciais)}`;
};

// Formata um CPF fictício para cobrir a entrada com máscara.
const mascararCpf = (cpf: string): string =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

describe('CRUD de clientes', () => {
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

  it('executa as cinco operações, valida CPF único e desativa sem apagar o cliente', async () => {
    const acessoNegado = await fetch(`${baseUrl}/clientes`);
    assert.equal(acessoNegado.status, 401);

    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'atendente', senha: 'senha123' }),
    });
    const loginBody = await login.json();

    assert.equal(login.status, 200);
    const authorization = `Bearer ${loginBody.dados.token}`;
    const headers = {
      authorization,
      'content-type': 'application/json',
    };
    const primeiroCpf = gerarCpfTeste();
    const segundoCpf = gerarCpfTeste();
    const terceiroCpf = gerarCpfTeste();
    const idsCriados: string[] = [];

    try {
      const cpfInvalido = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nome: 'Cliente Teste', documento: '11111111111' }),
      });
      assert.equal(cpfInvalido.status, 400);
      assert.equal((await cpfInvalido.json()).erro.codigo, 'INVALID_INPUT');

      const campoDesconhecido = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: 'Cliente Teste Inválido',
          documento: mascararCpf(terceiroCpf),
          saldoCentavos: 500,
        }),
      });
      assert.equal(campoDesconhecido.status, 400);
      assert.equal(
        (await campoDesconhecido.json()).erro.codigo,
        'INVALID_INPUT',
      );

      const criacao = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: 'Cliente Teste Um',
          documento: mascararCpf(primeiroCpf),
        }),
      });
      const clienteCriado = await criacao.json();

      assert.equal(criacao.status, 201);
      assert.equal(clienteCriado.sucesso, true);
      assert.equal(clienteCriado.dados.documento, primeiroCpf);
      assert.equal(clienteCriado.dados.saldoCentavos, 0);
      assert.equal(clienteCriado.dados.ativo, true);
      assert.equal(clienteCriado.dados.telefone, null);
      assert.equal(clienteCriado.dados.email, null);
      idsCriados.push(clienteCriado.dados.id);

      const consulta = await fetch(
        `${baseUrl}/clientes/${clienteCriado.dados.id}`,
        { headers: { authorization } },
      );
      assert.equal(consulta.status, 200);
      assert.equal((await consulta.json()).dados.id, clienteCriado.dados.id);

      const listagem = await fetch(
        `${baseUrl}/clientes?pagina=1&itensPorPagina=5&busca=${mascararCpf(primeiroCpf)}`,
        { headers: { authorization } },
      );
      const listagemBody = await listagem.json();
      assert.equal(listagem.status, 200);
      assert.ok(
        listagemBody.dados.some(
          (cliente: { id: string }) => cliente.id === clienteCriado.dados.id,
        ),
      );
      assert.equal(listagemBody.paginacao.pagina, 1);
      assert.equal(listagemBody.paginacao.itensPorPagina, 5);

      const cadastroDuplicado = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: 'Cliente Duplicado',
          documento: primeiroCpf,
        }),
      });
      assert.equal(cadastroDuplicado.status, 409);
      assert.equal(
        (await cadastroDuplicado.json()).erro.codigo,
        'DOCUMENT_ALREADY_EXISTS',
      );

      const segundoCadastro = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: 'Cliente Teste Dois',
          documento: mascararCpf(segundoCpf),
        }),
      });
      const segundoBody = await segundoCadastro.json();
      assert.equal(segundoCadastro.status, 201);
      idsCriados.push(segundoBody.dados.id);

      const atualizacaoDuplicada = await fetch(
        `${baseUrl}/clientes/${segundoBody.dados.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            nome: 'Cliente Teste Dois Editado',
            documento: mascararCpf(primeiroCpf),
            telefone: null,
            email: null,
          }),
        },
      );
      assert.equal(atualizacaoDuplicada.status, 409);
      assert.equal(
        (await atualizacaoDuplicada.json()).erro.codigo,
        'DOCUMENT_ALREADY_EXISTS',
      );

      const atualizacao = await fetch(
        `${baseUrl}/clientes/${segundoBody.dados.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            nome: 'Cliente Teste Dois Editado',
            documento: mascararCpf(terceiroCpf),
            telefone: null,
            email: 'cliente.teste@example.com',
          }),
        },
      );
      const clienteAtualizado = await atualizacao.json();
      assert.equal(atualizacao.status, 200);
      assert.equal(clienteAtualizado.dados.nome, 'Cliente Teste Dois Editado');
      assert.equal(clienteAtualizado.dados.documento, terceiroCpf);
      assert.equal(clienteAtualizado.dados.telefone, null);
      assert.equal(clienteAtualizado.dados.email, 'cliente.teste@example.com');

      const desativacao = await fetch(
        `${baseUrl}/clientes/${clienteCriado.dados.id}`,
        { method: 'DELETE', headers: { authorization } },
      );
      assert.equal(desativacao.status, 200);
      assert.equal((await desativacao.json()).dados.ativo, false);

      const clientePersistido = await prisma.cliente.findUnique({
        where: { id: clienteCriado.dados.id },
      });
      assert.ok(clientePersistido);
      assert.equal(clientePersistido.ativo, false);
      assert.equal(clientePersistido.saldoCentavos, 0);

      const consultaInativo = await fetch(
        `${baseUrl}/clientes/${clienteCriado.dados.id}`,
        { headers: { authorization } },
      );
      assert.equal(consultaInativo.status, 404);
      assert.equal((await consultaInativo.json()).erro.codigo, 'CLIENT_NOT_FOUND');

      const listagemInativo = await fetch(
        `${baseUrl}/clientes?busca=${primeiroCpf}`,
        { headers: { authorization } },
      );
      const clientesInativos = await listagemInativo.json();
      assert.equal(listagemInativo.status, 200);
      assert.equal(clientesInativos.paginacao.totalItens, 0);
      assert.equal(clientesInativos.dados.length, 0);

      const cpfInativoDuplicado = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: 'Cliente CPF Inativo',
          documento: primeiroCpf,
        }),
      });
      assert.equal(cpfInativoDuplicado.status, 409);
    } finally {
      if (idsCriados.length > 0) {
        await prisma.cliente.updateMany({
          where: { id: { in: idsCriados } },
          data: { ativo: false },
        });
      }
    }
  });
});
