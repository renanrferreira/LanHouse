# Especificação Lan House

Sistema de gerenciamento e controle de sessões, computadores e créditos para Lan House. Documentação construída por etapas, no método spec-driven: primeiro a especificação aprovada, depois o código.

- **Versão:** 1.1
- **Data:** 10/11/2026
- **Status:** aprovado

## Por onde começar

1. Ler o [aiRules.md](aiRules.md): como a IA trabalha e como o código é escrito.
2. Ler este índice e o **índice** de [decisoes/decisoes.md](decisoes/decisoes.md).
3. Abrir só os arquivos que a task usa (tabela de leitura no Bloco 3 do `aiRules.md`).

## Estrutura

| Pasta | Conteúdo | Arquivos | Situação |
|---|---|---|---|
| (raiz) | Regras para IA, mapa da documentação e lista de tasks | `aiRules.md`, `indice.md`, `tasks.md` | existem |
| `decisoes/` | Registro das decisões, com índice no topo | `decisoes.md` | existe |
| `negocio/` | Contexto, regras de negócio e requisitos | `contexto.md`, `glossario.md`, `regrasDeNegocio.md`, `requisitos.md` | existem |
| `api/` | Contrato HTTP e catálogo de rotas (24 endpoints, 3 CRUDs e Swagger) | `endpoints.md`, `contratos.md` | existem |
| `arquitetura/` | Como o sistema é organizado | `stack.md`, `arquitetura.md`, `visaoGeral.md`, `visaoGeralApi.md` | existem |
| `dados/` | Banco de dados | `modeloDeDados.md` | existe |
| `migrations/` | Política de migrations, seed e banco de teste | `migrations.md` | existe |
| `seguranca/` | Autenticação, perfis e proteção | `seguranca.md` | existe |

> [!NOTE]
> Conforme decisão 7.7 e diretrizes da disciplina de Desenvolvimento Back-End, o escopo do projeto é **exclusivamente a API Back-End**, não havendo interface gráfica ou pasta `frontend/`.

## Blocos do aiRules.md

| Bloco | Assunto | Status |
|---|---|---|
| 1 | Antes de começar qualquer task | escrito |
| 2 | Implementação e ao terminar | escrito |
| 3 | Mapa de leitura | escrito |
| 4 | Convenções de código | escrito |
| 5 | Trabalho em equipe e Git | escrito |
| 6 | Como escrever a documentação | escrito |
| 7 | Honestidade e proibições | escrito |

## Etapas de construção da especificação

| Etapa | Assunto | Destino | Status |
|---|---|---|---|
| A | Estrutura inicial do `.context/` e regras de IA | `.context/` | aprovado |
| B | Regras de negócio, contexto, glossário e requisitos | `negocio/` | aprovado |
| C | Modelo de dados e integridade no MySQL | `dados/` | aprovado |
| D | Endpoints e contratos de API (24 endpoints, 3 CRUDs e Swagger) | `api/` | aprovado |
| E | Escolha e validação da stack tecnológica (Node.js + MySQL) | `arquitetura/stack.md` | aprovado |
| F | Arquitetura de software e visão geral da API | `arquitetura/` | aprovado |
| G | Migrations, seed e política de testes | `migrations/` | aprovado |
| H | Autenticação, perfil de atendente e segurança | `seguranca/` | aprovado |

## Pontos já decididos

- [7.1](decisoes/decisoes.md#7-decisões-registradas): Adoção do método spec-driven com estrutura `.context/` e regras `aiRules.md` (aprovado).
- [7.2](decisoes/decisoes.md#7-decisões-registradas): Definição da stack tecnológica com Node.js, TypeScript, Prisma ORM e MySQL (aprovado).
- [7.3](decisoes/decisoes.md#7-decisões-registradas): Adoção de modelo misto de cobrança de sessões pré-pagas e pós-pagas (aprovado).
- [7.4](decisoes/decisoes.md#7-decisões-registradas): Autenticação com perfil único simplificado para atendentes (aprovado).
- [7.5](decisoes/decisoes.md#7-decisões-registradas): Criação da visão geral da API em `arquitetura/visaoGeral.md` e `arquitetura/visaoGeralApi.md` (aprovado).
- [7.6](decisoes/decisoes.md#7-decisões-registradas): Inclusão do Swagger e fechamento dos 3 CRUDs completos, totalizando 24 endpoints (aprovado).
- [7.7](decisoes/decisoes.md#7-decisões-registradas): Remoção do escopo de front-end, limitando o projeto estritamente à API Back-End documentada via Swagger (aprovado).
- [7.8](decisoes/decisoes.md#7-decisões-registradas): Aprovação das regras RN-01 a RN-15, IP fixo para estações e categorias COMUM, GAMER e HIGH_END (aprovado).
