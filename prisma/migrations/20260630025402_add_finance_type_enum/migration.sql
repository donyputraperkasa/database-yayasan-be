/*
  Warnings:

  - You are about to alter the column `type` on the `finances` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `finances` MODIFY `type` ENUM('spp', 'dpp', 'bos', 'bosda', 'rekening') NOT NULL;
