-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CLIENT';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "hasAccount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "file" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ALTER COLUMN "accepted" DROP NOT NULL,
ALTER COLUMN "accepted" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");
