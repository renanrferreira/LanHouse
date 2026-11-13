import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { describe, it } from 'node:test';

const databaseTestUrl =
  process.env.DATABASE_TEST_URL ??
  'mysql://lanhouse_app:senha_dev_local@127.0.0.1:3307/lanhouse_test';
const parsedDatabaseUrl = new URL(databaseTestUrl);
const expectedDatabaseName = decodeURIComponent(
  parsedDatabaseUrl.pathname.slice(1),
);
const adapter = new PrismaMariaDb({
  host: parsedDatabaseUrl.hostname,
  port: Number(parsedDatabaseUrl.port || 3306),
  user: decodeURIComponent(parsedDatabaseUrl.username),
  password: decodeURIComponent(parsedDatabaseUrl.password),
  database: expectedDatabaseName,
  connectionLimit: 1,
});
const prisma = new PrismaClient({ adapter });

const expectedTables = [
  'clientes',
  'estacoes',
  'sessoes',
  'tarifas',
  'transacoes_credito',
  'usuarios',
];

describe('Integridade do banco de teste', () => {
  it('conecta ao banco isolado e encontra as tabelas do modelo', async () => {
    assert.equal(expectedDatabaseName, 'lanhouse_test');

    try {
      await prisma.$connect();

      const databaseRows = await prisma.$queryRaw<
        Array<{ databaseName: string | null }>
      >`SELECT DATABASE() AS databaseName`;

      assert.equal(databaseRows[0]?.databaseName, expectedDatabaseName);

      const tableRows = await prisma.$queryRaw<
        Array<{ tableName: string }>
      >`SELECT TABLE_NAME AS tableName
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()`;
      const actualTables = tableRows
        .map(({ tableName }) => tableName)
        .filter((tableName) => tableName !== '_prisma_migrations')
        .sort();

      assert.deepEqual(actualTables, expectedTables);
    } finally {
      await prisma.$disconnect();
    }
  });
});
