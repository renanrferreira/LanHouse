# Stack Tecnológica

Definição de linguagens, frameworks, banco de dados, bibliotecas e variáveis de ambiente.

- **Versão:** 1.0
- **Data:** 10/11/2026
- **Status:** aprovado

## 1. Stack Aprovada

A stack tecnológica do projeto foi definida e aprovada com base nos requisitos operacionais de alto desempenho e tipagem estrita:

| Componente | Tecnologia | Versão Mínima | Finalidade |
|---|---|---|---|
| **Ambiente de Execução** | Node.js | >= 20.x LTS | Runtime do servidor |
| **Linguagem** | TypeScript | >= 5.x | Tipagem estrita e segurança em tempo de compilação |
| **Framework HTTP** | Fastify (ou Express) | Atual | Roteamento, middlewares e servidor HTTP RESTful |
| **Banco de Dados** | MySQL | 8.0+ | Banco relacional com suporte a transações ACID |
| **ORM / Migrations** | Prisma ORM | 5.x+ | Mapeamento objeto-relacional, geração de schema e migrations |
| **Validação de Schemas**| Zod | 3.x+ | Validação estrita de payloads de entrada |
| **Autenticação / Hash** | JWT + bcryptjs | Atual | Geração de tokens de acesso e hash seguro de senhas |
| **Suíte de Testes** | `node:test` nativo do Node.js, com `tsx` para executar arquivos TypeScript | Node.js >= 20.x LTS | Testes unitários e de integração sem framework externo |

## 2. Variáveis de Ambiente (.env.example)

Valores falsos e fictícios para configuração do ambiente de desenvolvimento local:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Conexão com o Banco de Dados MySQL
DATABASE_URL="mysql://root:senha_dev_local@localhost:3306/lanhouse_dev"
DATABASE_TEST_URL="mysql://root:senha_dev_local@localhost:3306/lanhouse_test"

# Autenticação e Segurança
JWT_SECRET="chave_secreta_falsa_apenas_para_desenvolvimento_local_123"
JWT_EXPIRES_IN="8h"
```

> [!IMPORTANT]
> Nunca comitar credenciais, senhas ou segredos reais. As variáveis acima são estritamente de exemplo para o ambiente de desenvolvimento local.
