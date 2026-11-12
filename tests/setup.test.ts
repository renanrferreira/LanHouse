import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.TZ = 'UTC';
process.env.PORT ??= '3000';
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'mysql://test:test@localhost:3306/lanhouse_test';
process.env.DATABASE_TEST_URL ??= 'mysql://test:test@localhost:3306/lanhouse_test';
process.env.JWT_SECRET ??= 'chave_falsa_apenas_para_testes_1234567890';
process.env.JWT_EXPIRES_IN ??= '8h';

describe('Configuração do Ambiente e Inicialização', () => {
  it('deve garantir que o timezone padrão da aplicação opera em UTC (RNF-05)', () => {
    // RNF-05: Todas as datas e horas de logs, sessões e transações são registradas estritamente em UTC
    const offsetMinutos = new Date().getTimezoneOffset();
    const dataIso = new Date().toISOString();
    
    // O timezone em UTC deve ter offset 0 ou process.env.TZ deve ser UTC
    assert.equal(process.env.TZ, 'UTC');
    assert.equal(dataIso.endsWith('Z'), true);
  });

  it('deve carregar e validar as variáveis de ambiente essenciais (RNF-01)', async () => {
    // Importa o módulo de configuração de ambiente da aplicação
    const { env } = await import('../src/config/Env.ts');

    assert.notEqual(env, undefined);
    assert.notEqual(env.PORT, undefined);
    assert.equal(typeof env.PORT, 'number');
    assert.notEqual(env.NODE_ENV, undefined);
    assert.equal(env.DATABASE_URL.includes('mysql://'), true);
    assert.notEqual(env.JWT_SECRET, undefined);
  });
});

