/*
  Warnings:

  - You are about to alter the column `condition` on the `facilities` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `facilities` MODIFY `condition` ENUM('baik', 'rusak_ringan', 'rusak_berat') NOT NULL;
