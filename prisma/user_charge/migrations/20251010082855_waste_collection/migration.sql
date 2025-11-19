/*
  Warnings:

  - A unique constraint covering the columns `[qr_number]` on the table `user_charge_data` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "public"."waste_collection" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "qr_number" TEXT NOT NULL,
    "entry_ip" TEXT,
    "remark" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "recstatus" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_collection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_charge_data_qr_number_key" ON "public"."user_charge_data"("qr_number");

-- AddForeignKey
ALTER TABLE "public"."waste_collection" ADD CONSTRAINT "waste_collection_qr_number_fkey" FOREIGN KEY ("qr_number") REFERENCES "public"."user_charge_data"("qr_number") ON DELETE RESTRICT ON UPDATE CASCADE;
