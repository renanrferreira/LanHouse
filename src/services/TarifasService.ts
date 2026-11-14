import type { Tarifa } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { TarifasRepository } from '../repositories/TarifasRepository.js';
import type {
  AtualizarTarifaInput,
  CriarTarifaInput,
} from '../schemas/TarifasSchema.js';

export class TarifasService {
  constructor(private readonly tarifasRepository: TarifasRepository) {}

  // Registra uma nova tarifa e preserva a anterior como histórico.
  criar(dados: CriarTarifaInput): Promise<Tarifa> {
    return this.tarifasRepository.criar(dados);
  }

  // Retorna somente as tarifas ativas.
  listar(): Promise<Tarifa[]> {
    return this.tarifasRepository.listarAtivas();
  }

  // Retorna uma tarifa pelo identificador, ativa ou inativa.
  async obter(id: string): Promise<Tarifa> {
    const tarifa = await this.tarifasRepository.obter(id);

    if (!tarifa) {
      throw this.erroTarifaNaoEncontrada();
    }

    return tarifa;
  }

  // Atualiza somente tarifas ativas.
  async atualizar(
    id: string,
    dados: AtualizarTarifaInput,
  ): Promise<Tarifa> {
    const tarifa = await this.tarifasRepository.atualizar(id, dados);

    if (!tarifa) {
      throw this.erroTarifaNaoEncontrada();
    }

    return tarifa;
  }

  // Desativa logicamente uma tarifa ativa sem remover o histórico.
  async desativar(id: string): Promise<void> {
    const desativada = await this.tarifasRepository.desativar(id);

    if (!desativada) {
      throw this.erroTarifaNaoEncontrada();
    }
  }

  // Cria o erro público usado para tarifas não localizadas ou inativas.
  private erroTarifaNaoEncontrada(): AppError {
    return new AppError(ErrorCodes.RATE_NOT_FOUND, 'Tarifa não encontrada.');
  }
}
