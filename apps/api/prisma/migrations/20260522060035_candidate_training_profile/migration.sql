-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "certificationType" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "studyArea" TEXT,
ADD COLUMN     "totalDays" INTEGER,
ADD COLUMN     "totalHours" INTEGER;
