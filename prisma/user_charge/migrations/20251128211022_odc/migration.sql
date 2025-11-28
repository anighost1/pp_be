/*
  Warnings:

  - Added the required column `address` to the `on_demand_collection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."on_demand_collection" ADD COLUMN     "address" TEXT NOT NULL;
