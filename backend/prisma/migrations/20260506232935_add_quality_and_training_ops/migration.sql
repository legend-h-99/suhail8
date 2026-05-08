-- CreateEnum
CREATE TYPE "TrainingPlanScope" AS ENUM ('SEASONAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('LOGGED', 'FOLLOW_UP_NEEDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('IN_PROGRESS', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QIPStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "scope" "TrainingPlanScope" NOT NULL DEFAULT 'YEARLY',
    "goals" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "workflowInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_visits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "visitorEmpId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT,
    "rating" DECIMAL(4,2) NOT NULL,
    "observations" TEXT NOT NULL,
    "recommendations" TEXT,
    "followUpAt" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'LOGGED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_reviews" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT,
    "reviewYear" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ANNUAL',
    "marketAlignmentScore" DECIMAL(4,2),
    "recommendations" TEXT NOT NULL,
    "approvedById" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_feedback" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "trainerId" TEXT,
    "courseCode" TEXT,
    "feedback" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_improvement_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "targetKpiCode" TEXT,
    "targetValue" DECIMAL(15,2),
    "actions" JSONB NOT NULL,
    "ownerEmpId" TEXT,
    "status" "QIPStatus" NOT NULL DEFAULT 'DRAFT',
    "outcomeNotes" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_improvement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_workflowInstanceId_key" ON "training_plans"("workflowInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_tenantId_departmentId_fiscalYear_scope_key" ON "training_plans"("tenantId", "departmentId", "fiscalYear", "scope");

-- CreateIndex
CREATE INDEX "supervision_visits_tenantId_trainerId_idx" ON "supervision_visits"("tenantId", "trainerId");

-- CreateIndex
CREATE INDEX "supervision_visits_visitDate_idx" ON "supervision_visits"("visitDate");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_reviews_tenantId_departmentId_reviewYear_key" ON "curriculum_reviews"("tenantId", "departmentId", "reviewYear");

-- CreateIndex
CREATE INDEX "quality_improvement_plans_tenantId_status_idx" ON "quality_improvement_plans"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "workflow_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_visits" ADD CONSTRAINT "supervision_visits_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_reviews" ADD CONSTRAINT "curriculum_reviews_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_feedback" ADD CONSTRAINT "curriculum_feedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "curriculum_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_feedback" ADD CONSTRAINT "curriculum_feedback_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_improvement_plans" ADD CONSTRAINT "quality_improvement_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
