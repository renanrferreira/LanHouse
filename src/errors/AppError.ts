import type { ErrorCodeDefinition } from '../constants/ErrorCodes.js';

export class AppError extends Error {
  readonly codigo: ErrorCodeDefinition['codigo'];
  readonly statusCode: ErrorCodeDefinition['statusCode'];
  readonly detalhes: string[];

  constructor(
    definition: ErrorCodeDefinition,
    message: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.codigo = definition.codigo;
    this.statusCode = definition.statusCode;
    this.detalhes = details;
  }
}
