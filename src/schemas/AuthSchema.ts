import { z } from 'zod';

export const LoginSchema = z
  .object({
    login: z.string().trim().min(1).max(50),
    senha: z.string().min(1),
  })
  .strict();
