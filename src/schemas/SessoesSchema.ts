import { z } from 'zod';

const identificadorSchema = z.string().trim().min(1).max(36);

export const SessoesInicioSchema = z.discriminatedUnion('modalidade', [
  z.object({
    clienteId: identificadorSchema,
    estacaoId: identificadorSchema,
    modalidade: z.literal('PRE_PAGA'),
    minutosContratados: z.number().int().positive().max(2147483647),
  }).strict(),
  z.object({
    clienteId: identificadorSchema,
    estacaoId: identificadorSchema,
    modalidade: z.literal('POS_PAGA'),
  }).strict(),
]);

export const SessoesParamsSchema = z.object({ id: identificadorSchema }).strict();
export const SessoesFinalizarSchema = z.object({
  cancelamentoTecnico: z.boolean().optional(),
}).strict();
export const SessoesQuerySchema = z.object({}).strict();
export type SessoesInicio = z.infer<typeof SessoesInicioSchema>;
