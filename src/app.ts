import express, { type Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { ErrorHandler } from './middlewares/ErrorHandler.js';
import { createAuthRouter } from './routes/AuthRoutes.js';

export const createApp = (prisma: PrismaClient): Express => {
  const app = express();

  app.use(express.json());
  app.use('/auth', createAuthRouter(prisma));
  app.use(ErrorHandler);

  return app;
};
