import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

export const createPrismaClient = (databaseUrl: string): PrismaClient => {
  const parsedDatabaseUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.slice(1));

  if (!databaseName) {
    throw new Error('DATABASE_URL deve indicar um banco MySQL.');
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: parsedDatabaseUrl.hostname,
      port: Number(parsedDatabaseUrl.port || 3306),
      user: decodeURIComponent(parsedDatabaseUrl.username),
      password: decodeURIComponent(parsedDatabaseUrl.password),
      database: databaseName,
      connectionLimit: 5,
    }),
  });
};
