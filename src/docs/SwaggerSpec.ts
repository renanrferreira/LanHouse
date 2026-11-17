export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Lan House API',
    version: '1.0.0',
    description:
      'API RESTful para controle de estações, clientes, créditos, tarifas e sessões de uso de Lan House.',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor atual',
    },
  ],
  tags: [
    { name: 'Autenticação', description: 'Login e geração de token JWT de atendentes' },
    { name: 'Clientes', description: 'Gestão cadastral e consulta de clientes' },
    { name: 'Estações', description: 'Gerenciamento e monitoramento de estações' },
    { name: 'Sessões', description: 'Abertura, monitoramento e encerramento de sessões' },
    { name: 'Créditos', description: 'Recargas e extratos de créditos de clientes' },
    { name: 'Tarifas', description: 'Tabela de preços por categoria de máquina' },
    { name: 'Documentação', description: 'Documentação interativa da API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT transmitido no cabeçalho Authorization: Bearer <token>',
      },
    },
    schemas: {
      ErroPadrao: {
        type: 'object',
        properties: {
          codigo: { type: 'string', example: 'INVALID_INPUT' },
          mensagem: { type: 'string', example: 'Dados de entrada ausentes ou inválidos.' },
          detalhes: {
            type: 'array',
            items: { type: 'string' },
            example: ['O campo nome é obrigatório.'],
          },
        },
        required: ['codigo', 'mensagem', 'detalhes'],
      },
      ErroResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: false },
          erro: { $ref: '#/components/schemas/ErroPadrao' },
        },
        required: ['sucesso', 'erro'],
      },
      Paginacao: {
        type: 'object',
        properties: {
          pagina: { type: 'integer', example: 1 },
          itensPorPagina: { type: 'integer', example: 20 },
          totalItens: { type: 'integer', example: 42 },
          totalPaginas: { type: 'integer', example: 3 },
        },
        required: ['pagina', 'itensPorPagina', 'totalItens', 'totalPaginas'],
      },
      LoginRequisicao: {
        type: 'object',
        properties: {
          login: { type: 'string', example: 'atendente1' },
          senha: { type: 'string', example: 'senhaSegura123' },
        },
        required: ['login', 'senha'],
      },
      LoginResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
              usuario: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'usr_01' },
                  nome: { type: 'string', example: 'Atendente Balcão' },
                  perfil: { type: 'string', example: 'ATENDENTE' },
                },
                required: ['id', 'nome', 'perfil'],
              },
            },
            required: ['token', 'usuario'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      ClienteCriarRequisicao: {
        type: 'object',
        properties: {
          nome: { type: 'string', example: 'Carlos Silva' },
          documento: { type: 'string', example: '529.982.247-25' },
          telefone: { type: 'string', nullable: true, example: '11999998888' },
          email: { type: 'string', nullable: true, example: 'carlos@email.com' },
        },
        required: ['nome', 'documento'],
      },
      ClienteAtualizarRequisicao: {
        type: 'object',
        properties: {
          nome: { type: 'string', example: 'Carlos Silva Editado' },
          documento: { type: 'string', example: '529.982.247-25' },
          telefone: { type: 'string', nullable: true, example: '11988887777' },
          email: { type: 'string', nullable: true, example: 'carlos.novo@email.com' },
        },
        required: ['nome', 'documento', 'telefone', 'email'],
      },
      Cliente: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cli_01' },
          nome: { type: 'string', example: 'Carlos Silva' },
          documento: { type: 'string', example: '52998224725' },
          telefone: { type: 'string', nullable: true, example: '11999998888' },
          email: { type: 'string', nullable: true, example: 'carlos@email.com' },
          saldoCentavos: { type: 'integer', example: 1500 },
          ativo: { type: 'boolean', example: true },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'nome', 'documento', 'saldoCentavos', 'ativo', 'criadoEm', 'atualizadoEm'],
      },
      ClienteResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: { $ref: '#/components/schemas/Cliente' },
        },
        required: ['sucesso', 'dados'],
      },
      ClienteListaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'array',
            items: { $ref: '#/components/schemas/Cliente' },
          },
          paginacao: { $ref: '#/components/schemas/Paginacao' },
        },
        required: ['sucesso', 'dados', 'paginacao'],
      },
      ClienteDesativarResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              mensagem: { type: 'string', example: 'Cliente desativado com sucesso.' },
              ativo: { type: 'boolean', example: false },
            },
            required: ['mensagem', 'ativo'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      EstacaoCriarRequisicao: {
        type: 'object',
        properties: {
          numero: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Estação 01' },
          categoria: {
            type: 'string',
            enum: ['COMUM', 'GAMER', 'HIGH_END'],
            example: 'COMUM',
          },
          ipHost: { type: 'string', example: '192.168.1.101' },
        },
        required: ['numero', 'nome', 'categoria', 'ipHost'],
      },
      EstacaoAtualizarRequisicao: {
        type: 'object',
        properties: {
          nome: { type: 'string', example: 'Estação Gamer 01' },
          categoria: {
            type: 'string',
            enum: ['COMUM', 'GAMER', 'HIGH_END'],
            example: 'GAMER',
          },
          ipHost: { type: 'string', example: '192.168.1.101' },
        },
        required: ['nome', 'categoria', 'ipHost'],
      },
      EstacaoStatusRequisicao: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['DISPONIVEL', 'OCUPADA', 'MANUTENCAO', 'INATIVA'],
            example: 'MANUTENCAO',
          },
        },
        required: ['status'],
      },
      Estacao: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'est_01' },
          numero: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Estação 01' },
          categoria: {
            type: 'string',
            enum: ['COMUM', 'GAMER', 'HIGH_END'],
            example: 'COMUM',
          },
          ipHost: { type: 'string', example: '192.168.1.101' },
          status: {
            type: 'string',
            enum: ['DISPONIVEL', 'OCUPADA', 'MANUTENCAO', 'INATIVA'],
            example: 'DISPONIVEL',
          },
          ativo: { type: 'boolean', example: true },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'numero', 'nome', 'categoria', 'ipHost', 'status', 'ativo', 'criadoEm', 'atualizadoEm'],
      },
      EstacaoResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: { $ref: '#/components/schemas/Estacao' },
        },
        required: ['sucesso', 'dados'],
      },
      EstacaoListaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'array',
            items: { $ref: '#/components/schemas/Estacao' },
          },
        },
        required: ['sucesso', 'dados'],
      },
      EstacaoDesativarResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              mensagem: { type: 'string', example: 'Estação desativada.' },
              ativo: { type: 'boolean', example: false },
            },
            required: ['mensagem', 'ativo'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      TarifaCriarRequisicao: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['COMUM', 'GAMER', 'HIGH_END'],
            example: 'COMUM',
          },
          valorPorMinutoCentavos: { type: 'integer', example: 10 },
        },
        required: ['categoria', 'valorPorMinutoCentavos'],
      },
      TarifaAtualizarRequisicao: {
        type: 'object',
        properties: {
          valorPorMinutoCentavos: { type: 'integer', example: 15 },
        },
        required: ['valorPorMinutoCentavos'],
      },
      Tarifa: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tar_01' },
          categoria: {
            type: 'string',
            enum: ['COMUM', 'GAMER', 'HIGH_END'],
            example: 'COMUM',
          },
          valorPorMinutoCentavos: { type: 'integer', example: 10 },
          ativo: { type: 'boolean', example: true },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'categoria', 'valorPorMinutoCentavos', 'ativo', 'criadoEm', 'atualizadoEm'],
      },
      TarifaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: { $ref: '#/components/schemas/Tarifa' },
        },
        required: ['sucesso', 'dados'],
      },
      TarifaListaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'array',
            items: { $ref: '#/components/schemas/Tarifa' },
          },
        },
        required: ['sucesso', 'dados'],
      },
      TarifaDesativarResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              mensagem: { type: 'string', example: 'Tarifa desativada com sucesso.' },
              ativo: { type: 'boolean', example: false },
            },
            required: ['mensagem', 'ativo'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      RecargaRequisicao: {
        type: 'object',
        properties: {
          clienteId: { type: 'string', example: 'cli_01' },
          valorCentavos: { type: 'integer', example: 2000 },
        },
        required: ['clienteId', 'valorCentavos'],
      },
      RecargaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              transacaoId: { type: 'string', example: 'trx_01' },
              clienteId: { type: 'string', example: 'cli_01' },
              tipo: { type: 'string', example: 'RECARGA' },
              valorCentavos: { type: 'integer', example: 2000 },
              novoSaldoCentavos: { type: 'integer', example: 3500 },
              criadoEm: { type: 'string', format: 'date-time' },
            },
            required: ['transacaoId', 'clienteId', 'tipo', 'valorCentavos', 'novoSaldoCentavos', 'criadoEm'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      TransacaoCredito: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'trx_01' },
          clienteId: { type: 'string', example: 'cli_01' },
          operadorId: { type: 'string', example: 'usr_01' },
          sessaoId: { type: 'string', nullable: true, example: null },
          tipo: {
            type: 'string',
            enum: ['RECARGA', 'DEBITO_SESSAO', 'ESTORNO'],
            example: 'RECARGA',
          },
          valorCentavos: { type: 'integer', example: 2000 },
          saldoAposCentavos: { type: 'integer', example: 3500 },
          criadoEm: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'clienteId', 'operadorId', 'tipo', 'valorCentavos', 'saldoAposCentavos', 'criadoEm'],
      },
      ExtratoListaResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'array',
            items: { $ref: '#/components/schemas/TransacaoCredito' },
          },
        },
        required: ['sucesso', 'dados'],
      },
      SessaoIniciarRequisicao: {
        type: 'object',
        properties: {
          clienteId: { type: 'string', example: 'cli_01' },
          estacaoId: { type: 'string', example: 'est_01' },
          modalidade: {
            type: 'string',
            enum: ['PRE_PAGA', 'POS_PAGA'],
            example: 'PRE_PAGA',
          },
          minutosContratados: { type: 'integer', example: 60 },
        },
        required: ['clienteId', 'estacaoId', 'modalidade'],
      },
      SessaoResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ses_01' },
              clienteId: { type: 'string', example: 'cli_01' },
              estacaoId: { type: 'string', example: 'est_01' },
              modalidade: { type: 'string', example: 'PRE_PAGA' },
              status: { type: 'string', example: 'ATIVA' },
              iniciadoEm: { type: 'string', format: 'date-time' },
              valorEstimadoCentavos: { type: 'integer', example: 600 },
            },
            required: ['id', 'clienteId', 'estacaoId', 'modalidade', 'status', 'iniciadoEm', 'valorEstimadoCentavos'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      SessaoDetalhesResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ses_01' },
              clienteId: { type: 'string', example: 'cli_01' },
              estacaoId: { type: 'string', example: 'est_01' },
              operadorInicioId: { type: 'string', example: 'usr_01' },
              operadorFimId: { type: 'string', nullable: true, example: null },
              modalidade: { type: 'string', example: 'PRE_PAGA' },
              status: { type: 'string', example: 'ATIVA' },
              minutosContratados: { type: 'integer', nullable: true, example: 60 },
              minutosUtilizados: { type: 'integer', nullable: true, example: null },
              tarifaAplicadaPorMinutoCentavos: { type: 'integer', nullable: true, example: null },
              valorTotalCentavos: { type: 'integer', nullable: true, example: null },
              iniciadoEm: { type: 'string', format: 'date-time' },
              finalizadoEm: { type: 'string', nullable: true, format: 'date-time', example: null },
            },
            required: ['id', 'clienteId', 'estacaoId', 'operadorInicioId', 'modalidade', 'status', 'iniciadoEm'],
          },
        },
        required: ['sucesso', 'dados'],
      },
      SessaoFinalizarRequisicao: {
        type: 'object',
        properties: {
          cancelamentoTecnico: { type: 'boolean', example: false },
        },
      },
      SessaoFinalizarResposta: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean', example: true },
          dados: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ses_01' },
              status: { type: 'string', example: 'FINALIZADA' },
              iniciadoEm: { type: 'string', format: 'date-time' },
              finalizadoEm: { type: 'string', format: 'date-time' },
              minutosUtilizados: { type: 'integer', example: 60 },
              tarifaAplicadaPorMinutoCentavos: { type: 'integer', example: 10 },
              valorFinalCentavos: { type: 'integer', example: 600 },
              pagoComSaldo: { type: 'boolean', example: true },
              estacaoLiberada: { type: 'boolean', example: true },
            },
            required: [
              'id',
              'status',
              'iniciadoEm',
              'finalizadoEm',
              'minutosUtilizados',
              'tarifaAplicadaPorMinutoCentavos',
              'valorFinalCentavos',
              'pagoComSaldo',
              'estacaoLiberada',
            ],
          },
        },
        required: ['sucesso', 'dados'],
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autentica operador/atendente e retorna token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticação bem-sucedida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Credenciais inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '429': {
            description: 'Limite de tentativas excedido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/clientes': {
      get: {
        tags: ['Clientes'],
        summary: 'Lista clientes ativos com paginação e busca',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'pagina',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número da página',
          },
          {
            name: 'itensPorPagina',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 20 },
            description: 'Quantidade de itens por página',
          },
          {
            name: 'busca',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Termo para busca em nome ou documento',
          },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de clientes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteListaResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Clientes'],
        summary: 'Cadastra novo cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClienteCriarRequisicao' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Cliente cadastrado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida ou CPF mal formatado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Documento já cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/clientes/{id}': {
      get: {
        tags: ['Clientes'],
        summary: 'Obtém dados detalhados do cliente por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador do cliente',
          },
        ],
        responses: {
          '200': {
            description: 'Dados do cliente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente não localizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Clientes'],
        summary: 'Atualiza dados cadastrais do cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador do cliente',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClienteAtualizarRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Cliente atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente não localizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Conflito de documento',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Clientes'],
        summary: 'Desativação lógica do cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador do cliente',
          },
        ],
        responses: {
          '200': {
            description: 'Cliente desativado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteDesativarResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente não localizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/estacoes': {
      get: {
        tags: ['Estações'],
        summary: 'Lista todas as estações e estados atuais',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de estações',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoListaResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Estações'],
        summary: 'Cadastra nova estação de trabalho',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EstacaoCriarRequisicao' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Estação cadastrada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Número de estação ou IP já cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/estacoes/{id}': {
      get: {
        tags: ['Estações'],
        summary: 'Obtém dados detalhados da estação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da estação',
          },
        ],
        responses: {
          '200': {
            description: 'Dados da estação',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Estação não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Estações'],
        summary: 'Atualiza dados cadastrais da estação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da estação',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EstacaoAtualizarRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Estação atualizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Estação não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Conflito de IP ou número',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Estações'],
        summary: 'Desativação lógica da estação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da estação',
          },
        ],
        responses: {
          '200': {
            description: 'Estação desativada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoDesativarResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Estação não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/estacoes/{id}/status': {
      patch: {
        tags: ['Estações'],
        summary: 'Altera status manual da estação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da estação',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EstacaoStatusRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EstacaoResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Estação não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/sessoes': {
      post: {
        tags: ['Sessões'],
        summary: 'Inicia uma nova sessão de uso (pré ou pós-paga)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SessaoIniciarRequisicao' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Sessão iniciada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessaoResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente, estação ou tarifa ativa não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Estação indisponível ou cliente já possui sessão ativa',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '422': {
            description: 'Saldo insuficiente para modalidade pré-paga',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/sessoes/ativas': {
      get: {
        tags: ['Sessões'],
        summary: 'Lista todas as sessões em andamento (ativas e pausadas)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de sessões ativas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sucesso: { type: 'boolean', example: true },
                    dados: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SessaoDetalhesResposta/properties/dados' },
                    },
                  },
                  required: ['sucesso', 'dados'],
                },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/sessoes/{id}': {
      get: {
        tags: ['Sessões'],
        summary: 'Obtém dados detalhados da sessão por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da sessão',
          },
        ],
        responses: {
          '200': {
            description: 'Dados da sessão',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessaoDetalhesResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Sessão não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/sessoes/{id}/finalizar': {
      post: {
        tags: ['Sessões'],
        summary: 'Finaliza sessão de uso e apura cobrança',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da sessão',
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SessaoFinalizarRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sessão finalizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessaoFinalizarResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Sessão ou tarifa não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '409': {
            description: 'Sessão já finalizada ou cancelada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '422': {
            description: 'Saldo insuficiente para quitação de sessão pré-paga',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/creditos/recarga': {
      post: {
        tags: ['Créditos'],
        summary: 'Registra recarga de créditos para cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecargaRequisicao' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Recarga realizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecargaResposta' },
              },
            },
          },
          '400': {
            description: 'Valor de recarga inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente não localizado ou inativo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/creditos/extrato/{clienteId}': {
      get: {
        tags: ['Créditos'],
        summary: 'Consulta extrato de transações de crédito do cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'clienteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador do cliente',
          },
        ],
        responses: {
          '200': {
            description: 'Extrato financeiro do cliente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExtratoListaResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Cliente não localizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/tarifas': {
      get: {
        tags: ['Tarifas'],
        summary: 'Lista tarifas vigentes por categoria',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de tarifas ativas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TarifaListaResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tarifas'],
        summary: 'Cadastra nova tarifa para uma categoria',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TarifaCriarRequisicao' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tarifa cadastrada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TarifaResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/tarifas/{id}': {
      get: {
        tags: ['Tarifas'],
        summary: 'Obtém dados detalhados da tarifa por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da tarifa',
          },
        ],
        responses: {
          '200': {
            description: 'Dados da tarifa',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TarifaResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Tarifa não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Tarifas'],
        summary: 'Atualiza valor por minuto da tarifa ativa',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da tarifa',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TarifaAtualizarRequisicao' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tarifa atualizada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TarifaResposta' },
              },
            },
          },
          '400': {
            description: 'Entrada inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Tarifa não localizada ou inativa',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Tarifas'],
        summary: 'Desativação lógica da tarifa',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Identificador da tarifa',
          },
        ],
        responses: {
          '200': {
            description: 'Tarifa desativada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TarifaDesativarResposta' },
              },
            },
          },
          '401': {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
          '404': {
            description: 'Tarifa não localizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErroResposta' },
              },
            },
          },
        },
      },
    },
    '/docs': {
      get: {
        tags: ['Documentação'],
        summary: 'Exibe a documentação interativa Swagger UI',
        responses: {
          '200': {
            description: 'Página HTML interativa da documentação Swagger UI',
            content: {
              'text/html': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

