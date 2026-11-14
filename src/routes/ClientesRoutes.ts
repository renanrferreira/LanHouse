import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { Authenticate } from '../middlewares/Authenticate.js';
import { ClientesController } from '../controllers/ClientesController.js';
import { ClientesRepository } from '../repositories/ClientesRepository.js';
import { ClientesService } from '../services/ClientesService.js';

// Monta o CRUD de clientes com autenticação para todas as rotas.
export const createClientesRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const clientesController = new ClientesController(
    new ClientesService(new ClientesRepository(prisma)),
  );

  router.use(Authenticate);
  router.post('/', clientesController.criar);
  router.get('/', clientesController.listar);
  router.get('/:id', clientesController.obter);
  router.put('/:id', clientesController.atualizar);
  router.delete('/:id', clientesController.desativar);

  return router;
};
