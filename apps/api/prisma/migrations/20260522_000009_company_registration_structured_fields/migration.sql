ALTER TABLE "Company"
    ADD COLUMN IF NOT EXISTS "commercialName" TEXT,
    ADD COLUMN IF NOT EXISTS "address" TEXT,
    ADD COLUMN IF NOT EXISTS "contactPosition" TEXT;
