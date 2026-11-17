import { env } from './config/Env.js';
import { createPrismaClient } from './database/PrismaClient.js';
import { createApp } from './app.js';
import { SessoesRepository } from './repositories/SessoesRepository.js';
import { SessoesService } from './services/SessoesService.js';

const prisma = createPrismaClient(env.DATABASE_URL);
await prisma.$connect();

const app = createApp(prisma);
const sessoesService = new SessoesService(new SessoesRepository(prisma));
const pararMonitoramento = sessoesService.iniciarMonitoramento();
const server = app.listen(env.PORT, () => {
  console.log(`API iniciada na porta ${env.PORT}.`);
});

server.once('close', async () => {
  await pararMonitoramento();
  await prisma.$disconnect();
});

// Interrompe o recebimento de requisições e encerra os recursos da aplicação.
const encerrar = () => { server.close(); };
process.once('SIGINT', encerrar);
process.once('SIGTERM', encerrar);
