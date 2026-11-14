import type { RequestHandler } from 'express';
import { z, type ZodType } from 'zod';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import {
  AtualizarClienteSchema,
  ClienteIdSchema,
  CriarClienteSchema,
  ListarClientesQuerySchema,
} from '../schemas/ClientesSchema.js';
import { ClientesService } from '../services/ClientesService.js';

export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // Cadastra um cliente e retorna HTTP 201.
  criar: RequestHandler = async (request, response) => {
    const dadosEntrada = this.validar(CriarClienteSchema, request.body);
    const dados = await this.clientesService.criar(dadosEntrada);

    response.status(201).json({ sucesso: true, dados });
  };

  // Lista clientes ativos com os metadados de paginação.
  listar: RequestHandler = async (request, response) => {
    const consulta = this.validar(ListarClientesQuerySchema, request.query);
    const resultado = await this.clientesService.listar(consulta);

    response.status(200).json({ sucesso: true, ...resultado });
  };

  // Consulta um cliente ativo pelo identificador.
  obter: RequestHandler = async (request, response) => {
    const { id } = this.validar(ClienteIdSchema, request.params);
    const dados = await this.clientesService.obter(id);

    response.status(200).json({ sucesso: true, dados });
  };

  // Substitui os dados cadastrais completos de um cliente.
  atualizar: RequestHandler = async (request, response) => {
    const { id } = this.validar(ClienteIdSchema, request.params);
    const dadosEntrada = this.validar(AtualizarClienteSchema, request.body);
    const dados = await this.clientesService.atualizar(id, dadosEntrada);

    response.status(200).json({ sucesso: true, dados });
  };

  // Desativa logicamente um cliente sem excluir o registro.
  desativar: RequestHandler = async (request, response) => {
    const { id } = this.validar(ClienteIdSchema, request.params);
    await this.clientesService.desativar(id);

    response.status(200).json({
      sucesso: true,
      dados: { mensagem: 'Cliente desativado com sucesso.', ativo: false },
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

        return `${campo}: ${mensagem}`;
      });

      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        'Dados do cliente inválidos.',
        detalhes,
      );
    }

    return resultado.data;
  }
}
