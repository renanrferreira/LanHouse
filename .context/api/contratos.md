# Contratos da API

Contratos de requisição e resposta, catálogo de erros padronizado, paginação e contratos detalhados dos 3 CRUDs e endpoints de domínio.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Formato Padrão de Resposta de Sucesso

Todas as respostas de sucesso retornam o código HTTP correspondente (`200`, `201`, `204`) e corpo JSON formatado em camelCase:

```json
{
  "sucesso": true,
  "dados": { ... }
}
```

Para listagens com paginação:
```json
{
  "sucesso": true,
  "dados": [ ... ],
  "paginacao": {
    "pagina": 1,
    "itensPorPagina": 20,
    "totalItens": 42,
    "totalPaginas": 3
  }
}
```

## 2. Formato Único de Erro

Erros de negócio e de validação seguem rigorosamente a seguinte estrutura em formato JSON:

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

- `codigo`: Identificador imutável em inglês e caixa alta, vindo do catálogo único.
- `mensagem`: Texto amigável em português explicando o erro para o usuário/operador.
- `detalhes`: Array opcional de mensagens de validação por campo (ex.: entradas inválidas).

## 3. Catálogo Único de Códigos de Erro

| Código HTTP | Código do Erro | Significado |
|---|---|---|
| `400` | `INVALID_INPUT` | Dados de entrada ausentes, inválidos ou mal formatados. |
| `400` | `INVALID_CREDIT_AMOUNT` | Valor de recarga em centavos inválido ou menor/igual a zero. |
| `401` | `INVALID_CREDENTIALS` | Login ou senha incorretos. |
| `401` | `UNAUTHORIZED` | Token ausente, inválido ou expirado. |
| `403` | `FORBIDDEN` | Usuário autenticado não tem perfil permissivo para o recurso. |
| `404` | `CLIENT_NOT_FOUND` | Cliente não localizado pelo identificador fornecido. |
| `404` | `STATION_NOT_FOUND` | Estação de trabalho não localizada. |
| `404` | `RATE_NOT_FOUND` | Tarifa não localizada. |
| `404` | `SESSION_NOT_FOUND` | Sessão de uso não localizada. |
| `409` | `DOCUMENT_ALREADY_EXISTS` | Documento (CPF) já cadastrado para outro cliente. |
| `409` | `STATION_NUMBER_ALREADY_EXISTS` | Número de estação já cadastrado no salão. |
| `409` | `STATION_IP_ALREADY_EXISTS` | Endereço IP fixo já associado a outra estação. |
| `409` | `CLIENT_ALREADY_HAS_ACTIVE_SESSION` | Cliente já possui uma sessão ativa em andamento. |
| `409` | `STATION_NOT_AVAILABLE` | A estação já está ocupada, desativada ou em manutenção. |
| `409` | `SESSION_ALREADY_FINISHED` | Sessão já se encontra finalizada ou cancelada. |
| `422` | `INSUFFICIENT_FUNDS` | Saldo de créditos do cliente é insuficiente para a operação pré-paga. |
| `500` | `INTERNAL_SERVER_ERROR` | Falha inesperada no servidor. Detalhes internos não são expostos. |

---

## 4. Contratos dos 3 CRUDs Completos

### 4.1 CRUD 1 — Clientes (`/clientes`)

- **Create (`POST /clientes`):**
  - **Body:** `{ "nome": "Carlos Silva", "documento": "12345678901", "telefone": "11999998888", "email": "carlos@email.com" }`
  - **Saída (201 Created):** `{ "sucesso": true, "dados": { "id": "cli_01", "nome": "Carlos Silva", "documento": "12345678901", "saldoCentavos": 0, "ativo": true, "criadoEm": "..." } }`
- **Read Geral (`GET /clientes`):**
  - **Query:** `?pagina=1&itensPorPagina=20&busca=Carlos`
  - **Saída (200 OK):** `{ "sucesso": true, "dados": [ ... ], "paginacao": { ... } }`
- **Read Individual (`GET /clientes/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "cli_01", "nome": "Carlos Silva", ... } }`
- **Update (`PUT /clientes/:id`):**
  - **Body:** `{ "nome": "Carlos Silva Editado", "telefone": "11988887777", "email": "carlos.novo@email.com" }`
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "cli_01", "nome": "Carlos Silva Editado", ... } }`
- **Delete (`DELETE /clientes/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "mensagem": "Cliente desativado com sucesso.", "ativo": false } }`

### 4.2 CRUD 2 — Estações (`/estacoes`)
Categorias padronizadas: `COMUM`, `GAMER`, `HIGH_END`. Cada estação possui IP fixo pré-definido obrigatório (`ipHost`).

- **Create (`POST /estacoes`):**
  - **Body:** `{ "numero": 1, "nome": "Estação 01", "categoria": "COMUM", "ipHost": "192.168.1.101" }`
  - **Saída (201 Created):** `{ "sucesso": true, "dados": { "id": "est_01", "numero": 1, "nome": "Estação 01", "categoria": "COMUM", "ipHost": "192.168.1.101", "status": "DISPONIVEL", "ativo": true } }`
- **Read Geral (`GET /estacoes`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": [ { "id": "est_01", "numero": 1, "categoria": "COMUM", "ipHost": "192.168.1.101", "status": "DISPONIVEL", ... } ] }`
- **Read Individual (`GET /estacoes/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "est_01", "numero": 1, "categoria": "COMUM", "ipHost": "192.168.1.101", "status": "DISPONIVEL", ... } }`
- **Update (`PUT /estacoes/:id`):**
  - **Body:** `{ "nome": "Estação Gamer 01", "categoria": "GAMER", "ipHost": "192.168.1.101" }`
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "est_01", "nome": "Estação Gamer 01", "categoria": "GAMER", ... } }`
- **Delete (`DELETE /estacoes/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "mensagem": "Estação desativada.", "ativo": false } }`
- **Patch Status Operacional (`PATCH /estacoes/:id/status`):**
  - **Body:** `{ "status": "MANUTENCAO" }`
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "est_01", "status": "MANUTENCAO" } }`

### 4.3 CRUD 3 — Tarifas (`/tarifas`)
Categorias padronizadas: `COMUM`, `GAMER`, `HIGH_END`.

- **Create (`POST /tarifas`):**
  - **Body:** `{ "categoria": "HIGH_END", "valorPorMinutoCentavos": 40 }`
  - **Saída (201 Created):** `{ "sucesso": true, "dados": { "id": "tar_03", "categoria": "HIGH_END", "valorPorMinutoCentavos": 40, "ativo": true } }`
- **Read Geral (`GET /tarifas`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": [ { "id": "tar_01", "categoria": "COMUM", "valorPorMinutoCentavos": 10, ... } ] }`
- **Read Individual (`GET /tarifas/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "tar_01", "categoria": "COMUM", "valorPorMinutoCentavos": 10 } }`
- **Update (`PUT /tarifas/:id`):**
  - **Body:** `{ "valorPorMinutoCentavos": 15 }`
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "id": "tar_01", "categoria": "COMUM", "valorPorMinutoCentavos": 15 } }`
- **Delete (`DELETE /tarifas/:id`):**
  - **Saída (200 OK):** `{ "sucesso": true, "dados": { "mensagem": "Tarifa desativada com sucesso.", "ativo": false } }`

---

## 5. Contratos de Autenticação, Domínio e Endpoint Complexo

### 5.1 Autenticação (`POST /auth/login`)
- **Entrada:**
  ```json
  {
    "login": "atendente1",
    "senha": "senhaSegura123"
  }
  ```
- **Saída (200 OK):**
  ```json
  {
    "sucesso": true,
    "dados": {
      "token": "eyJhbGciOi...",
      "usuario": {
        "id": "usr_01",
        "nome": "Atendente Balcão",
        "perfil": "ATENDENTE"
      }
    }
  }
  ```

### 5.2 Iniciar Sessão (`POST /sessoes`)
- **Entrada:**
  ```json
  {
    "clienteId": "cli_01",
    "estacaoId": "est_01",
    "modalidade": "PRE_PAGA",
    "minutosContratados": 60
  }
  ```
- **Saída (201 Created):**
  ```json
  {
    "sucesso": true,
    "dados": {
      "id": "ses_01",
      "clienteId": "cli_01",
      "estacaoId": "est_01",
      "modalidade": "PRE_PAGA",
      "status": "ATIVA",
      "iniciadoEm": "2026-11-10T20:00:00.000Z",
      "valorEstimadoCentavos": 600
    }
  }
  ```

### 5.3 Endpoint Complexo: Encerrar Sessão (`POST /sessoes/:id/finalizar`)
Realiza atomicamente cálculo temporal em UTC, apuração financeira por minuto, débito contábil e liberação física da máquina.
- **Entrada:** `{}` (vazio)
- **Saída (200 OK):**
  ```json
  {
    "sucesso": true,
    "dados": {
      "id": "ses_01",
      "status": "FINALIZADA",
      "iniciadoEm": "2026-11-10T20:00:00.000Z",
      "finalizadoEm": "2026-11-10T21:00:00.000Z",
      "minutosUtilizados": 60,
      "tarifaAplicadaPorMinutoCentavos": 10,
      "valorFinalCentavos": 600,
      "pagoComSaldo": true,
      "estacaoLiberada": true
    }
  }
  ```

### 5.4 Recarga de Créditos (`POST /creditos/recarga`)
- **Entrada:**
  ```json
  {
    "clienteId": "cli_01",
    "valorCentavos": 2000
  }
  ```
- **Saída (201 Created):**
  ```json
  {
    "sucesso": true,
    "dados": {
      "transacaoId": "trx_01",
      "clienteId": "cli_01",
      "tipo": "RECARGA",
      "valorCentavos": 2000,
      "novoSaldoCentavos": 3500,
      "criadoEm": "2026-11-10T20:05:00.000Z"
    }
  }
  ```

### 5.5 Documentação Interativa Swagger (`GET /docs`)
- Retorna a interface gráfica interativa do Swagger UI com todo o esquema OpenAPI 3.0 montado para experimentação de todos os 24 endpoints.
