/*
  Warnings:

  - Added the required column `updatedAt` to the `donors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ong_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ongs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `wishlist_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `donations` MODIFY `monetaryAmount` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `donors` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `ong_profiles` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `ongs` ADD COLUMN `averageRating` DOUBLE NULL DEFAULT 0.0,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `numberOfRatings` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `password` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `wishlist_items` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `donor_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bio` VARCHAR(500) NULL,
    `avatarUrl` VARCHAR(255) NULL,
    `contactNumber` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `donorId` INTEGER NOT NULL,

    UNIQUE INDEX `donor_profiles_donorId_key`(`donorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ratings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `score` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ongId` INTEGER NOT NULL,
    `donorId` INTEGER NOT NULL,

    INDEX `ratings_ongId_idx`(`ongId`),
    INDEX `ratings_donorId_idx`(`donorId`),
    UNIQUE INDEX `ratings_ongId_donorId_key`(`ongId`, `donorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    FULLTEXT INDEX `categories_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_tokenHash_key`(`tokenHash`),
    INDEX `password_reset_tokens_email_idx`(`email`),
    INDEX `password_reset_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CategoryToOngProfile` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CategoryToOngProfile_AB_unique`(`A`, `B`),
    INDEX `_CategoryToOngProfile_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE FULLTEXT INDEX `users_name_idx` ON `users`(`name`);

-- AddForeignKey
ALTER TABLE `donor_profiles` ADD CONSTRAINT `donor_profiles_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_ongId_fkey` FOREIGN KEY (`ongId`) REFERENCES `ongs`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryToOngProfile` ADD CONSTRAINT `_CategoryToOngProfile_A_fkey` FOREIGN KEY (`A`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryToOngProfile` ADD CONSTRAINT `_CategoryToOngProfile_B_fkey` FOREIGN KEY (`B`) REFERENCES `ong_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
