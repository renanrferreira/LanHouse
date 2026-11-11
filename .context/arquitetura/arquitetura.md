# Arquitetura de Software

Estrutura de camadas, organização de pastas e responsabilidades de cada componente.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Padrão Arquitetural

A aplicação adota uma arquitetura em camadas com separação clara de responsabilidades:

1. **Camada de Apresentação / Entrada (HTTP):**
   - Recebe as requisições HTTP, valida o payload de entrada (rejeitando campos desconhecidos), extrai parâmetros e chama os serviços de domínio.
   - Retorna os dados formatados conforme o contrato padrão de resposta e status HTTP.
2. **Camada de Aplicação / Serviços de Negócio (Services):**
   - Centraliza todas as regras de negócio (`RN-01` a `RN-15`).
   - Orquestra chamadas a múltiplos repositórios, cálculos de tempo, precificação em centavos e transações financeiras.
   - Não conhece detalhes de HTTP (headers, status codes diretamente). Lança exceções de negócio tratadas centralizadamente.
3. **Camada de Acesso a Dados (Repositories / Models):**
   - Responsável pela comunicação direta com o banco de dados.
   - Executa consultas, persistências, filtros e transações atômicas.
4. **Camada de Infraestrutura / Middlewares:**
   - Tratamento global de erros, autenticação por token JWT, validação de esquemas e cabeçalhos de segurança.

## 2. Estrutura de Pastas Proposta

```text
src/
├── app.ts                  # Configuração da aplicação (middlewares, rotas, plugins)
├── server.ts               # Inicialização do servidor HTTP e conexão com banco
├── @types/                 # Extensões e declarações globais de tipagem
├── config/                 # Leitura e validação de variáveis de ambiente
├── constants/              # Catálogo fixo de códigos de erro e enums
│   └── ErrorCodes.ts
├── errors/                 # Classe base de erro da aplicação (AppError)
│   └── AppError.ts
├── middlewares/            # Middlewares reutilizáveis
│   ├── Authenticate.ts
│   ├── AuthorizeRole.ts
│   ├── ErrorHandler.ts
│   └── ValidateRequest.ts
├── routes/                 # Definição e registro de rotas por recurso
│   ├── auth.routes.ts
│   ├── clientes.routes.ts
│   ├── estacoes.routes.ts
│   ├── sessoes.routes.ts
│   ├── creditos.routes.ts
│   └── tarifas.routes.ts
├── controllers/            # Controladores HTTP (<Recursos>Controller.ts)
│   ├── AuthController.ts
│   ├── ClientesController.ts
│   ├── EstacoesController.ts
│   ├── SessoesController.ts
│   ├── CreditosController.ts
│   └── TarifasController.ts
├── services/               # Serviços de negócio (<Recursos>Service.ts)
│   ├── AuthService.ts
│   ├── ClientesService.ts
│   ├── EstacoesService.ts
│   ├── SessoesService.ts
│   ├── CreditosService.ts
│   └── TarifasService.ts
├── repositories/           # Repositórios de dados (<Recursos>Repository.ts)
│   ├── ClientesRepository.ts
│   ├── EstacoesRepository.ts
│   ├── SessoesRepository.ts
│   ├── TransacoesRepository.ts
│   └── TarifasRepository.ts
└── database/               # Conexão de banco e prisma/migrations
    ├── client.ts
    └── seed.ts
```

## 3. Fluxo de Execução de uma Requisição

```text
Requisição HTTP
     │
     ▼
[Middleware: ValidateRequest] ──── (Payload inválido) ───► [AppError / 400]
     │
     ▼
[Middleware: Authenticate]    ──── (Token inválido)   ───► [AppError / 401]
     │
     ▼
[ClientesController]
     │
     ▼
[ClientesService]             ──── (Regra violada)    ───► [AppError / 422 ou 409]
     │
     ▼
[ClientesRepository]
     │
     ▼
[Banco de Dados]
```

