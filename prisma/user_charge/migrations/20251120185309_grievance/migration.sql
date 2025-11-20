-- CreateTable
CREATE TABLE "public"."grievance" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "remark" TEXT NOT NULL,
    "entry_ip" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_pkey" PRIMARY KEY ("id")
);
