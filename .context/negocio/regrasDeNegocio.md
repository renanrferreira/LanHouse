# Regras de Negócio

Regras fundamentais que regem a lógica operacional e financeira da Lan House.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Cadastro e Clientes

| # | Regra | Status |
|---|---|---|
| `RN-01` | Todo cliente deve possuir identificação única por documento (CPF ou documento oficial) e nome completo no cadastro. | aprovado |
| `RN-02` | Um cliente não pode ser excluído fisicamente do banco de dados caso possua histórico de sessões ou transações financeiras (aplicação de desativação lógica / soft delete). | aprovado |
| `RN-03` | O saldo de créditos do cliente é armazenado estritamente em centavos inteiros (`saldoCentavos`) e nunca pode ser negativo em modalidades estritamente pré-pagas. | aprovado |

## 2. Estações de Trabalho

| # | Regra | Status |
|---|---|---|
| `RN-04` | Cada estação de trabalho possui um identificador único composto obrigatoriamente por seu número no salão e endereço de IP fixo pré-definido. | aprovado |
| `RN-05` | Uma estação só pode iniciar uma nova sessão se seu status atual for `DISPONIVEL`. | aprovado |
| `RN-06` | Estações com status `MANUTENCAO` ou `INATIVA` não podem ser alocadas para clientes nem receber início de sessão. | aprovado |
| `RN-07` | Ao iniciar uma sessão em uma estação, seu status deve transicionar imediatamente para `OCUPADA`. Ao finalizar a sessão, transiciona de volta para `DISPONIVEL`. | aprovado |

## 3. Sessões de Uso

| # | Regra | Status |
|---|---|---|
| `RN-08` | Um cliente só pode ter no máximo uma sessão com status `ATIVA` simultaneamente no sistema. | aprovado |
| `RN-09` | Toda sessão deve registrar carimbo de data/hora de início (`iniciadoEm`) e término (`finalizadoEm`) expressos estritamente em UTC. | aprovado |
| `RN-10` | Na modalidade pré-paga (`PRE_PAGA`), o tempo contratado ou o saldo de crédito do cliente impõe um limite máximo; a sessão deve ser finalizada ou bloqueada ao atingir o limite estipulado. | aprovado |
| `RN-11` | Na modalidade pós-paga (`POS_PAGA`), o valor final é apurado no momento do encerramento da sessão com base na duração real e na tarifa vigente da categoria da máquina. | aprovado |
| `RN-12` | Se uma sessão durar menos do que a fração mínima de carência definida (ex.: 3 minutos) e for cancelada por problema técnico na máquina, nenhum valor deve ser cobrado do cliente. | aprovado |

## 4. Tarifação e Cobrança

| # | Regra | Status |
|---|---|---|
| `RN-13` | Todos os valores monetários de tarifas, cobranças e recargas são manipulados e registrados em centavos inteiros (`Centavos`), proibindo o uso de pontos flutuantes / decimais. | aprovado |
| `RN-14` | A tarifa define o valor por minuto em centavos inteiros para cada uma das 3 categorias padronizadas de computadores da API: `COMUM`, `GAMER` e `HIGH_END`. Cada categoria possui sua própria regra tarifária ativa. | aprovado |
| `RN-15` | Toda transação financeira de recarga de créditos (`transacaoCredito`) deve gerar um registro imutável contendo o valor em centavos, tipo de operação (`RECARGA`, `DEBITO_SESSAO`, `ESTORNO`), atendente responsável e data em UTC. | aprovado |
