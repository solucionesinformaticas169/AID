-- AlterTable
ALTER TABLE "Language" ADD COLUMN     "spokenLevel" TEXT,
ADD COLUMN     "writtenLevel" TEXT,
ALTER COLUMN "proficiency" DROP NOT NULL;
