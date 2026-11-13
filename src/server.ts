import { env } from './config/Env.js';
import { createPrismaClient } from './database/PrismaClient.js';
import { createApp } from './app.js';

const prisma = createPrismaClient(env.DATABASE_URL);
await prisma.$connect();

const app = createApp(prisma);
app.listen(env.PORT, () => {
  console.log(`API iniciada na porta ${env.PORT}.`);
});
