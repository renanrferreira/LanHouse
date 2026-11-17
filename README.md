# LanHouse API

API RESTful para controle operacional e financeiro de Lan House, gerenciando inventário de computadores (estações de trabalho), sessões de uso (pré-pagas e pós-pagas), tarifas por categoria em centavos e gestão de créditos dos clientes.

Projeto desenvolvido para a disciplina de **Desenvolvimento Back-End (P2)** do curso superior de Tecnologia em Sistemas para Internet (**FATEC-TSI**), adotando a metodologia **Spec-Driven Development** (desenvolvimento orientado por especificação) com documentação completa em `.context/`.

---

## Sumário

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Passo a Passo de Instalação e Execução](#passo-a-passo-de-instalação-e-execução)
  - [1. Clonagem do Repositório](#1-clonagem-do-repositório)
  - [2. Instalação das Dependências](#2-instalação-das-dependências)
  - [3. Configuração de Variáveis de Ambiente](#3-configuração-de-variáveis-de-ambiente)
  - [4. Banco de Dados com Docker Compose](#4-banco-de-dados-com-docker-compose)
  - [5. Migrations do Prisma](#5-migrations-do-prisma)
  - [6. Carga de Dados Iniciais (Seed)](#6-carga-de-dados-iniciais-seed)
  - [7. Inicialização da API](#7-inicialização-da-api)
- [Documentação Interativa (Swagger UI)](#documentação-interativa-swagger-ui)
- [Catálogo de Endpoints](#catálogo-de-endpoints)
- [Testes Automatizados e Tipagem](#testes-automatizados-e-tipagem)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Regras de Negócio e Convenções Arquiteturais](#regras-de-negócio-e-convenções-arquiteturais)

---

## Tecnologias Utilizadas

| Componente | Tecnologia | Versão Mínima | Finalidade |
|---|---|---|---|
| **Ambiente de Execução** | Node.js | >= 20.19.0 LTS | Runtime do servidor HTTP |
| **Linguagem** | TypeScript | >= 5.x | Tipagem estrita e compilação |
| **Framework Web** | Express | 5.x | Roteamento, middlewares e controllers |
| **Banco de Dados** | MySQL | 8.0+ | Persistência relacional com transações ACID |
| **ORM / Migrations** | Prisma ORM | 7.x | Schema, migrations e cliente tipado |
| **Segurança HTTP** | Helmet | 8.x | Cabeçalhos de proteção HTTP (CSP, HSTS, X-Frame-Options) |
| **Autenticação** | JWT (`jose`) + `bcryptjs` | Atual | Emissão de tokens Bearer e hash de senhas |
| **Proteção de Acesso** | `express-rate-limit` | 8.x | Rate limiting no endpoint de login (5 req / 15 min) |
| **Validação de Entrada** | Zod | 3.x+ / 4.x | Validação rígida rejeitando campos desconhecidos |
| **Documentação da API** | Swagger UI (`swagger-ui-express`) | 5.x | Documentação interativa OpenAPI 3.0 na rota `/docs` |
| **Runner de Testes** | `node:test` nativo + `tsx` | Node >= 20.x | Testes automatizados sem dependência de frameworks externos |

---

## Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em sua máquina:

- **Node.js** na versão `20.19.0` ou superior (LTS recomendado).
- **npm** na versão `10.x` ou superior.
- **Docker** e **Docker Compose** para execução do container MySQL.
- **Git** para controle de versão.

---

## Passo a Passo de Instalação e Execução

### 1. Clonagem do Repositório

```bash
git clone https://github.com/renanrferreira/LanHouse.git
cd LanHouse
```

### 2. Instalação das Dependências

Instale todos os pacotes definidos no `package.json`:

```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env`:

No Linux / macOS:
```bash
cp .env.example .env
```

No Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

O arquivo `.env` gerado já possui os valores padrão configurados para o ambiente de desenvolvimento local:

```env
# Configurações do servidor
PORT=3000
NODE_ENV=development
TZ=UTC

# MySQL dedicado da Lanhouse no Docker Compose
MYSQL_PORT=3308
MYSQL_ROOT_PASSWORD=senha_root_dev_local
MYSQL_PASSWORD=senha_dev_local
DATABASE_URL="mysql://lanhouse_app:senha_dev_local@127.0.0.1:3308/lanhouse_dev"
DATABASE_TEST_URL="mysql://lanhouse_app:senha_dev_local@127.0.0.1:3308/lanhouse_test"

# Autenticação (chave fictícia para desenvolvimento local)
JWT_SECRET="chave_secreta_falsa_apenas_para_desenvolvimento_local_123"
JWT_EXPIRES_IN="8h"
```

> [!IMPORTANT]
> A aplicação padroniza todas as operações de tempo e logs estritamente em **UTC** (`TZ=UTC`), conforme o requisito `RNF-05`.

---

### 4. Banco de Dados com Docker Compose

Suba o container do MySQL 8.0 em segundo plano:

```bash
docker compose up -d
```

O arquivo `compose.yaml` provisiona:
- Um serviço MySQL 8.0 escutando na porta configurada `3308` (evitando conflito com instâncias locais do MySQL na porta 3306);
- Criação automática da base de desenvolvimento `lanhouse_dev`;
- Execução do script `docker/mysql/init/01-create-test-database.sql` para criação da base isolada `lanhouse_test` com permissões concedidas ao usuário `lanhouse_app`;
- Volume persistente `lanhouse_mysql_data` para retenção dos dados.

Para verificar a saúde do container:
```bash
docker compose ps
```

---

### 5. Migrations do Prisma

Gere os artefatos do cliente Prisma e aplique as migrações nas duas bases (`dev` e `test`):

```bash
# 1. Gerar o cliente Prisma
npm run prisma:generate

# 2. Aplicar migrations na base de desenvolvimento (lanhouse_dev)
npx prisma migrate deploy

# 3. Aplicar migrations na base de testes isolada (lanhouse_test)
npm run prisma:migrate:test
```

---

### 6. Carga de Dados Iniciais (Seed)

Execute o script de seed para criar os registros iniciais fictícios para testes e desenvolvimento:

```bash
npm run prisma:seed
```

O seed insere:
1. **Atendente Padrão:**
   - **Login:** `atendente`
   - **Senha:** `senha123`
   - **Perfil:** `ATENDENTE`
2. **Estações de Trabalho Iniciais:**
   - **Estação 1:** `Estação Comum 01` (Categoria `COMUM`, IP Fixo `192.168.0.101`, status `DISPONIVEL`)
   - **Estação 2:** `Estação Gamer 01` (Categoria `GAMER`, IP Fixo `192.168.0.102`, status `DISPONIVEL`)
   - **Estação 3:** `Estação High-End 01` (Categoria `HIGH_END`, IP Fixo `192.168.0.103`, status `DISPONIVEL`)
3. **Tarifas Vigentes Iniciais:**
   - `COMUM`: 10 centavos/minuto (R$ 6,00/hora)
   - `GAMER`: 20 centavos/minuto (R$ 12,00/hora)
   - `HIGH_END`: 35 centavos/minuto (R$ 21,00/hora)

---

### 7. Inicialização da API

Inicie o servidor HTTP em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

A API estará em execução no endereço:
👉 **`http://localhost:3000`**

---

## Documentação Interativa (Swagger UI)

A API disponibiliza a documentação OpenAPI 3.0 completa e interativa via Swagger UI na rota:

🌐 **`http://localhost:3000/docs`**

A especificação bruta em formato JSON pode ser obtida em:
🌐 **`http://localhost:3000/docs/json`**

### Como se autenticar no Swagger UI:

1. Faça uma requisição para a rota `POST /auth/login` informando as credenciais de teste:
   ```json
   {
     "login": "atendente",
     "senha": "senha123"
   }
   ```
2. Copie a string do `token` retornado no corpo da resposta (`dados.token`).
3. No topo da página do Swagger UI, clique no botão **Authorize** (ícone de cadeado).
4. No campo de valor, digite `Bearer ` seguido do token copiado (exemplo: `Bearer eyJhbGciOi...`).
5. Clique em **Authorize** e feche o modal. A partir deste momento, todas as rotas protegidas incluirão o cabeçalho de autenticação automaticamente.

---

## Catálogo de Endpoints

A API é composta por **24 rotas** organizadas por módulo de negócio:

### Autenticação (`/auth`)
- `POST /auth/login` — Autenticação do atendente com emissão de token JWT (possui *rate limit* de 5 requisições por IP a cada 15 minutos).

### CRUD 1 — Clientes (`/clientes`)
- `POST /clientes` — Cadastro de novo cliente com validação de CPF (rejeita CPFs inválidos ou duplicados).
- `GET /clientes` — Listagem paginada de clientes ativos com suporte a filtro de busca (`?pagina=1&itensPorPagina=20&busca=...`).
- `GET /clientes/:id` — Consulta individual de cliente ativo.
- `PUT /clientes/:id` — Atualização cadastral integral do cliente.
- `DELETE /clientes/:id` — Desativação lógica (*soft delete*) do cliente.

### CRUD 2 — Estações de Trabalho (`/estacoes`)
- `POST /estacoes` — Cadastro de estação com número único, IP fixo obrigatório e categoria (`COMUM`, `GAMER`, `HIGH_END`).
- `GET /estacoes` — Listagem de todas as estações do salão e seus status operacionais.
- `GET /estacoes/:id` — Consulta individual de estação.
- `PUT /estacoes/:id` — Atualização dos dados cadastrais da estação.
- `DELETE /estacoes/:id` — Desativação lógica da estação.
- `PATCH /estacoes/:id/status` — Atualização do status operacional da máquina (`DISPONIVEL`, `MANUTENCAO`, `INATIVA`).

### CRUD 3 — Tarifas por Categoria (`/tarifas`)
- `POST /tarifas` — Cadastro de tarifa para categoria em centavos/minuto (desativa automaticamente a vigência anterior).
- `GET /tarifas` — Listagem das tarifas ativas por categoria.
- `GET /tarifas/:id` — Consulta de tarifa específica (inclui vigentes e inativas).
- `PUT /tarifas/:id` — Atualização do valor por minuto de uma tarifa ativa.
- `DELETE /tarifas/:id` — Desativação lógica da tarifa.

### Créditos Financeiros (`/creditos`)
- `POST /creditos/recarga` — Recarga de créditos para cliente ativo com atualização atômica de saldo e registro imutável em centavos.
- `GET /creditos/extrato/:clienteId` — Consulta do extrato imutável de transações financeiras em ordem cronológica decrescente.

### Sessões de Uso e Endpoint Complexo (`/sessoes`)
- `POST /sessoes` — Abertura atômica de sessão de uso (`PRE_PAGA` com minutos contratados e verificação de saldo prévio, ou `POS_PAGA`), transicionando a estação para `OCUPADA`.
- `GET /sessoes/ativas` — Monitoramento em tempo real de sessões em andamento (`ATIVA` ou `PAUSADA`).
- `GET /sessoes/:id` — Consulta detalhada de dados da sessão.
- `POST /sessoes/:id/finalizar` — **Endpoint complexo:** Encerramento atômico com transação ACID, apuração temporal em UTC com arredondamento em minutos iniciados, cálculo financeiro em centavos, débito de créditos em modalidade pré-paga, cancelamento técnico com isenção em uso inferior a 3 minutos e liberação imediata da máquina para `DISPONIVEL`.

### Documentação
- `GET /docs` — Interface interativa do Swagger UI.
- `GET /docs/json` — Especificação da API no padrão OpenAPI 3.0 em JSON.

---

## Testes Automatizados e Tipagem

### Execução dos Testes Automatizados

Os testes automatizados utilizam o runner nativo `node:test` e são executados estritamente na base isolada `lanhouse_test`, sem interferir no banco de desenvolvimento:

```bash
npm test
```

### Checagem Estrita de Tipos

Para checar a integridade de tipagem de todo o código TypeScript sem gerar arquivos de build:

```bash
npm run typecheck
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor HTTP em modo de desenvolvimento com hot-reload (`tsx watch src/server.ts`). |
| `npm test` | Executa a suíte completa de testes automatizados com `node:test` e `tsx`. |
| `npm run typecheck` | Executa a checagem de tipos com `tsc --noEmit`. |
| `npm run prisma:generate` | Gera os tipos e cliente Prisma a partir de `prisma/schema.prisma`. |
| `npm run prisma:migrate:test` | Aplica as migrations na base de dados de testes (`DATABASE_TEST_URL`). |
| `npm run prisma:seed` | Popula o banco com atendente, computadores e tarifas fictícias para desenvolvimento. |

---

## Regras de Negócio e Convenções Arquiteturais

1. **Precisão Financeira Estrita em Centavos (`Centavos`):**
   Todos os valores monetários (`saldoCentavos`, `valorPorMinutoCentavos`, `valorFinalCentavos`) são manipulados e persistidos estritamente como números inteiros em centavos, eliminando erros de arredondamento de ponto flutuante (`RN-13`, `RNF-02`).
2. **Padronização Temporal em UTC:**
   Todas as datas e carimbos de auditoria (`criadoEm`, `iniciadoEm`, `finalizadoEm`) são armazenados e trafegados em formato ISO-8601 em UTC (`RNF-05`).
3. **Preservação de Dados e Integridade Histórica (*Soft Delete*):**
   Clientes, estações e tarifas utilizam exclusão lógica (`ativo = false`). Transações de crédito e histórico de sessões são estritamente imutáveis e auditáveis (`RN-02`, `RNF-04`).
4. **Formato Único de Sucesso e Erro:**
   - **Sucesso:**
     ```json
     {
       "sucesso": true,
       "dados": { ... }
     }
     ```
   - **Erro:**
     ```json
     {
       "sucesso": false,
       "erro": {
         "codigo": "STATION_NOT_AVAILABLE",
         "mensagem": "A estação informada não está disponível para iniciar sessão.",
         "detalhes": []
       }
     }
     ```

