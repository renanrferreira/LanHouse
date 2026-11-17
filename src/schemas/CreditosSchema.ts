import { z } from 'zod';

const clienteIdSchema = z.string().trim().min(1).max(36);

export const RecargaSchema = z.object({
  clienteId: clienteIdSchema,
  valorCentavos: z.unknown(),
}).strict();

export const ExtratoParamsSchema = z.object({
  clienteId: clienteIdSchema,
}).strict();

export const CreditosQuerySchema = z.object({}).strict();
