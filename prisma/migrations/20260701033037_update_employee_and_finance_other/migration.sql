-- AlterTable
ALTER TABLE `employees` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `finances` MODIFY `type` ENUM('spp', 'dpp', 'bos', 'bosda', 'rekening', 'lain_lain') NOT NULL;
