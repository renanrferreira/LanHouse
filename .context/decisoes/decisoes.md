# Decisões

Registro das decisões tomadas durante o desenvolvimento, com o porquê de cada uma.

- **Versão:** 1.9
- **Data:** 13/11/2026

## Índice

**Leia só esta tabela primeiro.** Depois abra apenas as decisões do tema da task, procurando pelo ID. Não leia o arquivo inteiro.

Quando a decisão já virou regra do `aiRules.md`, **vale a regra**. A decisão serve para saber o porquê e é lida só quando a task muda essa regra.

Temas: `processoIa`, `codigo`, `git`, `negocio`, `api`, `seguranca`, `dados`, `frontend`, `documentacao`. O tema da task vem da tabela do Bloco 3 do `aiRules.md`.

| ID | Título | Tema | Status |
|---|---|---|---|
| 7.1 | Adoção da estrutura `.context/` e método spec-driven com regras aiRules.md | `processoIa` | aprovado |
| 7.2 | Definição da stack tecnológica (Node.js, TypeScript, Prisma ORM e MySQL) | `codigo` | aprovado |
| 7.3 | Adoção de modelo misto de cobrança de sessões (pré-paga e pós-paga) | `negocio` | aprovado |
| 7.4 | Autenticação com perfil único simplificado para atendentes | `seguranca` | aprovado |
| 7.5 | Criação da visão geral da API em arquitetura/ | `api` | aprovado |
| 7.6 | Inclusão do Swagger e fechamento dos 3 CRUDs completos (24 endpoints) | `api` | aprovado |
| 7.7 | Remoção do escopo de front-end (foco exclusivo em API Back-End e Swagger) | `negocio` | aprovado |
| 7.8 | Aprovação das RN-01 a RN-15, IP fixo para estações e categorias COMUM, GAMER e HIGH_END | `negocio` | aprovado |
| 7.9 | Aprovação do catálogo consolidado das 24 rotas da API | `api` | aprovado |
| 7.10 | Uso de checkboxes para acompanhar as tasks de implementação | `processoIa` | aprovado |
| 7.11 | Adoção do runner nativo `node:test` | `codigo` | aprovado |
| 7.12 | MySQL local dedicado com Docker Compose e bases separadas | `dados` | aprovado |
| 7.13 | Conclusão das tasks de Docker e Prisma | `processoIa` | aprovado |
| 7.14 | Conclusão da seed inicial fictícia | `processoIa` | aprovado |
| 7.15 | Escolha do Express para a camada HTTP | `codigo` | aprovado |
| 7.16 | Conclusão da task de tratamento de erros | `processoIa` | aprovado |

---

## 7. Decisões registradas

| # | Decisão | Por quê |
|---|---|---|
| 7.1 | Adotar a especificação orientada por spec (spec-driven) com a pasta `.context/` contendo todas as definições de negócio, dados, API, arquitetura, migrations, frontend e segurança antes do início do código, sob as diretrizes de `aiRules.md`. | Garantir alinhamento completo de escopo, regras claras, qualidade, rastreabilidade e consistência antes da implementação. |
| 7.2 | Utilizar Node.js com TypeScript, Prisma ORM e banco de dados relacional MySQL. | Escolha alinhada às diretrizes acadêmicas e do curso, garantindo tipagem estrita de ponta a ponta e persistência transacional sólida. |
| 7.3 | Suportar modalidades de sessão pré-paga (créditos/tempo fixo) e pós-paga (tempo livre cobrado no encerramento). | Atender à dinâmica real das lan houses, permitindo flexibilidade aos clientes que compram saldo previamente ou acertam o tempo decorrido ao sair. |
| 7.4 | Estruturar a autenticação com perfil único simplificado de atendente via token JWT. | Simplificar a operação diária de balcão e cadastro sem burocracias de múltiplos níveis hierárquicos no escopo da API. |
| 7.5 | Criar os documentos `arquitetura/visaoGeral.md` e `arquitetura/visaoGeralApi.md` para detalhar a visão arquitetural, ciclo de vida de requisição e responsabilidade dos módulos da API. | Fornecer uma referência técnica direta sobre a dinâmica de comunicação REST, esteira de middlewares e integração da API. |
| 7.6 | Adotar Swagger/OpenAPI 3.0 na rota `/docs` e fechar 3 conjuntos de CRUD completos com as 5 operações (Clientes, Estações e Tarifas), totalizando 24 endpoints. | Cumprir integralmente os requisitos da avaliação acadêmica (mínimo de 13 rotas, 3 CRUDs completos, documentação com Swagger e endpoint complexo). |
| 7.7 | Remover a pasta `frontend/` e todas as referências a telas/UI da especificação do projeto, delimitando o escopo estritamente à API REST Back-End documentada e testável via Swagger UI. | Determinação expressa do usuário com base no trabalho acadêmico de Desenvolvimento Back-End, onde não há necessidade de front-end. |
| 7.8 | Aprovar formally as regras RN-01 a RN-15, fixar o requisito de IP fixo pré-definido para cada estação no salão (RN-04) e padronizar as categorias de computadores da API e tarifas em COMUM, GAMER e HIGH_END (RN-14). | Validação direta pelo usuário dos controles de rede do salão e da classificação de tipos de máquinas da Lan House. |
| 7.9 | Aprovar o catálogo consolidado com as 24 rotas da API, incluindo os três CRUDs completos, os endpoints de domínio e a documentação Swagger. | Refletir no catálogo as rotas já definidas nos contratos aprovados e manter sua contagem alinhada à decisão 7.6. |
| 7.10 | Usar checkboxes pendentes nas tasks de implementação para acompanhar seu progresso. | Tornar visível o estado de cada task, preservando a regra de que só o usuário autoriza marcá-la como concluída. |
| 7.11 | Adotar o runner nativo `node:test` e usar `tsx` somente para carregar testes TypeScript na versão mínima suportada do Node.js. | Eliminar a dependência de framework externo e manter os testes automatizados na stack aprovada. |
| 7.12 | Provisionar o MySQL de desenvolvimento e teste em um container dedicado do Docker Compose, com bases separadas e volume persistente. | Facilitar a clonagem e a reprodução do ambiente sem exigir uma instalação local de MySQL e impedir que os testes usem a base de desenvolvimento. |
| 7.13 | Marcar as Tasks 2 e 3 como concluídas após validar o Compose, aplicar as migrations nas bases separadas e passar a suíte completa. | Registrar a entrega da infraestrutura e do modelo Prisma para liberar o início da Task 4. |
| 7.14 | Marcar a Task 4 como concluída após aplicar a seed fictícia em `lanhouse_dev` e `lanhouse_test`, validar a reexecução e passar a suíte completa. | Registrar a entrega dos dados iniciais de desenvolvimento e teste, liberando a próxima task de implementação. |
| 7.15 | Selecionar Express 5 como framework HTTP da aplicação. | Usar a assinatura convencional de middleware para tratar erros e padronizar a integração dos middlewares HTTP seguintes. |
| 7.16 | Marcar a Task 5 como concluída após validar o catálogo de erros, o middleware Express e a suíte completa. | Registrar a entrega do contrato de erros centralizado e liberar a implementação das próximas funcionalidades da API. |
