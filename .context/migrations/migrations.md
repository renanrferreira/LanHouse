# Política de Migrations, Seed e Bancos

Diretrizes para versionamento do esquema de banco de dados, dados iniciais (seed) e ambientes de teste.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Ciclo de Vida das Migrations

1. **Geração única:** Migrations são geradas por **uma** pessoa e devidamente commitadas no controle de versão.
2. **Imutabilidade:** Migration já commitada **nunca é editada**. Qualquer alteração de estrutura, adição de coluna ou renomeação deve ser feita através de uma **nova migration**.
3. **Nomenclatura padronizada:** Nomes de migrations devem descrever a ação de forma clara e cronológica:
   - Ex.: `20261110000000_create_usuarios_and_clientes`
   - Ex.: `20261110000001_create_estacoes_and_tarifas`
   - Ex.: `20261110000002_create_sessoes_and_transacoes`
4. **Reversibilidade:** Quando suportado pelo mecanismo de migration, garantir que instruções de reversão (`down`) existam ou que a migração seja segura para rollback.

## 2. Política de Seed (Dados Iniciais)

1. **Dados estritamente fictícios:** O arquivo de seed (`seed.ts` ou `seed.sql`) deve conter apenas dados de teste, como nomes fictícios, CPFs fictícios gerados para teste e máquinas de exemplo.
2. **Nunca usar dados reais de clientes:** Proibido o uso de informações pessoais ou credenciais reais em qualquer ambiente de desenvolvimento ou teste.
3. **Usuário padrão de desenvolvimento:**
   - Login: `atendente`
   - Senha de teste (apenas desenvolvimento): `senha123` (criptografada com bcrypt)
   - Perfil: `ATENDENTE`
4. **Tarifas iniciais para teste:**
   - Categoria `COMUM`: 10 centavos/minuto (R$ 6,00/hora).
   - Categoria `GAMER`: 20 centavos/minuto (R$ 12,00/hora).
   - Categoria `HIGH_END`: 35 centavos/minuto (R$ 21,00/hora).

## 3. Ambientes de Banco de Dados

| Ambiente | Conexão Típica | Finalidade | Regra |
|---|---|---|---|
| **Desenvolvimento (`dev`)** | `lanhouse_dev` | Desenvolvimento diário e depuração da API. | Alterações controladas via migration. |
| **Testes Automatizados (`test`)** | `lanhouse_test` | Execução das suítes de testes unitários e de integração. | **Bancos isolados.** Pode sofrer reset antes de baterias de testes. |
| **Produção (`prod`)** | `lanhouse_prod` | Ambiente real de operação. | Acesso restrito. Sem seed de teste. |

> [!WARNING]
> Testes **nunca** rodam em banco de desenvolvimento compartilhado nem de produção. Antes de rodar comandos de banco (`reset`, `migrate`), confirmar explicitamente o ambiente e a conexão.

## 4. O que NUNCA fazer

- Nunca alterar o código SQL de uma migration antiga já aplicada ou commitada.
- Nunca commitar arquivos `.env` com senhas ou hosts reais de produção.
- Nunca rodar testes apontando para a base `lanhouse_dev`.
- Nunca apagar tabelas em lote sem comando registrado em migration formal.

