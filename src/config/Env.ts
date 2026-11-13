import 'dotenv/config';
import { z } from 'zod';

process.env.TZ = 'UTC';

const jwtExpiresInSchema = z.string().refine(
  (value) => {
    const match = /^(\d+)(s|m|h)$/.exec(value);

    if (!match) {
      return false;
    }

    const amount = Number(match[1]);
    const multiplier = match[2] === 'h' ? 3600 : match[2] === 'm' ? 60 : 1;

    return (
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      amount * multiplier <= 8 * 60 * 60
    );
  },
  { message: 'JWT_EXPIRES_IN deve ser uma duração positiva de até 8 horas.' },
);

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
  JWT_EXPIRES_IN: jwtExpiresInSchema.default('8h'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidFields = [
    ...new Set(parsedEnv.error.issues.map(({ path }) => path.join('.'))),
  ];

  throw new Error(`Variáveis de ambiente inválidas: ${invalidFields.join(', ')}`);
}

export const env = parsedEnv.data;
