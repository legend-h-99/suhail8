-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'TEAM', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'TERM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "isLab" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "trainer_notes" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "safetyCheck" JSONB,
    "mood" TEXT,
    "planCompletion" TEXT,
    "notes" TEXT,
    "attendanceMarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_reports" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "body" TEXT NOT NULL,
    "highlights" JSONB,
    "challenges" JSONB,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerComment" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainer_notes_trainerId_traineeId_idx" ON "trainer_notes"("trainerId", "traineeId");

-- CreateIndex
CREATE INDEX "class_sessions_trainerId_date_idx" ON "class_sessions"("trainerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_sectionId_date_key" ON "class_sessions"("sectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_reports_trainerId_period_key" ON "trainer_reports"("trainerId", "period");

-- AddForeignKey
ALTER TABLE "trainer_notes" ADD CONSTRAINT "trainer_notes_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_notes" ADD CONSTRAINT "trainer_notes_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "trainees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_reports" ADD CONSTRAINT "trainer_reports_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
