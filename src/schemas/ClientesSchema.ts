import { z } from 'zod';

// Valida os dígitos verificadores e rejeita sequências repetidas.
const validarCpf = (cpf: string): boolean => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcularDigito = (digitos: string): string => {
    const soma = [...digitos].reduce(
      (total, digito, indice) =>
        total + Number(digito) * (digitos.length + 1 - indice),
      0,
    );
    const resto = soma % 11;

    return resto < 2 ? '0' : String(11 - resto);
  };

  const primeiroDigito = calcularDigito(cpf.slice(0, 9));
  const segundoDigito = calcularDigito(cpf.slice(0, 9) + primeiroDigito);

  return cpf === cpf.slice(0, 9) + primeiroDigito + segundoDigito;
};

const documentoSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido.')
  .transform((documento) => documento.replace(/[.-]/g, ''))
  .refine(validarCpf, 'CPF inválido.');

const nomeSchema = z.string().trim().min(1).max(120);
const telefoneSchema = z.string().trim().max(20).nullable();
const emailSchema = z.string().trim().email().max(120).nullable();

export const CriarClienteSchema = z
  .object({
    nome: nomeSchema,
    documento: documentoSchema,
    telefone: telefoneSchema.optional().transform((telefone) => telefone ?? null),
    email: emailSchema.optional().transform((email) => email ?? null),
  })
  .strict();

export const AtualizarClienteSchema = z
  .object({
    nome: nomeSchema,
    documento: documentoSchema,
    telefone: telefoneSchema,
    email: emailSchema,
  })
  .strict();

export const ListarClientesQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1),
    itensPorPagina: z.coerce.number().int().min(1).max(100).default(20),
    busca: z.string().trim().min(1).optional(),
  })
  .strict();

export const ClienteIdSchema = z
  .object({ id: z.string().trim().min(1).max(36) })
  .strict();

export type CriarClienteInput = z.infer<typeof CriarClienteSchema>;
export type AtualizarClienteInput = z.infer<typeof AtualizarClienteSchema>;
export type ListarClientesQuery = z.infer<typeof ListarClientesQuerySchema>;
