-- CreateTable
CREATE TABLE `ong_bank_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bankName` VARCHAR(100) NOT NULL,
    `agencyNumber` VARCHAR(20) NOT NULL,
    `accountNumber` VARCHAR(20) NOT NULL,
    `accountType` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ongProfileId` INTEGER NOT NULL,

    UNIQUE INDEX `ong_bank_accounts_ongProfileId_key`(`ongProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ong_bank_accounts` ADD CONSTRAINT `ong_bank_accounts_ongProfileId_fkey` FOREIGN KEY (`ongProfileId`) REFERENCES `ong_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
