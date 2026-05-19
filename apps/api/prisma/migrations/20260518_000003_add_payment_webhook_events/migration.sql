-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" TEXT,
    "providerTransactionId" TEXT,
    "eventType" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processingStatus" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_providerEventId_idx"
ON "PaymentWebhookEvent"("provider", "providerEventId");

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_providerTransactionId_idx"
ON "PaymentWebhookEvent"("provider", "providerTransactionId");

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_processingStatus_idx"
ON "PaymentWebhookEvent"("provider", "processingStatus");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PaymentWebhookEvent_paymentId_fkey'
    ) THEN
        ALTER TABLE "PaymentWebhookEvent"
            ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey"
            FOREIGN KEY ("paymentId")
            REFERENCES "Payment"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
