import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { EstacoesController } from '../controllers/EstacoesController.js';
import { Authenticate } from '../middlewares/Authenticate.js';
import { EstacoesRepository } from '../repositories/EstacoesRepository.js';
import { EstacoesService } from '../services/EstacoesService.js';

// Monta o CRUD de estações e protege todas as operações.
export const createEstacoesRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const estacoesController = new EstacoesController(
    new EstacoesService(new EstacoesRepository(prisma)),
  );

  router.use(Authenticate);
  router.post('/', estacoesController.criar);
  router.get('/', estacoesController.listar);
  router.get('/:id', estacoesController.obter);
  router.put('/:id', estacoesController.atualizar);
  router.delete('/:id', estacoesController.desativar);
  router.patch('/:id/status', estacoesController.atualizarStatus);

  return router;
};
