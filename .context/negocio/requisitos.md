# Requisitos

Requisitos funcionais, requisitos não funcionais e limites de escopo do sistema de Lan House.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Requisitos Funcionais

| # | Requisito | Quem usa | Regras associadas | Status |
|---|---|---|---|---|
| `RF-01` | Autenticar atendentes com login e senha protegida. | `ATENDENTE` | — | aprovado |
| `RF-02` | Cadastrar, consultar, atualizar e desativar logicamente clientes da Lan House. | `ATENDENTE` | `RN-01`, `RN-02`, `RN-03` | aprovado |
| `RF-03` | Cadastrar, listar e gerenciar o status das estações de trabalho do salão. | `ATENDENTE` | `RN-04`, `RN-05`, `RN-06` | aprovado |
| `RF-04` | Iniciar uma sessão de uso associando um cliente a uma estação disponível. | `ATENDENTE` | `RN-05`, `RN-07`, `RN-08`, `RN-09` | aprovado |
| `RF-05` | Encerrar sessão de uso, calcular tempo decorrido e total devido em centavos. | `ATENDENTE` | `RN-07`, `RN-09`, `RN-10`, `RN-11`, `RN-13` | aprovado |
| `RF-06` | Registrar recargas e ajustes de crédito no saldo do cliente. | `ATENDENTE` | `RN-03`, `RN-13`, `RN-15` | aprovado |
| `RF-07` | Consultar extrato de transações de crédito e histórico de sessões por cliente. | `ATENDENTE` | `RN-15` | aprovado |
| `RF-08` | Configurar tarifas vigentes por minuto ou categoria de estação. | `ATENDENTE` | `RN-14` | aprovado |
| `RF-09` | Monitoramento das estações do salão via API. | `ATENDENTE` | `RN-05`, `RN-06`, `RN-07` | aprovado |

## 2. Requisitos Não Funcionais

| # | Requisito | Critério de Aceite | Status |
|---|---|---|---|
| `RNF-01` | Arquitetura RESTful | API documentada com Swagger, rotas padronizadas, verbos HTTP apropriados e retornos JSON em UTF-8. | aprovado |
| `RNF-02` | Precisão financeira | Todo cálculo financeiro utiliza inteiros em centavos sem perda de arredondamento de float. | aprovado |
| `RNF-03` | Tempo de resposta | Operações de consulta e atualização de status de sessão respondem em menos de 300ms sob carga normal. | aprovado |
| `RNF-04` | Integridade e auditoria | Nenhuma transação financeira ou histórico de sessão é deletado fisicamente do banco de dados. | aprovado |
| `RNF-05` | Padronização temporal | Todas as datas e horas de logs, sessões e transações são registradas estritamente em UTC. | aprovado |
| `RNF-06` | Segurança de credenciais | Senhas armazenadas com algoritmo robusto de hash (bcrypt) com salting individual. | aprovado |

## 3. Fora de Escopo

Os seguintes pontos foram intencionalmente excluídos do escopo deste projeto:
- Interface gráfica de usuário / Front-End (o projeto consiste estritamente em uma API Back-End RESTful, consumida e testada via Swagger UI e clientes HTTP).
- Software cliente local ("agente daemon" instalado no sistema operacional Windows/Linux do computador cliente para travamento de tela físico e encerramento de processos).
- Integração direta com gateways de pagamento por cartão ou maquininha de POS física (recebimentos são registrados pelo atendente no balcão).
- Módulo de lanchonete, estoque de conveniência ou venda de periféricos.
