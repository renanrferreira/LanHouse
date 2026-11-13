import type { RequestHandler } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/Env.js';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedUsuario } from '../services/AuthService.js';

const unauthorizedError = (): AppError =>
  new AppError(
    ErrorCodes.UNAUTHORIZED,
    'Token ausente, inválido ou expirado.',
  );

export const Authenticate: RequestHandler = async (
  request,
  response,
  next,
) => {
  const authorization = request.header('authorization');
  const match = authorization
    ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
        authorization,
      )
    : null;

  if (!match) {
    next(unauthorizedError());
    return;
  }

  let payload;

  try {
    ({ payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(env.JWT_SECRET),
      { algorithms: ['HS256'] },
    ));
  } catch {
    next(unauthorizedError());
    return;
  }

  if (typeof payload.sub !== 'string' || payload.perfil !== 'ATENDENTE') {
    next(unauthorizedError());
    return;
  }

  const usuario: AuthenticatedUsuario = {
    id: payload.sub,
    perfil: 'ATENDENTE',
  };

  response.locals.usuario = usuario;
  next();
};
