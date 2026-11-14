import type { Tarifa } from '@prisma/client';
import type { RequestHandler } from 'express';
import { type ZodType } from 'zod';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import {
  AtualizarTarifaSchema,
  CriarTarifaSchema,
  ListarTarifasQuerySchema,
  TarifaIdSchema,
} from '../schemas/TarifasSchema.js';
import { TarifasService } from '../services/TarifasService.js';

type TarifaResposta = Pick<
  Tarifa,
  'id' | 'categoria' | 'valorPorMinutoCentavos' | 'ativo'
>;

export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  // Cadastra a nova tarifa vigente da categoria.
  criar: RequestHandler = async (request, response) => {
    const dadosEntrada = this.validar(CriarTarifaSchema, request.body);
    const tarifa = await this.tarifasService.criar(dadosEntrada);

    response.status(201).json({ sucesso: true, dados: this.formatar(tarifa) });
  };

  // Lista as tarifas vigentes das categorias.
  listar: RequestHandler = async (request, response) => {
    this.validar(ListarTarifasQuerySchema, request.query);
    const tarifas = await this.tarifasService.listar();

    response.status(200).json({
      sucesso: true,
      dados: tarifas.map((tarifa) => this.formatar(tarifa)),
    });
  };

  // Consulta uma tarifa pelo identificador, inclusive inativa.
  obter: RequestHandler = async (request, response) => {
    const { id } = this.validar(TarifaIdSchema, request.params);
    const tarifa = await this.tarifasService.obter(id);

    response.status(200).json({ sucesso: true, dados: this.formatar(tarifa) });
  };

  // Atualiza o valor por minuto de uma tarifa ativa.
  atualizar: RequestHandler = async (request, response) => {
    const { id } = this.validar(TarifaIdSchema, request.params);
    const dadosEntrada = this.validar(AtualizarTarifaSchema, request.body);
    const tarifa = await this.tarifasService.atualizar(id, dadosEntrada);

    response.status(200).json({ sucesso: true, dados: this.formatar(tarifa) });
  };

  // Desativa logicamente uma tarifa ativa.
  desativar: RequestHandler = async (request, response) => {
    const { id } = this.validar(TarifaIdSchema, request.params);
    await this.tarifasService.desativar(id);

    response.status(200).json({
      sucesso: true,
      dados: { mensagem: 'Tarifa desativada com sucesso.', ativo: false },
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
        'Dados da tarifa inválidos.',
        detalhes,
      );
    }

    return resultado.data;
  }

  // Limita as respostas aos campos publicados no contrato da API.
  private formatar(tarifa: Tarifa): TarifaResposta {
    return {
      id: tarifa.id,
      categoria: tarifa.categoria,
      valorPorMinutoCentavos: tarifa.valorPorMinutoCentavos,
      ativo: tarifa.ativo,
    };
  }
}
