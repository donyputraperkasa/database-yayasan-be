-- AlterTable
ALTER TABLE `employees` ADD COLUMN `position` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('guru', 'pegawai') NOT NULL DEFAULT 'guru';
