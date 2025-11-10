/*
  Warnings:

  - Added the required column `hashedPassword` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'NUTRITIONIST');
    END IF;
END$$;

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "hashedPassword" TEXT,
    ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill hashedPassword for existing rows to satisfy NOT NULL constraint
UPDATE "User"
SET "hashedPassword" = COALESCE("hashedPassword", 'dev-placeholder-hash');

ALTER TABLE "User"
    ALTER COLUMN "hashedPassword" SET NOT NULL;

-- CreateTable
CREATE TABLE "lab_marker_refs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "low" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_marker_refs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_marker_refs_code_key" ON "lab_marker_refs"("code");
