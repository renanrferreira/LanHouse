import express, { type Express } from 'express';
import helmet from 'helmet';
import type { PrismaClient } from '@prisma/client';
import { ErrorCodes } from './constants/ErrorCodes.js';
import { AppError } from './errors/AppError.js';
import { ErrorHandler } from './middlewares/ErrorHandler.js';
import { createAuthRouter } from './routes/AuthRoutes.js';
import { createClientesRouter } from './routes/ClientesRoutes.js';
import { createCreditosRouter } from './routes/CreditosRoutes.js';
import { createEstacoesRouter } from './routes/EstacoesRoutes.js';
import { createTarifasRouter } from './routes/TarifasRoutes.js';

export const createApp = (prisma: PrismaClient): Express => {
  const app = express();

  app.use(helmet({ xFrameOptions: { action: 'deny' } }));
  app.use(express.json());
  app.use('/auth', createAuthRouter(prisma));
  app.use('/clientes', createClientesRouter(prisma));
  app.use('/creditos', createCreditosRouter(prisma));
  app.use('/estacoes', createEstacoesRouter(prisma));
  app.use('/tarifas', createTarifasRouter(prisma));
  app.use((_request, _response, next) => {
    next(
      new AppError(ErrorCodes.ROUTE_NOT_FOUND, 'Rota não encontrada.'),
    );
  });
  app.use(ErrorHandler);

  return app;
};
