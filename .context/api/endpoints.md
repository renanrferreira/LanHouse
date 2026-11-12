# Endpoints da API

Definição das rotas HTTP, convenções de URI, métodos, perfis autorizados e requisitos atendidos.

- **Versão:** 1.0
- **Data:** 11/11/2026
- **Status:** aprovado

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
| `POST` | `/auth/login` | Autentica usuário e retorna token JWT | Todos | `RF-01` | aprovado |
| `GET` | `/clientes` | Lista clientes (com paginação e busca) | `ATENDENTE` | `RF-02` | aprovado |
| `POST` | `/clientes` | Cadastra novo cliente | `ATENDENTE` | `RF-02` | aprovado |
| `GET` | `/clientes/:id` | Obtém dados detalhados do cliente | `ATENDENTE` | `RF-02` | aprovado |
| `PUT` | `/clientes/:id` | Atualiza dados cadastrais do cliente | `ATENDENTE` | `RF-02` | aprovado |
| `DELETE` | `/clientes/:id` | Desativação lógica do cliente | `ATENDENTE` | `RF-02` | aprovado |
| `GET` | `/estacoes` | Lista todas as estações e estados atuais | `ATENDENTE` | `RF-03`, `RF-09` | aprovado |
| `POST` | `/estacoes` | Cadastra nova estação de trabalho | `ATENDENTE` | `RF-03` | aprovado |
| `GET` | `/estacoes/:id` | Obtém dados detalhados da estação | `ATENDENTE` | `RF-03`, `RF-09` | aprovado |
| `PUT` | `/estacoes/:id` | Atualiza dados cadastrais da estação | `ATENDENTE` | `RF-03` | aprovado |
| `DELETE` | `/estacoes/:id` | Desativação lógica da estação | `ATENDENTE` | `RF-03` | aprovado |
| `PATCH` | `/estacoes/:id/status` | Altera status manual (ex.: manutenção) | `ATENDENTE` | `RF-03` | aprovado |
| `POST` | `/sessoes` | Inicia uma nova sessão de uso | `ATENDENTE` | `RF-04` | aprovado |
| `GET` | `/sessoes/ativas` | Lista todas as sessões em andamento | `ATENDENTE` | `RF-04`, `RF-09` | aprovado |
| `GET` | `/sessoes/:id` | Obtém dados detalhados da sessão | `ATENDENTE` | `RF-04`, `RF-09` | aprovado |
| `POST` | `/sessoes/:id/finalizar` | Finaliza sessão e calcula valor final | `ATENDENTE` | `RF-05` | aprovado |
| `POST` | `/creditos/recarga` | Registra recarga de créditos para cliente | `ATENDENTE` | `RF-06` | aprovado |
| `GET` | `/creditos/extrato/:clienteId` | Consulta extrato de transações do cliente | `ATENDENTE` | `RF-07` | aprovado |
| `POST` | `/tarifas` | Cadastra tarifa para uma categoria | `ATENDENTE` | `RF-08` | aprovado |
| `GET` | `/tarifas` | Lista tarifas vigentes por categoria | `ATENDENTE` | `RF-08` | aprovado |
| `GET` | `/tarifas/:id` | Obtém dados detalhados da tarifa | `ATENDENTE` | `RF-08` | aprovado |
| `PUT` | `/tarifas/:id` | Atualiza valor por minuto da tarifa | `ATENDENTE` | `RF-08` | aprovado |
| `DELETE` | `/tarifas/:id` | Desativação lógica da tarifa | `ATENDENTE` | `RF-08` | aprovado |
| `GET` | `/docs` | Exibe a documentação interativa Swagger UI | Todos | `RNF-01` | aprovado |

