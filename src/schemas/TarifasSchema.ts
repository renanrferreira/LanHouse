import { z } from 'zod';

const categoriaSchema = z.enum(['COMUM', 'GAMER', 'HIGH_END']);
const valorPorMinutoCentavosSchema = z.number().int().positive();

export const CriarTarifaSchema = z
  .object({
    categoria: categoriaSchema,
    valorPorMinutoCentavos: valorPorMinutoCentavosSchema,
  })
  .strict();

export const AtualizarTarifaSchema = z
  .object({
    valorPorMinutoCentavos: valorPorMinutoCentavosSchema,
  })
  .strict();

export const TarifaIdSchema = z
  .object({ id: z.string().trim().min(1).max(36) })
  .strict();

export const ListarTarifasQuerySchema = z.object({}).strict();

export type CriarTarifaInput = z.infer<typeof CriarTarifaSchema>;
export type AtualizarTarifaInput = z.infer<typeof AtualizarTarifaSchema>;
