import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { SessoesInicioSchema, SessoesParamsSchema, SessoesQuerySchema } from '../schemas/SessoesSchema.js';
import type { AuthenticatedUsuario } from '../services/AuthService.js';
import { SessoesService } from '../services/SessoesService.js';

export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  // Inicia uma sessão identificando o operador pelo token autenticado.
  iniciar: RequestHandler = async (request, response) => {
    this.validar(SessoesQuerySchema, request.query);
    const dados = this.validar(SessoesInicioSchema, request.body);
    const usuario: AuthenticatedUsuario = response.locals.usuario;
    const sessao = await this.sessoesService.iniciar(dados, usuario.id);
    response.status(201).json({ sucesso: true, dados: sessao });
  };

  // Retorna as sessões em andamento, incluindo as bloqueadas.
  listarAtivas: RequestHandler = async (request, response) => {
    this.validar(SessoesQuerySchema, request.query);
    const dados = await this.sessoesService.listarAtivas();
    response.status(200).json({ sucesso: true, dados });
  };

  // Retorna o registro detalhado de uma sessão.
  obterPorId: RequestHandler = async (request, response) => {
    this.validar(SessoesQuerySchema, request.query);
    const { id } = this.validar(SessoesParamsSchema, request.params);
    const dados = await this.sessoesService.obterPorId(id);
    response.status(200).json({ sucesso: true, dados });
  };

  // Converte entradas inválidas em erros públicos da API.
  private validar<T>(schema: ZodType<T>, entrada: unknown): T {
    const resultado = schema.safeParse(entrada);
    if (!resultado.success) {
      throw new AppError(ErrorCodes.INVALID_INPUT, 'Dados de sessão inválidos.');
    }
    return resultado.data;
  }
}
