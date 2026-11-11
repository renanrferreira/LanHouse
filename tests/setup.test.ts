import { describe, it, expect } from 'vitest';

describe('Configuração do Ambiente e Inicialização', () => {
  it('deve garantir que o timezone padrão da aplicação opera em UTC (RNF-05)', () => {
    // RNF-05: Todas as datas e horas de logs, sessões e transações são registradas estritamente em UTC
    const offsetMinutos = new Date().getTimezoneOffset();
    const dataIso = new Date().toISOString();
    
    // O timezone em UTC deve ter offset 0 ou process.env.TZ deve ser UTC
    expect(process.env.TZ).toBe('UTC');
    expect(dataIso.endsWith('Z')).toBe(true);
  });

  it('deve carregar e validar as variáveis de ambiente essenciais (RNF-01)', async () => {
    // Importa o módulo de configuração de ambiente da aplicação
    const { env } = await import('../src/config/env');

    expect(env).toBeDefined();
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_URL).toContain('mysql://');
    expect(env.JWT_SECRET).toBeDefined();
  });
});

