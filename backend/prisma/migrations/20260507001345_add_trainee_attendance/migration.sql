-- CreateEnum
CREATE TYPE "TraineeAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateTable
CREATE TABLE "trainee_attendance" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "TraineeAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainee_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainee_attendance_date_idx" ON "trainee_attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "trainee_attendance_enrollmentId_date_key" ON "trainee_attendance"("enrollmentId", "date");

-- AddForeignKey
ALTER TABLE "trainee_attendance" ADD CONSTRAINT "trainee_attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
