# Segurança

Diretrizes de autenticação, autorização, proteção de dados, tratamento de segredos e conformidade.

- **Versão:** 1.1
- **Data:** 13/11/2026
- **Status:** aprovado

## 1. Autenticação e Perfis de Acesso

1. **Mecanismo de autenticação:** Utilização de tokens JWT (JSON Web Tokens) transmitidos no cabeçalho `Authorization: Bearer <token>`.
2. **Tempo de expiração:** Tokens possuem validade curta ou média (máximo 8 horas por turno de trabalho).
3. **Controle de Acesso Simplificado:**
   - `ATENDENTE`: Perfil único e direto para todos os operadores autenticados do balcão da Lan House, com acesso irrestrito às rotas operacionais (sessões, clientes, estações, recargas e tarifas).

## 2. Senhas e Credenciais

- **Hash seguro:** Senhas nunca são armazenadas em texto puro. Utiliza-se exclusivamente algoritmos modernos com salting individual (ex.: bcrypt com fator de custo mínimo 10 ou argon2id).
- **Sem vazamento:** Respostas de API, logs ou mensagens de erro **nunca** retornam senhas ou seus hashes.

## 3. Validação de Entrada e Tratamento de Erros

- **Validação estrita:** Todos os campos de entrada (`body`, `params`, `query`) passam por validação de esquema rígida (ex.: Zod ou Joi).
- **Rejeição de propriedades desconhecidas:** Payloads contendo campos adicionais não especificados no contrato são rejeitados com `400 INVALID_INPUT`.
- **Sanitização de saída:** Mensagens de erro para o cliente nunca expõem stack traces, nomes de tabelas, estruturas internas de banco de dados ou detalhes da tecnologia. O erro interno retorna apenas código padronizado (`500 INTERNAL_SERVER_ERROR`).

## 4. Proteção contra Ataques Comuns

- **Injeção de SQL:** Utilização obrigatória de queries parametrizadas através de ORM (Prisma/TypeORM) ou query builder seguro. Proibida a concatenação manual de strings SQL.
- **Cabeçalhos de Segurança (HTTP Headers):** A API adota headers recomendados via biblioteca segura (ex.: Helmet):
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security (HSTS)`
- **Rate Limiting:** A rota `POST /auth/login` aceita até 5 requisições por IP em uma janela de 15 minutos. Requisições bem-sucedidas e falhas contam para o limite. A contagem fica em memória por processo e reinicia quando a API reinicia. Ao exceder o limite, a API retorna `429 RATE_LIMIT_EXCEEDED` e o cabeçalho `Retry-After`, conforme o contrato da API.

## 5. Proteção de Dados Pessoais (LGPD)

- Os dados dos clientes (nome, CPF, telefone) são coletados exclusivamente para a identificação necessária ao uso da estação de trabalho e controle de crédito.
- O sistema não compartilha dados com terceiros.
- É garantido o direito de correção e inativação (soft delete) do cadastro do cliente mediante solicitação.
- Logs do sistema registram apenas o ID da entidade e o evento ocorrido, omitindo senhas, dados de cartão ou informações sensíveis.

