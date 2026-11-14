import { z } from 'zod';

const nomeSchema = z.string().trim().min(1).max(50);
const categoriaSchema = z.enum(['COMUM', 'GAMER', 'HIGH_END']);
const ipHostSchema = z.union([z.ipv4(), z.ipv6()]);

export const CriarEstacaoSchema = z
  .object({
    numero: z.number().int().positive(),
    nome: nomeSchema,
    categoria: categoriaSchema,
    ipHost: ipHostSchema,
  })
  .strict();

export const AtualizarEstacaoSchema = z
  .object({
    nome: nomeSchema,
    categoria: categoriaSchema,
    ipHost: ipHostSchema,
  })
  .strict();

export const AtualizarStatusEstacaoSchema = z
  .object({
    status: z.enum(['DISPONIVEL', 'MANUTENCAO', 'INATIVA']),
  })
  .strict();

export const EstacaoIdSchema = z
  .object({ id: z.string().trim().min(1).max(36) })
  .strict();

export const ListarEstacoesQuerySchema = z.object({}).strict();

export type CriarEstacaoInput = z.infer<typeof CriarEstacaoSchema>;
export type AtualizarEstacaoInput = z.infer<typeof AtualizarEstacaoSchema>;
export type AtualizarStatusEstacaoInput = z.infer<
  typeof AtualizarStatusEstacaoSchema
>;
