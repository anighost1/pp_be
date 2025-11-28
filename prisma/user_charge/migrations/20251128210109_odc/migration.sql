-- CreateTable
CREATE TABLE "public"."vehicle_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."on_demand_collection" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "remark" TEXT NOT NULL,
    "entry_ip" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "on_demand_collection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."on_demand_collection" ADD CONSTRAINT "on_demand_collection_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
