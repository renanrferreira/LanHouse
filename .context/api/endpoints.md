# Endpoints da API

Definição das rotas HTTP, convenções de URI, métodos, perfis autorizados e requisitos atendidos.

- **Versão:** 0.1
- **Data:** 10/11/2026
- **Status:** proposto

## 1. Regras Gerais de Rota

1. **Convenção de nomenclatura:** Rotas utilizam substantivos no plural, letras minúsculas, em português e sem acentos (ex.: `/clientes`, `/estacoes`, `/sessoes`). Ações compostas usam hífen (ex.: `/sessoes/encerrar-sessao`).
2. **Exceções consagradas:** Rotas de autenticação utilizam `/auth` e documentação de rotas `/docs`.
3. **Formato de dados:** Requisições e respostas utilizam exclusivamente `Content-Type: application/json; charset=utf-8`.
4. **Autenticação:** Rotas protegidas exigem cabeçalho `Authorization: Bearer <token_jwt>`.

## 2. Grupos de Rotas

- **Autenticação (`/auth`):** Login de operadores e administradores para geração de token.
- **Clientes (`/clientes`):** Gestão cadastral de clientes da Lan House.
- **Estações (`/estacoes`):** Cadastro e monitoramento do estado das máquinas do salão.
- **Sessões (`/sessoes`):** Abertura, monitoramento e encerramento de períodos de uso.
- **Créditos (`/creditos`):** Recargas e extratos de créditos de clientes.
- **Tarifas (`/tarifas`):** Configuração de preços por minuto de uso.

## 3. Tabela de Rotas

| Método | Rota | Descrição | Quem usa | Atende | Status |
|---|---|---|---|---|---|
| `POST` | `/auth/login` | Autentica usuário e retorna token JWT | Todos | `RF-01` | proposto |
| `GET` | `/clientes` | Lista clientes (com paginação e busca) | `ATENDENTE` | `RF-02` | proposto |
| `POST` | `/clientes` | Cadastra novo cliente | `ATENDENTE` | `RF-02` | proposto |
| `GET` | `/clientes/:id` | Obtém dados detalhados do cliente | `ATENDENTE` | `RF-02` | proposto |
| `PUT` | `/clientes/:id` | Atualiza dados cadastrais do cliente | `ATENDENTE` | `RF-02` | proposto |
| `DELETE` | `/clientes/:id` | Desativação lógica do cliente | `ATENDENTE` | `RF-02` | proposto |
| `GET` | `/estacoes` | Lista todas as estações e estados atuais | `ATENDENTE` | `RF-03`, `RF-09` | proposto |
| `POST` | `/estacoes` | Cadastra nova estação de trabalho | `ATENDENTE` | `RF-03` | proposto |
| `PATCH` | `/estacoes/:id/status` | Altera status manual (ex.: manutenção) | `ATENDENTE` | `RF-03` | proposto |
| `POST` | `/sessoes` | Inicia uma nova sessão de uso | `ATENDENTE` | `RF-04` | proposto |
| `GET` | `/sessoes/ativas` | Lista todas as sessões em andamento | `ATENDENTE` | `RF-04`, `RF-09` | proposto |
| `POST` | `/sessoes/:id/finalizar` | Finaliza sessão e calcula valor final | `ATENDENTE` | `RF-05` | proposto |
| `POST` | `/creditos/recarga` | Registra recarga de créditos para cliente | `ATENDENTE` | `RF-06` | proposto |
| `GET` | `/creditos/extrato/:clienteId` | Consulta extrato de transações do cliente | `ATENDENTE` | `RF-07` | proposto |
| `GET` | `/tarifas` | Lista tarifas vigentes por categoria | `ATENDENTE` | `RF-08` | proposto |
| `PUT` | `/tarifas/:id` | Atualiza valor por minuto da tarifa | `ATENDENTE` | `RF-08` | proposto |

