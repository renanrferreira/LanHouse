# Glossário

Termos do domínio da Lan House, significados e termos técnicos correspondentes no código.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## Termos do Domínio

| Termo em Português | Termo no Código | Significado |
|---|---|---|
| Estação / Máquina | `estacao` | Computador físico ou terminal disponibilizado no salão, identificado por número e IP fixo. |
| Categoria de Estação | `categoria` | Classificação do computador na Lan House: `COMUM`, `GAMER` ou `HIGH_END`. |
| Sessão | `sessao` | Período contínuo em que um cliente ocupa e utiliza uma determinada estação de trabalho. |
| Cliente | `cliente` | Pessoa física cadastrada que usufrui das estações e serviços da Lan House. |
| Atendente | `atendente` | Funcionário do balcão com perfil simplificado para iniciar sessões, realizar cobranças, cadastrar clientes e gerenciar estações. |
| Tarifa | `tarifa` | Regra de precificação aplicada ao tempo de uso de uma estação (ex.: valor por minuto em centavos). |
| Saldo / Crédito | `saldoCentavos` | Quantia monetária em centavos que o cliente possui antecipadamente em sua conta para uso. |
| Transação de Crédito | `transacaoCredito` | Registro de entrada (recarga) ou saída (débito de sessão) de créditos da conta do cliente. |
| Modalidade de Sessão | `modalidadeSessao` | Tipo de cobrança: pré-paga (`PRE_PAGA`) ou pós-paga (`POS_PAGA`). |
| Status da Estação | `statusEstacao` | Estado operacional do computador: disponível (`DISPONIVEL`), ocupada (`OCUPADA`), em manutenção (`MANUTENCAO`) ou inativa (`INATIVA`). |
| Status da Sessão | `statusSessao` | Estado do ciclo de vida da sessão: ativa (`ATIVA`), pausada (`PAUSADA`), finalizada (`FINALIZADA`) ou cancelada (`CANCELADA`). |

