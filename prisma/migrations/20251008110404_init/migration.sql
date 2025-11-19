-- CreateTable
CREATE TABLE "public"."ulb_master" (
    "id" SERIAL NOT NULL,
    "ulb_type_id" INTEGER NOT NULL,
    "name" TEXT,
    "name_hindi" TEXT,
    "address" TEXT,
    "nigamtollfreeno" TEXT,
    "receipttollfreeno" TEXT,
    "bankname" TEXT,
    "accountno" TEXT,
    "ifsccode" TEXT,
    "municipallogo" TEXT,
    "agencyfullname" TEXT,
    "agencylogo" TEXT,
    "domainname" TEXT,
    "gstno" TEXT,
    "entryby" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "payee_id" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ulb_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ulb_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ulb_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zone_circle_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "name" TEXT NOT NULL,
    "zone_address" TEXT,
    "zone_commissioner" TEXT,
    "zon_commissioner_contact" TEXT,
    "tollFree_No" TEXT,
    "zonecode" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "recstatus" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_circle_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ward_master" (
    "id" SERIAL NOT NULL,
    "zone_circle_id" INTEGER NOT NULL,
    "ward_no" TEXT NOT NULL,
    "name" TEXT,
    "ward_code" TEXT,
    "area" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ward_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "agency_id" INTEGER NOT NULL,
    "moduleType_id" INTEGER NOT NULL,
    "empCode" TEXT NOT NULL,
    "empFirstName" TEXT NOT NULL,
    "empLastName" TEXT NOT NULL,
    "empImage" TEXT,
    "contactNo" TEXT NOT NULL,
    "empEmail" TEXT,
    "aadharNo" TEXT,
    "empAddress" TEXT,
    "joiningDate" TEXT,
    "accountHolderName" TEXT,
    "accountNo" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "experienceYears" TEXT,
    "jobDescription" TEXT,
    "reportToTypeId" TEXT,
    "reportToUserId" TEXT,
    "blockPayment" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "entryBy" TEXT,
    "entryIpAddress" TEXT,
    "updateBy" TEXT,
    "updateIpAddress" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ulb_masterId" INTEGER,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "ulb_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "ulb_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentId" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ulb_masterTouser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ulb_masterTouser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_userToward_master" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_userToward_master_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserRoles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_RolePermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserRevokedPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserRevokedPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MenuPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MenuPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_moduleTopermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_moduleTopermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "public"."user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "employee_user_id_key" ON "public"."employee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "public"."role"("name");

-- CreateIndex
CREATE INDEX "_ulb_masterTouser_B_index" ON "public"."_ulb_masterTouser"("B");

-- CreateIndex
CREATE INDEX "_userToward_master_B_index" ON "public"."_userToward_master"("B");

-- CreateIndex
CREATE INDEX "_UserRoles_B_index" ON "public"."_UserRoles"("B");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "public"."_RolePermissions"("B");

-- CreateIndex
CREATE INDEX "_UserPermissions_B_index" ON "public"."_UserPermissions"("B");

-- CreateIndex
CREATE INDEX "_UserRevokedPermissions_B_index" ON "public"."_UserRevokedPermissions"("B");

-- CreateIndex
CREATE INDEX "_MenuPermissions_B_index" ON "public"."_MenuPermissions"("B");

-- CreateIndex
CREATE INDEX "_moduleTopermissions_B_index" ON "public"."_moduleTopermissions"("B");

-- AddForeignKey
ALTER TABLE "public"."ulb_master" ADD CONSTRAINT "ulb_master_ulb_type_id_fkey" FOREIGN KEY ("ulb_type_id") REFERENCES "public"."ulb_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zone_circle_master" ADD CONSTRAINT "zone_circle_master_ulb_id_fkey" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ward_master" ADD CONSTRAINT "ward_master_zone_circle_id_fkey" FOREIGN KEY ("zone_circle_id") REFERENCES "public"."zone_circle_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee" ADD CONSTRAINT "employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee" ADD CONSTRAINT "employee_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee" ADD CONSTRAINT "employee_moduleType_id_fkey" FOREIGN KEY ("moduleType_id") REFERENCES "public"."module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee" ADD CONSTRAINT "employee_ulb_masterId_fkey" FOREIGN KEY ("ulb_masterId") REFERENCES "public"."ulb_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role" ADD CONSTRAINT "role_ulb_id_fkey" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_ulb_id_fkey" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu" ADD CONSTRAINT "menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agency" ADD CONSTRAINT "agency_ulb_id_fkey" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module" ADD CONSTRAINT "module_ulb_id_fkey" FOREIGN KEY ("ulb_id") REFERENCES "public"."ulb_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ulb_masterTouser" ADD CONSTRAINT "_ulb_masterTouser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ulb_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ulb_masterTouser" ADD CONSTRAINT "_ulb_masterTouser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_userToward_master" ADD CONSTRAINT "_userToward_master_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_userToward_master" ADD CONSTRAINT "_userToward_master_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ward_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserRoles" ADD CONSTRAINT "_UserRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserRoles" ADD CONSTRAINT "_UserRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserPermissions" ADD CONSTRAINT "_UserPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserPermissions" ADD CONSTRAINT "_UserPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserRevokedPermissions" ADD CONSTRAINT "_UserRevokedPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserRevokedPermissions" ADD CONSTRAINT "_UserRevokedPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuPermissions" ADD CONSTRAINT "_MenuPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MenuPermissions" ADD CONSTRAINT "_MenuPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_moduleTopermissions" ADD CONSTRAINT "_moduleTopermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_moduleTopermissions" ADD CONSTRAINT "_moduleTopermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
