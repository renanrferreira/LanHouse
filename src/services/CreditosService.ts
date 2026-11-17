import type { TransacaoCredito } from '@prisma/client';
import { ErrorCodes } from '../constants/ErrorCodes.js';
import { AppError } from '../errors/AppError.js';
import { CreditosRepository } from '../repositories/CreditosRepository.js';

const MAX_SALDO_CENTAVOS = 2147483647;

export class CreditosService {
  constructor(private readonly creditosRepository: CreditosRepository) {}

  // Valida o valor e registra a recarga sem permitir estouro do saldo.
  async recarregar(
    clienteId: string,
    valorCentavos: unknown,
    operadorId: string,
  ): Promise<TransacaoCredito> {
    if (
      typeof valorCentavos !== 'number' ||
      !Number.isInteger(valorCentavos) ||
      valorCentavos <= 0 ||
      valorCentavos > MAX_SALDO_CENTAVOS
    ) {
      throw this.erroValorInvalido();
    }

    const resultado = await this.creditosRepository.recarregar(
      clienteId, valorCentavos, operadorId, MAX_SALDO_CENTAVOS,
    );

    if (resultado.status === 'criada') {
      return resultado.transacao;
    }
    if (resultado.status === 'clienteNaoEncontrado') {
      throw new AppError(ErrorCodes.CLIENT_NOT_FOUND, 'Cliente não encontrado.');
    }
    throw this.erroValorInvalido();
  }

  // Retorna o extrato de um cliente existente em ordem de auditoria.
  async obterExtrato(clienteId: string): Promise<TransacaoCredito[]> {
    const extrato = await this.creditosRepository.obterExtrato(clienteId);
    if (extrato === null) {
      throw new AppError(ErrorCodes.CLIENT_NOT_FOUND, 'Cliente não encontrado.');
    }
    return extrato;
  }

  // Informa que o valor ou o saldo resultante excede os limites permitidos.
  private erroValorInvalido(): AppError {
    return new AppError(
      ErrorCodes.INVALID_CREDIT_AMOUNT,
      'A recarga deve ser um inteiro positivo em centavos e respeitar o limite do saldo.',
    );
  }
}
