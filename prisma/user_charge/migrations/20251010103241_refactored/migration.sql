/*
  Warnings:

  - You are about to drop the column `is_verified` on the `survey_master` table. All the data in the column will be lost.
  - You are about to drop the column `qr_number` on the `survey_master` table. All the data in the column will be lost.
  - You are about to drop the column `verified_by` on the `survey_master` table. All the data in the column will be lost.
  - You are about to drop the column `qr_number` on the `user_charge_data` table. All the data in the column will be lost.
  - You are about to drop the column `qr_number` on the `waste_collection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[integrated_property_id]` on the table `user_charge_data` will be added. If there are existing duplicate values, this will fail.
  - Made the column `user_charge_id` on table `survey_master` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `survey_master` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `survey_master` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recstatus` on table `survey_master` required. This step will fail if there are existing NULL values in that column.
  - Made the column `integrated_property_id` on table `user_charge_data` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `user_charge_id` to the `waste_collection` table without a default value. This is not possible if the table is not empty.
  - Made the column `recstatus` on table `waste_collection` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."waste_collection" DROP CONSTRAINT "waste_collection_qr_number_fkey";

-- DropIndex
DROP INDEX "public"."user_charge_data_qr_number_key";

-- AlterTable
ALTER TABLE "public"."survey_master" DROP COLUMN "is_verified",
DROP COLUMN "qr_number",
DROP COLUMN "verified_by",
ALTER COLUMN "user_charge_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "recstatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_charge_data" DROP COLUMN "qr_number",
ADD COLUMN     "is_tagged" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "integrated_property_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."waste_collection" DROP COLUMN "qr_number",
ADD COLUMN     "user_charge_id" BIGINT NOT NULL,
ALTER COLUMN "recstatus" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_charge_data_integrated_property_id_key" ON "public"."user_charge_data"("integrated_property_id");

-- AddForeignKey
ALTER TABLE "public"."waste_collection" ADD CONSTRAINT "waste_collection_user_charge_id_fkey" FOREIGN KEY ("user_charge_id") REFERENCES "public"."user_charge_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
