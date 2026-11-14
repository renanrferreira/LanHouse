import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { TarifasController } from '../controllers/TarifasController.js';
import { Authenticate } from '../middlewares/Authenticate.js';
import { TarifasRepository } from '../repositories/TarifasRepository.js';
import { TarifasService } from '../services/TarifasService.js';

// Monta o CRUD de tarifas e protege todas as operações.
export const createTarifasRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const tarifasController = new TarifasController(
    new TarifasService(new TarifasRepository(prisma)),
  );

  router.use(Authenticate);
  router.post('/', tarifasController.criar);
  router.get('/', tarifasController.listar);
  router.get('/:id', tarifasController.obter);
  router.put('/:id', tarifasController.atualizar);
  router.delete('/:id', tarifasController.desativar);

  return router;
};
