import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

describe('Documentação e Instruções de Execução (README)', () => {
  const readmePath = resolve(process.cwd(), 'README.md');

  it('deve possuir o arquivo README.md na raiz do projeto', () => {
    assert.equal(
      existsSync(readmePath),
      true,
      'O arquivo README.md deve existir na raiz do repositório.'
    );
  });

  it('deve conter instruções completas de bootstrap, execução, testes e documentação Swagger', () => {
    const conteudo = readFileSync(readmePath, 'utf-8');

    // Instruções de clonagem e instalação
    assert.ok(
      conteudo.includes('git clone'),
      'README.md deve conter instrução de clonagem com git clone'
    );
    assert.ok(
      conteudo.includes('npm install'),
      'README.md deve conter instrução de instalação de dependências'
    );

    // Instruções de ambiente e Docker
    assert.ok(
      conteudo.includes('.env.example') || conteudo.includes('.env'),
      'README.md deve orientar a configuração de variáveis de ambiente'
    );
    assert.ok(
      conteudo.includes('docker compose') || conteudo.includes('compose.yaml'),
      'README.md deve conter instruções para subir o MySQL com Docker Compose'
    );

    // Migrations e Seed
    assert.ok(
      conteudo.includes('prisma') || conteudo.includes('migrate'),
      'README.md deve instruir a execução de migrations do banco'
    );
    assert.ok(
      conteudo.includes('seed') || conteudo.includes('prisma:seed'),
      'README.md deve instruir a execução do seed de dados fictícios'
    );

    // Execução e testes
    assert.ok(
      conteudo.includes('npm run dev'),
      'README.md deve conter comando para iniciar a API em desenvolvimento'
    );
    assert.ok(
      conteudo.includes('npm test'),
      'README.md deve conter comando para rodar os testes automatizados'
    );

    // Swagger UI
    assert.ok(
      conteudo.includes('/docs'),
      'README.md deve referenciar a rota da documentação Swagger UI (/docs)'
    );
  });
});

