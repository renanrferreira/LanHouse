import 'dotenv/config';
import { z } from 'zod';

process.env.TZ = 'UTC';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('mysql://')),
  DATABASE_TEST_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('mysql://')),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidFields = [
    ...new Set(parsedEnv.error.issues.map(({ path }) => path.join('.'))),
  ];

  throw new Error(`Variáveis de ambiente inválidas: ${invalidFields.join(', ')}`);
}

export const env = parsedEnv.data;
