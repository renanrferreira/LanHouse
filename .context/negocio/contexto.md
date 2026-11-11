# Contexto

Visão geral do negócio da Lan House, problemas atendidos, público-alvo e funcionamento básico.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. O que é o projeto

O sistema de gerenciamento para Lan House é uma solução voltada para o controle operacional de computadores (estações de trabalho), sessões de uso por clientes, tarifação por tempo e gestão de créditos/saldos financeiros.

## 2. O problema

Lan houses e centros de jogos/navegação enfrentam dificuldades no controle manual de ocupação de computadores, registro exato do tempo consumido por clientes, cobrança proporcional sem perdas financeiras e gestão de créditos pré-pagos ou pós-pagos. O controle em planilhas ou cadernos gera furos de caixa, conflito de horários e falta de histórico de uso.

## 3. Objetivo

Oferecer um sistema confiável, seguro e centralizado para gerenciar:
- O inventário e o estado das estações em tempo real (disponível, ocupada, em manutenção, inativa);
- A abertura, acompanhamento e encerramento de sessões de uso;
- O cálculo financeiro automático do tempo utilizado (com precisão em centavos);
- A carteira de créditos dos clientes para sessões pré-pagas ou acertos pós-pagos.

## 4. Quem usa (Perfis de usuário)

| Perfil | Identificador | Responsabilidade |
|---|---|---|
| Atendente | `ATENDENTE` | Perfil operacional único e simplificado para operação de balcão: abertura/fechamento de sessões, recargas de créditos, cadastro de clientes, estações e consulta de tarifas. |
| Cliente | `CLIENTE` | Usuário final cadastrado que utiliza as máquinas da Lan House e consome créditos ou tempo contratado. |

## 5. Como funciona o fluxo básico

1. O cliente chega ao estabelecimento e se identifica perante o operador (ou realiza cadastro caso seja novo).
2. O cliente escolhe uma estação disponível ou o operador aloca uma máquina.
3. A sessão pode operar em duas modalidades:
   - **Pré-paga:** O cliente consome créditos pré-adquiridos ou estipula um tempo limite.
   - **Pós-paga:** O tempo corre livremente até o cliente solicitar o encerramento no balcão.
4. Ao encerrar a sessão, o sistema calcula o valor total devido em centavos, deduz do saldo de créditos ou gera cobrança no balcão, liberando a estação imediatamente para o próximo usuário.

