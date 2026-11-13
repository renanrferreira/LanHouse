import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AuthController } from '../controllers/AuthController.js';
import { AppError } from '../errors/AppError.js';
import { AuthService } from '../services/AuthService.js';

export const createAuthRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const authController = new AuthController(new AuthService(prisma));
  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(
        new AppError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Limite de tentativas de login excedido. Tente novamente mais tarde.',
        ),
      );
    },
  });

  router.post('/login', loginRateLimiter, authController.login);

  return router;
};
