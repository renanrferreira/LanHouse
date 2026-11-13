export const ErrorCodes = {
  INVALID_INPUT: { codigo: 'INVALID_INPUT', statusCode: 400 },
  INVALID_CREDIT_AMOUNT: { codigo: 'INVALID_CREDIT_AMOUNT', statusCode: 400 },
  INVALID_CREDENTIALS: { codigo: 'INVALID_CREDENTIALS', statusCode: 401 },
  UNAUTHORIZED: { codigo: 'UNAUTHORIZED', statusCode: 401 },
  FORBIDDEN: { codigo: 'FORBIDDEN', statusCode: 403 },
  CLIENT_NOT_FOUND: { codigo: 'CLIENT_NOT_FOUND', statusCode: 404 },
  STATION_NOT_FOUND: { codigo: 'STATION_NOT_FOUND', statusCode: 404 },
  RATE_NOT_FOUND: { codigo: 'RATE_NOT_FOUND', statusCode: 404 },
  SESSION_NOT_FOUND: { codigo: 'SESSION_NOT_FOUND', statusCode: 404 },
  DOCUMENT_ALREADY_EXISTS: { codigo: 'DOCUMENT_ALREADY_EXISTS', statusCode: 409 },
  STATION_NUMBER_ALREADY_EXISTS: {
    codigo: 'STATION_NUMBER_ALREADY_EXISTS',
    statusCode: 409,
  },
  STATION_IP_ALREADY_EXISTS: { codigo: 'STATION_IP_ALREADY_EXISTS', statusCode: 409 },
  CLIENT_ALREADY_HAS_ACTIVE_SESSION: {
    codigo: 'CLIENT_ALREADY_HAS_ACTIVE_SESSION',
    statusCode: 409,
  },
  STATION_NOT_AVAILABLE: { codigo: 'STATION_NOT_AVAILABLE', statusCode: 409 },
  SESSION_ALREADY_FINISHED: { codigo: 'SESSION_ALREADY_FINISHED', statusCode: 409 },
  INSUFFICIENT_FUNDS: { codigo: 'INSUFFICIENT_FUNDS', statusCode: 422 },
  INTERNAL_SERVER_ERROR: { codigo: 'INTERNAL_SERVER_ERROR', statusCode: 500 },
} as const;

export type ErrorCodeDefinition =
  (typeof ErrorCodes)[keyof typeof ErrorCodes];
