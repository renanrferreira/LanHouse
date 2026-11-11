# Visão Geral da API

Visão geral arquitetural, padrões de comunicação, ciclo de vida de requisição e catálogo dos módulos da API REST.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

> [!NOTE]
> Este documento resume e ilustra o funcionamento da API REST da Lan House com diagramas. Ele consolida o fluxo de dados, esteira de middlewares e integração com o banco MySQL via Prisma ORM. Regras de negócio residem em [regrasDeNegocio.md](../negocio/regrasDeNegocio.md) e contratos em [contratos.md](../api/contratos.md).

---

## 1. Visão Geral da Arquitetura

O sistema opera como uma API RESTful centralizada, atendendo aos clientes HTTP e Swagger UI para gerenciamento de computadores e sessões:

```mermaid
flowchart TD
    subgraph Consumidores["Consumidores HTTP"]
        A["Swagger UI (/docs)"]
        B["Clientes HTTP / Atendentes"]
    end

    subgraph API["Backend / API REST (Node.js + TS)"]
        C["Autenticação JWT (Atendentes)"]
        D["Validação de Entrada (Zod)"]
        E["Gestão de Clientes e Créditos"]
        F["Controle de Estações e Sessões"]
        G["Motor de Tarifação em Centavos"]
    end

    subgraph Banco["Persistência"]
        H[("MySQL Database")]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    F --> G
    E --> H
    F --> H
    G --> H
```

---

## 2. Ciclo de Vida da Requisição na API

Toda requisição HTTP recebida pela API segue uma esteira bem definida de processamento:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente HTTP (Swagger / Atendente)
    participant Middleware as Middlewares (Auth, Zod)
    participant Controller as HTTP Controller
    participant Service as Business Service
    participant Repo as Repository / Prisma ORM
    participant DB as MySQL Database

    Cliente->>Middleware: Requisição HTTP (ex.: POST /sessoes)
    alt Token JWT ausente ou inválido
        Middleware-->>Cliente: 401 UNAUTHORIZED
    else Payload inválido ou campos desconhecidos
        Middleware-->>Cliente: 400 INVALID_INPUT
    end
    Middleware->>Controller: Requisição validada
    Controller->>Service: Executa regra de negócio
    Service->>Repo: Consulta disponibilidade da estação
    Repo->>DB: SELECT * FROM estacoes WHERE id = ?
    DB-->>Repo: Dados da máquina
    alt Estação ocupada ou em manutenção
        Service-->>Controller: Lança AppError (STATION_NOT_AVAILABLE)
        Controller-->>Cliente: 409 STATION_NOT_AVAILABLE
    else Estação livre
        Service->>Repo: Inicia sessão e atualiza status
        Repo->>DB: TRANSACTION (INSERT sessoes, UPDATE estacoes)
        DB-->>Repo: Dados persistidos
        Service-->>Controller: Dados da sessão criada
        Controller-->>Cliente: 201 Created { sucesso: true, dados: ... }
    end
```

---

## 3. Máquina de Estados da Sessão na API

O ciclo de vida de uma sessão e seu reflexo no status das estações:

```mermaid
stateDiagram-v2
    [*] --> IniciarSessao: "Atendente aloca estação disponível"
    IniciarSessao --> ATIVA: "Estação transiciona para OCUPADA"
    ATIVA --> PAUSADA: "Pausa temporária solicitada"
    PAUSADA --> ATIVA: "Retomada da sessão"
    ATIVA --> FINALIZADA: "Tempo esgotado (pré-paga) ou encerramento (pós-paga)"
    FINALIZADA --> [*]: "Calcula tarifa em centavos e libera estação para DISPONIVEL"
    ATIVA --> CANCELADA: "Cancelada por falha técnica antes do tempo mínimo"
    CANCELADA --> [*]: "Sem cobrança e libera estação para DISPONIVEL"
```

---

## 4. Módulos Funcionais da API

| Módulo                  | Prefixo       | Responsabilidade                                                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------- |
| **Autenticação** | `/auth`     | Login dos atendentes, validação de senha (bcrypt) e emissão de token JWT.                                    |
| **Clientes**       | `/clientes` | Cadastro, busca por CPF/nome, histórico e desativação lógica (soft delete).                                 |
| **Estações**     | `/estacoes` | Monitoramento em tempo real do estado das máquinas (`DISPONIVEL`, `OCUPADA`, `MANUTENCAO`, `INATIVA`). |
| **Sessões**       | `/sessoes`  | Início de uso (pré ou pós-paga), acompanhamento e encerramento com cálculo financeiro.                      |
| **Créditos**      | `/creditos` | Recargas, débitos automáticos de sessões e extrato de transações em centavos.                              |
| **Tarifas**        | `/tarifas`  | Configuração de preço por minuto em centavos de acordo com a categoria da máquina.                          |

---

## 5. Diretrizes de Comunicação e Contrato

1. **Envelope de Sucesso Padronizado:**
   ```json
   {
     "sucesso": true,
     "dados": { ... }
   }
   ```
2. **Envelope de Erro Único:**
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
3. **Resiliência e Integridade:** Todas as operações que afetam saldo de clientes e ocupação de máquinas utilizam transações ACID do MySQL gerenciadas via `prisma.$transaction`.
