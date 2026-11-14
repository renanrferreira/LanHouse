import type { ErrorRequestHandler } from 'express';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';

const isMalformedJsonError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  error.type === 'entity.parse.failed';

export const ErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      sucesso: false,
      erro: {
        codigo: error.codigo,
        mensagem: error.message,
        detalhes: error.detalhes,
      },
    });
    return;
  }

  if (isMalformedJsonError(error)) {
    response.status(ErrorCodes.INVALID_INPUT.statusCode).json({
      sucesso: false,
      erro: {
        codigo: ErrorCodes.INVALID_INPUT.codigo,
        mensagem: 'Corpo JSON inválido.',
        detalhes: [],
      },
    });
    return;
  }

  response.status(ErrorCodes.INTERNAL_SERVER_ERROR.statusCode).json({
    sucesso: false,
    erro: {
      codigo: ErrorCodes.INTERNAL_SERVER_ERROR.codigo,
      mensagem: 'Ocorreu um erro inesperado no servidor.',
      detalhes: [],
    },
  });
};
