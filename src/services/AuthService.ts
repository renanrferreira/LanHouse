import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import type { PrismaClient } from '@prisma/client';
import { env } from '../config/Env.js';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';

export type AuthenticatedUsuario = {
  id: string;
  perfil: 'ATENDENTE';
};

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async autenticar(login: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { login },
      select: {
        id: true,
        nome: true,
        senhaHash: true,
        perfil: true,
        ativo: true,
      },
    });

    if (
      !usuario ||
      !usuario.ativo ||
      usuario.perfil !== 'ATENDENTE' ||
      !(await bcrypt.compare(senha, usuario.senhaHash))
    ) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        'Login ou senha incorretos.',
      );
    }

    const token = await new SignJWT({ perfil: 'ATENDENTE' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(usuario.id)
      .setIssuedAt()
      .setExpirationTime(env.JWT_EXPIRES_IN)
      .sign(new TextEncoder().encode(env.JWT_SECRET));

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        perfil: 'ATENDENTE' as const,
      },
    };
  }
}
