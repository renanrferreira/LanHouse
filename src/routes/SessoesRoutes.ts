import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { SessoesController } from '../controllers/SessoesController.js';
import { Authenticate } from '../middlewares/Authenticate.js';
import { SessoesRepository } from '../repositories/SessoesRepository.js';
import { SessoesService } from '../services/SessoesService.js';

// Monta as operações autenticadas de abertura e consulta de sessões.
export const createSessoesRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new SessoesController(new SessoesService(new SessoesRepository(prisma)));
  router.use(Authenticate);
  router.post('/', controller.iniciar);
  router.get('/ativas', controller.listarAtivas);
  router.get('/:id', controller.obterPorId);
  return router;
};
