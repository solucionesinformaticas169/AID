-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "EmailTemplateKind" AS ENUM (
        'VERIFY_EMAIL',
        'PASSWORD_RESET',
        'APPLICATION_SUBMITTED',
        'NEW_APPLICATION',
        'JOB_PUBLISHED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "EmailDeliveryStatus" AS ENUM (
        'PENDING',
        'SENT',
        'FAILED',
        'RATE_LIMITED',
        'SKIPPED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailDeliveryLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "templateKind" "EmailTemplateKind" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "providerEmailId" TEXT,
    "idempotencyKey" TEXT,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_type_tokenHash_key"
ON "AuthToken"("type", "tokenHash");

CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_usedAt_idx"
ON "AuthToken"("userId", "type", "usedAt");

CREATE INDEX IF NOT EXISTS "AuthToken_expiresAt_idx"
ON "AuthToken"("expiresAt");

CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_recipientEmail_templateKind_createdAt_idx"
ON "EmailDeliveryLog"("recipientEmail", "templateKind", "createdAt");

CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_userId_templateKind_createdAt_idx"
ON "EmailDeliveryLog"("userId", "templateKind", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuthToken_userId_fkey'
    ) THEN
        ALTER TABLE "AuthToken"
            ADD CONSTRAINT "AuthToken_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailDeliveryLog_userId_fkey'
    ) THEN
        ALTER TABLE "EmailDeliveryLog"
            ADD CONSTRAINT "EmailDeliveryLog_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "User"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
