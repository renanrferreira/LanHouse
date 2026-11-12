# Tasks

Lista das tasks para construir o projeto, na ordem de execução, com o teste de cada uma.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Marcação:** `[ ]` pendente e `[x]` concluída. Só o usuário permite marcar.

---

## Como cada task é feita

Cada task segue o `aiRules.md`: plano aprovado antes, **teste escrito primeiro** (ele falha antes em comportamento novo e passa antes e depois quando a task preserva comportamento, como diz a regra 8 do Bloco 2), implementação, todos os testes rodados e relatório no fim. Com o relatório aprovado, a IA **pergunta se pode marcar a task como concluída** e só então troca `[ ]` por `[x]`.

## Como é o teste

| # | Regra                                                                                                         |
| - | ------------------------------------------------------------------------------------------------------------- |
| 1 | **Um teste simples por task**, que confere o resultado principal. Regras centrais podem ter mais de um. |
| 2 | Ferramenta de teste: Vitest. Testes rodam só em banco de teste (`DATABASE_TEST_URL`).                      |
| 3 | A saída mostra `✔` quando passou e `✖` quando falhou, com o que veio de errado.                        |
| 4 | O teste fica em `tests/<arquivo testado>.test.ts`.                                                          |

---

## Etapas da especificação

- [X] Etapa A — Estrutura inicial do `.context/` e regras de IA criadas
- [X] Etapa B — Validação e aprovação das regras de negócio, contexto e requisitos (`negocio/`)
- [X] Etapa C — Validação e aprovação do modelo de dados no MySQL (`dados/`)
- [X] Etapa D — Validação e aprovação dos contratos da API e 3 CRUDs (`api/`)
- [X] Etapa E — Definição e aprovação da stack técnica (Node.js + MySQL) (`arquitetura/stack.md`)
- [X] Etapa F — Aprovação de segurança e autenticação simplificada (`seguranca/`)
- [X] Etapa G — Aprovação da arquitetura de software e migrations (`arquitetura/`, `migrations/`)
- [X] Etapa H — Escopo delimitado sem front-end (foco exclusivo em API Back-End e Swagger)

---

## Tasks de implementação

As tasks de implementação seguem rigorosamente a especificação aprovada. Cada task possui: **Entrega**, **Atende** (`RN`, `RF`, `RNF`), **Teste** e **depende de**.

- [ ] **Task 1: Setup do Projeto e Configuração do Ambiente**

  - **Entrega:** Inicialização do `package.json`, `tsconfig.json`, `.env.example` e configuração do Vitest.
  - **Atende:** `RNF-01`, `RNF-05`
  - **Teste:** `tests/setup.test.ts` (verifica carregamento de variáveis de ambiente e padronização UTC).
  - **Depende de:** Nenhuma.
- [ ] **Task 2: Modelagem Prisma e Migrations MySQL**

  - **Entrega:** `prisma/schema.prisma` mapeando `Usuario`, `Cliente`, `Estacao`, `Tarifa`, `Sessao` e `TransacaoCredito`, gerando a migration inicial para MySQL.
  - **Atende:** `RN-01`, `RN-04`, `RN-13`, `RNF-04`
  - **Teste:** `tests/database.test.ts` (valida conexão com banco de testes e integridade das tabelas).
  - **Depende de:** Task 1.
- [ ] **Task 3: Seed com Dados Iniciais Fictícios**

  - **Entrega:** `prisma/seed.ts` populando atendente padrão, computadores e tarifas por categoria.
  - **Atende:** `migrations/migrations.md`
  - **Teste:** `tests/seed.test.ts` (confere inserção de dados iniciais no banco de teste).
  - **Depende de:** Task 2.
- [ ] **Task 4: Tratamento de Erros e Catálogo Unificado**

  - **Entrega:** `errors/AppError.ts`, `constants/ErrorCodes.ts` e middleware central de erro.
  - **Atende:** `RNF-01`, catálogo de erros em `contratos.md`
  - **Teste:** `tests/ErrorHandler.test.ts` (valida respostas de erro `{ sucesso: false, erro: { codigo, mensagem, detalhes } }`).
  - **Depende de:** Task 1.
- [ ] **Task 5: Autenticação de Atendentes e Middleware JWT**

  - **Entrega:** `AuthController.ts`, `AuthService.ts`, middleware `Authenticate.ts` e rota `POST /auth/login`.
  - **Atende:** `RF-01`, `RNF-06`
  - **Teste:** `tests/Auth.test.ts` (login gera JWT; credenciais inválidas retornam 401 `INVALID_CREDENTIALS`).
  - **Depende de:** Task 2, Task 4.
- [ ] **Task 6: CRUD 1 — Clientes (5 operações)**

  - **Entrega:** Rotas, controller, service e repositório de clientes (`POST`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`).
  - **Atende:** `RF-02`, `RN-01`, `RN-02`, `RN-03`
  - **Teste:** `tests/Clientes.test.ts` (testa as 5 operações do CRUD e validação de CPF único).
  - **Depende de:** Task 5.
- [ ] **Task 7: CRUD 2 — Estações de Trabalho (6 operações)**

  - **Entrega:** Rotas, controller, service e repositório de máquinas (`POST`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/status`).
  - **Atende:** `RF-03`, `RN-04`, `RN-05`, `RN-06`
  - **Teste:** `tests/Estacoes.test.ts` (testa as operações de CRUD e transição de status).
  - **Depende de:** Task 5.
- [ ] **Task 8: CRUD 3 — Tarifas por Categoria (5 operações)**

  - **Entrega:** Rotas, controller, service e repositório de regras de preço (`POST`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`).
  - **Atende:** `RF-08`, `RN-13`, `RN-14`
  - **Teste:** `tests/Tarifas.test.ts` (testa as operações de CRUD e precisão de tarifas em centavos).
  - **Depende de:** Task 5.
- [ ] **Task 9: Créditos e Transações Financeiras**

  - **Entrega:** `CreditosController.ts`, `CreditosService.ts` e rotas `POST /creditos/recarga` e `GET /creditos/extrato/:clienteId`.
  - **Atende:** `RF-06`, `RF-07`, `RN-03`, `RN-13`, `RN-15`
  - **Teste:** `tests/Creditos.test.ts` (recarga incrementa saldo em centavos e gera registro imutável).
  - **Depende de:** Task 6.
- [ ] **Task 10: Abertura e Monitoramento de Sessões**

  - **Entrega:** Rotas `POST /sessoes`, `GET /sessoes/ativas` e `GET /sessoes/:id`.
  - **Atende:** `RF-04`, `RF-09`, `RN-05`, `RN-07`, `RN-08`, `RN-09`, `RN-10`
  - **Teste:** `tests/SessoesInicio.test.ts` (inicia sessão, muda máquina para `OCUPADA`, rejeita cliente já ocupado).
  - **Depende de:** Task 6, Task 7, Task 8.
- [ ] **Task 11: Endpoint Complexo — Encerramento de Sessão e Tarifação**

  - **Entrega:** Rota `POST /sessoes/:id/finalizar` com transação ACID, cálculo de tempo em minutos, débito e liberação da máquina.
  - **Atende:** `RF-05`, `RN-07`, `RN-09`, `RN-10`, `RN-11`, `RN-12`, `RN-13`, `RN-15`
  - **Teste:** `tests/SessoesFinalizar.test.ts` (encerra sessão, debita saldo pré-pago, calcula centavos e libera máquina).
  - **Depende de:** Task 9, Task 10.
- [ ] **Task 12: Documentação com Swagger / OpenAPI**

  - **Entrega:** Configuração da rota `/docs` com Swagger UI expondo os schemas e endpoints da API.
  - **Atende:** Requisito de documentação da disciplina.
  - **Teste:** `tests/Swagger.test.ts` (valida status 200 no Swagger UI e especificação OpenAPI).
  - **Depende de:** Task 11.
- [ ] **Task 13: README com Instruções de Execução**

  - **Entrega:** `README.md` completo na raiz com instrução de instalação, configuração de banco MySQL, execução de migrations, seed e testes.
  - **Atende:** Requisito de entrega e repositório do trabalho.
  - **Teste:** Validação manual dos comandos de bootstrap descritos no README.
  - **Depende de:** Task 12.
