/*
  Warnings:

  - Added the required column `monthYear` to the `advantages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthYear` to the `discounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `advantages` ADD COLUMN `monthYear` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `discounts` ADD COLUMN `monthYear` VARCHAR(191) NOT NULL;
