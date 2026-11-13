import type { RequestHandler } from 'express';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { LoginSchema } from '../schemas/AuthSchema.js';
import { AuthService } from '../services/AuthService.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login: RequestHandler = async (request, response) => {
    const validation = LoginSchema.safeParse(request.body);

    if (!validation.success) {
      const detalhes = validation.error.issues.map((issue) => {
        const campo =
          issue.path.join('.') ||
          (issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : 'body');
        const mensagem =
          issue.code === 'unrecognized_keys'
            ? 'Campo não permitido.'
            : 'Campo inválido.';

        return `${campo}: ${mensagem}`;
      });

      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        'Dados do login inválidos.',
        detalhes,
      );
    }

    const dados = await this.authService.autenticar(
      validation.data.login,
      validation.data.senha,
    );

    response.status(200).json({ sucesso: true, dados });
  };
}
