import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { CreditosQuerySchema, ExtratoParamsSchema, RecargaSchema } from '../schemas/CreditosSchema.js';
import type { AuthenticatedUsuario } from '../services/AuthService.js';
import { CreditosService } from '../services/CreditosService.js';

export class CreditosController {
  constructor(private readonly creditosService: CreditosService) {}

  // Registra uma recarga identificando o operador pelo token autenticado.
  recarregar: RequestHandler = async (request, response) => {
    this.validar(CreditosQuerySchema, request.query);
    const dados = this.validar(RecargaSchema, request.body);
    const usuario: AuthenticatedUsuario = response.locals.usuario;
    const transacao = await this.creditosService.recarregar(
      dados.clienteId, dados.valorCentavos, usuario.id,
    );

    response.status(201).json({
      sucesso: true,
      dados: {
        transacaoId: transacao.id,
        clienteId: transacao.clienteId,
        tipo: transacao.tipo,
        valorCentavos: transacao.valorCentavos,
        novoSaldoCentavos: transacao.saldoAposCentavos,
        criadoEm: transacao.criadoEm,
      },
    });
  };

  // Retorna o extrato completo do cliente solicitado.
  obterExtrato: RequestHandler = async (request, response) => {
    this.validar(CreditosQuerySchema, request.query);
    const { clienteId } = this.validar(ExtratoParamsSchema, request.params);
    const dados = await this.creditosService.obterExtrato(clienteId);
    response.status(200).json({ sucesso: true, dados });
  };

  // Converte entradas inválidas em erros públicos da API.
  private validar<T>(schema: ZodType<T>, entrada: unknown): T {
    const resultado = schema.safeParse(entrada);
    if (!resultado.success) {
      throw new AppError(ErrorCodes.INVALID_INPUT, 'Dados de créditos inválidos.');
    }
    return resultado.data;
  }
}
