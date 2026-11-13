-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `login` VARCHAR(50) NOT NULL,
    `senhaHash` VARCHAR(255) NOT NULL,
    `perfil` VARCHAR(20) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizadoEm` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `usuarios_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(36) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `documento` VARCHAR(20) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `email` VARCHAR(120) NULL,
    `saldoCentavos` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizadoEm` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `clientes_documento_key`(`documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estacoes` (
    `id` VARCHAR(36) NOT NULL,
    `numero` INTEGER NOT NULL,
    `nome` VARCHAR(50) NOT NULL,
    `categoria` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `ipHost` VARCHAR(45) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizadoEm` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `estacoes_numero_key`(`numero`),
    UNIQUE INDEX `estacoes_ipHost_key`(`ipHost`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarifas` (
    `id` VARCHAR(36) NOT NULL,
    `categoria` VARCHAR(20) NOT NULL,
    `valorPorMinutoCentavos` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizadoEm` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes` (
    `id` VARCHAR(36) NOT NULL,
    `clienteId` VARCHAR(36) NOT NULL,
    `estacaoId` VARCHAR(36) NOT NULL,
    `operadorInicioId` VARCHAR(36) NOT NULL,
    `operadorFimId` VARCHAR(36) NULL,
    `modalidade` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `iniciadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `finalizadoEm` TIMESTAMP(0) NULL,
    `minutosContratados` INTEGER NULL,
    `minutosUtilizados` INTEGER NULL,
    `valorFinalCentavos` INTEGER NULL,
    `pagoComSaldo` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transacoes_credito` (
    `id` VARCHAR(36) NOT NULL,
    `clienteId` VARCHAR(36) NOT NULL,
    `operadorId` VARCHAR(36) NOT NULL,
    `sessaoId` VARCHAR(36) NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `valorCentavos` INTEGER NOT NULL,
    `saldoAposCentavos` INTEGER NOT NULL,
    `criadoEm` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `transacoes_credito_sessaoId_key`(`sessaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_estacaoId_fkey` FOREIGN KEY (`estacaoId`) REFERENCES `estacoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_operadorInicioId_fkey` FOREIGN KEY (`operadorInicioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_operadorFimId_fkey` FOREIGN KEY (`operadorFimId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacoes_credito` ADD CONSTRAINT `transacoes_credito_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacoes_credito` ADD CONSTRAINT `transacoes_credito_operadorId_fkey` FOREIGN KEY (`operadorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacoes_credito` ADD CONSTRAINT `transacoes_credito_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `sessoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
