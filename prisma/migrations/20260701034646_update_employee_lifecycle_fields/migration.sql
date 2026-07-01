-- AlterTable
ALTER TABLE `employees` ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `decreeNumber` VARCHAR(191) NULL,
    ADD COLUMN `fee` VARCHAR(191) NULL,
    ADD COLUMN `joinDate` DATETIME(3) NULL,
    ADD COLUMN `otherPosition` VARCHAR(191) NULL,
    ADD COLUMN `religion` VARCHAR(191) NULL,
    ADD COLUMN `retirementAge` INTEGER NULL,
    ADD COLUMN `retirementDate` DATETIME(3) NULL,
    ADD COLUMN `workingPeriod` VARCHAR(191) NULL;
