import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { describe, it } from 'node:test';
import { seedLanhouse } from '../prisma/seed.js';

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

const expectedStations = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    numero: 1,
    nome: 'Estação Comum 01',
    categoria: 'COMUM',
    status: 'DISPONIVEL',
    ipHost: '192.168.0.101',
    ativo: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    numero: 2,
    nome: 'Estação Gamer 01',
    categoria: 'GAMER',
    status: 'DISPONIVEL',
    ipHost: '192.168.0.102',
    ativo: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    numero: 3,
    nome: 'Estação High-End 01',
    categoria: 'HIGH_END',
    status: 'DISPONIVEL',
    ipHost: '192.168.0.103',
    ativo: true,
  },
];

const expectedTariffs = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    categoria: 'COMUM',
    valorPorMinutoCentavos: 10,
    ativo: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    categoria: 'GAMER',
    valorPorMinutoCentavos: 20,
    ativo: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    categoria: 'HIGH_END',
    valorPorMinutoCentavos: 35,
    ativo: true,
  },
];

describe('Seed inicial', () => {
  it('cria dados fictícios, armazena senha em bcrypt e permite reexecução', async () => {
    assert.equal(expectedDatabaseName, 'lanhouse_test');

    try {
      await prisma.$connect();
      await seedLanhouse(prisma);
      await seedLanhouse(prisma);

      const atendente = await prisma.usuario.findUnique({
        where: { login: 'atendente' },
      });

      assert.ok(atendente);
      assert.equal(atendente.nome, 'Atendente Padrão');
      assert.equal(atendente.perfil, 'ATENDENTE');
      assert.equal(atendente.ativo, true);
      assert.notEqual(atendente.senhaHash, 'senha123');

      const bcrypt = (await import('bcryptjs')).default;
      assert.match(atendente.senhaHash, /^\$2[ab]\$10\$/);
      assert.equal(await bcrypt.compare('senha123', atendente.senhaHash), true);
      assert.equal(
        await prisma.usuario.count({ where: { login: 'atendente' } }),
        1,
      );

      const stations = await prisma.estacao.findMany({
        where: { id: { in: expectedStations.map(({ id }) => id) } },
        select: {
          id: true,
          numero: true,
          nome: true,
          categoria: true,
          status: true,
          ipHost: true,
          ativo: true,
        },
        orderBy: { numero: 'asc' },
      });

      assert.deepEqual(stations, expectedStations);
      assert.equal(stations.length, 3);

      const tariffs = await prisma.tarifa.findMany({
        where: { id: { in: expectedTariffs.map(({ id }) => id) } },
        select: {
          id: true,
          categoria: true,
          valorPorMinutoCentavos: true,
          ativo: true,
        },
        orderBy: { categoria: 'asc' },
      });

      assert.deepEqual(
        tariffs,
        [...expectedTariffs].sort((left, right) =>
          left.categoria.localeCompare(right.categoria),
        ),
      );
      assert.equal(tariffs.length, 3);
    } finally {
      await prisma.$disconnect();
    }
  });
});
