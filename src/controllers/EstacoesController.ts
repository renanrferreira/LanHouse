import type { RequestHandler } from 'express';
import { type ZodType } from 'zod';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import {
  AtualizarEstacaoSchema,
  AtualizarStatusEstacaoSchema,
  CriarEstacaoSchema,
  EstacaoIdSchema,
  ListarEstacoesQuerySchema,
} from '../schemas/EstacoesSchema.js';
import { EstacoesService } from '../services/EstacoesService.js';

export class EstacoesController {
  constructor(private readonly estacoesService: EstacoesService) {}

  // Cadastra uma estação com status inicial disponível.
  criar: RequestHandler = async (request, response) => {
    const dadosEntrada = this.validar(CriarEstacaoSchema, request.body);
    const dados = await this.estacoesService.criar(dadosEntrada);

    response.status(201).json({ sucesso: true, dados });
  };

  // Lista todas as estações e seus estados atuais.
  listar: RequestHandler = async (request, response) => {
    this.validar(ListarEstacoesQuerySchema, request.query);
    const dados = await this.estacoesService.listar();

    response.status(200).json({ sucesso: true, dados });
  };

  // Consulta uma estação pelo identificador.
  obter: RequestHandler = async (request, response) => {
    const { id } = this.validar(EstacaoIdSchema, request.params);
    const dados = await this.estacoesService.obter(id);

    response.status(200).json({ sucesso: true, dados });
  };

  // Substitui os dados cadastrais editáveis de uma estação.
  atualizar: RequestHandler = async (request, response) => {
    const { id } = this.validar(EstacaoIdSchema, request.params);
    const dadosEntrada = this.validar(AtualizarEstacaoSchema, request.body);
    const dados = await this.estacoesService.atualizar(id, dadosEntrada);

    response.status(200).json({ sucesso: true, dados });
  };

  // Desativa logicamente uma estação sem remover seu registro.
  desativar: RequestHandler = async (request, response) => {
    const { id } = this.validar(EstacaoIdSchema, request.params);
    await this.estacoesService.desativar(id);

    response.status(200).json({
      sucesso: true,
      dados: { mensagem: 'Estação desativada.', ativo: false },
    });
  };

  // Atualiza o status operacional permitido pelo contrato.
  atualizarStatus: RequestHandler = async (request, response) => {
    const { id } = this.validar(EstacaoIdSchema, request.params);
    const dadosEntrada = this.validar(
      AtualizarStatusEstacaoSchema,
      request.body,
    );
    const dados = await this.estacoesService.atualizarStatus(id, dadosEntrada);

    response.status(200).json({
      sucesso: true,
      dados: { id: dados.id, status: dados.status },
    });
  };

  // Converte entradas inválidas no formato padronizado da API.
  private validar<T>(schema: ZodType<T>, entrada: unknown): T {
    const resultado = schema.safeParse(entrada);

    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((issue) => {
        const campo =
          issue.path.join('.') ||
          (issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : 'entrada');
        const mensagem =
          issue.code === 'unrecognized_keys'
            ? 'Campo não permitido.'
            : 'Campo inválido.';

        return campo + ': ' + mensagem;
      });

      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        'Dados da estação inválidos.',
        detalhes,
      );
    }

    return resultado.data;
  }
}
