import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { CreditosController } from '../controllers/CreditosController.js';
import { Authenticate } from '../middlewares/Authenticate.js';
import { CreditosRepository } from '../repositories/CreditosRepository.js';
import { CreditosService } from '../services/CreditosService.js';

// Monta as operações autenticadas de recarga e extrato.
export const createCreditosRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new CreditosController(
    new CreditosService(new CreditosRepository(prisma)),
  );

  router.use(Authenticate);
  router.post('/recarga', controller.recarregar);
  router.get('/extrato/:clienteId', controller.obterExtrato);

  return router;
};
