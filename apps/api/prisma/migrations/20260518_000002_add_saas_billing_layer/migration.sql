-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'PAYPHONE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'FAILED', 'VOID');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'PlanCode'
          AND e.enumlabel = 'MONTHLY'
    ) THEN
        ALTER TYPE "PlanCode" RENAME VALUE 'MONTHLY' TO 'PROFESSIONAL';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'PlanCode'
          AND e.enumlabel = 'ANNUAL'
    ) THEN
        ALTER TYPE "PlanCode" RENAME VALUE 'ANNUAL' TO 'ENTERPRISE';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;

ALTER TABLE "Company"
    ADD COLUMN IF NOT EXISTS "billingEmail" TEXT,
    ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
    ADD COLUMN IF NOT EXISTS "paypalCustomerId" TEXT,
    ADD COLUMN IF NOT EXISTS "status" "CompanyStatus";

UPDATE "Company"
SET "status" = 'PENDING'
WHERE "status" IS NULL;

ALTER TABLE "Company"
    ALTER COLUMN "status" SET DEFAULT 'PENDING',
    ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "JobOffer"
    ADD COLUMN IF NOT EXISTS "requiredEducationLevel" TEXT,
    ADD COLUMN IF NOT EXISTS "minimumYearsExperience" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "requiredLanguages" JSONB,
    ADD COLUMN IF NOT EXISTS "requiredCertifications" JSONB,
    ADD COLUMN IF NOT EXISTS "priorityPublication" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "JobApplication"
    ADD COLUMN IF NOT EXISTS "selectedEducationIds" TEXT[],
    ADD COLUMN IF NOT EXISTS "selectedWorkExperienceIds" TEXT[],
    ADD COLUMN IF NOT EXISTS "selectedCertificationIds" TEXT[],
    ADD COLUMN IF NOT EXISTS "calculatedYearsExperience" DECIMAL(6,2),
    ADD COLUMN IF NOT EXISTS "meetsRequirements" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "compatibilityScore" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "compatibilityReport" JSONB;

UPDATE "JobApplication"
SET
    "selectedEducationIds" = COALESCE("selectedEducationIds", ARRAY[]::TEXT[]),
    "selectedWorkExperienceIds" = COALESCE("selectedWorkExperienceIds", ARRAY[]::TEXT[]),
    "selectedCertificationIds" = COALESCE("selectedCertificationIds", ARRAY[]::TEXT[])
WHERE
    "selectedEducationIds" IS NULL
    OR "selectedWorkExperienceIds" IS NULL
    OR "selectedCertificationIds" IS NULL;

ALTER TABLE "JobApplication"
    ALTER COLUMN "selectedEducationIds" SET NOT NULL,
    ALTER COLUMN "selectedWorkExperienceIds" SET NOT NULL,
    ALTER COLUMN "selectedCertificationIds" SET NOT NULL;

ALTER TABLE "Plan"
    ADD COLUMN IF NOT EXISTS "priorityPublication" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "advancedMetrics" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "featuredCandidates" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Subscription"
    ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider",
    ADD COLUMN IF NOT EXISTS "externalSubscriptionId" TEXT,
    ADD COLUMN IF NOT EXISTS "externalCustomerId" TEXT,
    ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "planSnapshot" JSONB;

ALTER TABLE "Payment"
    ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider",
    ADD COLUMN IF NOT EXISTS "providerPaymentId" TEXT,
    ADD COLUMN IF NOT EXISTS "checkoutUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "providerPayload" JSONB;

UPDATE "Payment"
SET "provider" = 'STRIPE'
WHERE "provider" IS NULL;

ALTER TABLE "Payment"
    ALTER COLUMN "provider" SET NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobApplicationTimeline" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "status" "JobApplicationStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplicationTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BillingInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paymentId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceNumber" TEXT NOT NULL,
    "externalInvoiceId" TEXT,
    "invoicePdfPath" TEXT,
    "invoiceUrl" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "providerPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobApplicationTimeline_jobApplicationId_createdAt_idx"
ON "JobApplicationTimeline"("jobApplicationId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "BillingInvoice_paymentId_key"
ON "BillingInvoice"("paymentId");

CREATE UNIQUE INDEX IF NOT EXISTS "BillingInvoice_invoiceNumber_key"
ON "BillingInvoice"("invoiceNumber");

CREATE INDEX IF NOT EXISTS "BillingInvoice_subscriptionId_status_idx"
ON "BillingInvoice"("subscriptionId", "status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'JobApplicationTimeline_jobApplicationId_fkey'
    ) THEN
        ALTER TABLE "JobApplicationTimeline"
            ADD CONSTRAINT "JobApplicationTimeline_jobApplicationId_fkey"
            FOREIGN KEY ("jobApplicationId")
            REFERENCES "JobApplication"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BillingInvoice_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "BillingInvoice"
            ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey"
            FOREIGN KEY ("subscriptionId")
            REFERENCES "Subscription"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BillingInvoice_planId_fkey'
    ) THEN
        ALTER TABLE "BillingInvoice"
            ADD CONSTRAINT "BillingInvoice_planId_fkey"
            FOREIGN KEY ("planId")
            REFERENCES "Plan"("id")
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BillingInvoice_paymentId_fkey'
    ) THEN
        ALTER TABLE "BillingInvoice"
            ADD CONSTRAINT "BillingInvoice_paymentId_fkey"
            FOREIGN KEY ("paymentId")
            REFERENCES "Payment"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
