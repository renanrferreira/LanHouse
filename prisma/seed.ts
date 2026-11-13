import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ATTENDANT_ID = '00000000-0000-4000-8000-000000000001';
const ATTENDANT_LOGIN = 'atendente';
const DEFAULT_PASSWORD = 'senha123';
const BCRYPT_ROUNDS = 10;

const stations = [
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

const tariffs = [
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

export async function seedLanhouse(prisma: PrismaClient): Promise<void> {
  const senhaHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  await prisma.usuario.upsert({
    where: { login: ATTENDANT_LOGIN },
    create: {
      id: ATTENDANT_ID,
      nome: 'Atendente Padrão',
      login: ATTENDANT_LOGIN,
      senhaHash,
      perfil: 'ATENDENTE',
      ativo: true,
    },
    update: {
      nome: 'Atendente Padrão',
      senhaHash,
      perfil: 'ATENDENTE',
      ativo: true,
    },
  });

  for (const station of stations) {
    const { id, ...stationData } = station;

    await prisma.estacao.upsert({
      where: { id },
      create: station,
      update: stationData,
    });
  }

  for (const tariff of tariffs) {
    const { id, ...tariffData } = tariff;

    await prisma.tarifa.upsert({
      where: { id },
      create: tariff,
      update: tariffData,
    });
  }
}

function createPrismaClient(databaseUrl: string): PrismaClient {
  const parsedDatabaseUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));

  if (!['lanhouse_dev', 'lanhouse_test'].includes(databaseName)) {
    throw new Error('O seed só pode ser executado em lanhouse_dev ou lanhouse_test.');
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: parsedDatabaseUrl.hostname,
      port: Number(parsedDatabaseUrl.port || 3306),
      user: decodeURIComponent(parsedDatabaseUrl.username),
      password: decodeURIComponent(parsedDatabaseUrl.password),
      database: databaseName,
      connectionLimit: 1,
    }),
  });
}

async function runSeed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não está configurada.');
  }

  const prisma = createPrismaClient(databaseUrl);

  try {
    await prisma.$connect();
    await seedLanhouse(prisma);
    console.log('Seed inicial aplicado.');
  } finally {
    await prisma.$disconnect();
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  await runSeed();
}
