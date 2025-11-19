-- CreateTable
CREATE TABLE "public"."user_charge_data" (
    "id" BIGSERIAL NOT NULL,
    "mc_name" TEXT,
    "pid_type" TEXT,
    "property_id" TEXT,
    "owner_name" TEXT,
    "integrated_property_id" TEXT,
    "integrated_owner_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "authority" TEXT,
    "colony" TEXT,
    "address" TEXT,
    "mobile" TEXT,
    "category" TEXT,
    "type" TEXT,
    "sub_type" TEXT,
    "area" DOUBLE PRECISION,
    "unit" TEXT,
    "authorized_area" TEXT,
    "property_image" TEXT,
    "bill_sequence" DOUBLE PRECISION,
    "is_selfcertified" TEXT,
    "qr_number" TEXT,

    CONSTRAINT "user_charge_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."survey_master" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "user_charge_id" BIGINT,
    "is_verified" BOOLEAN DEFAULT false,
    "entry_ip" TEXT,
    "qr_number" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "verified_by" INTEGER,
    "doc_path" TEXT[],
    "recstatus" INTEGER DEFAULT 1,
    "remark" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "survey_master_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."survey_master" ADD CONSTRAINT "user_charge_survey" FOREIGN KEY ("user_charge_id") REFERENCES "public"."user_charge_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
