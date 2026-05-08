-- CreateEnum
CREATE TYPE "QualityPlanScope" AS ENUM ('SEASONAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'DISBANDED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'EVIDENCE_READY', 'VERIFIED', 'WEAK');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DGReportType" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "DGReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('WORKSHOP', 'EVENT', 'MEDIA', 'TRAINING');

-- CreateTable
CREATE TABLE "quality_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "scope" "QualityPlanScope" NOT NULL DEFAULT 'YEARLY',
    "season" TEXT,
    "goals" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "workflowInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_teams" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "charter" JSONB NOT NULL,
    "leadEmpId" TEXT,
    "members" JSONB NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'PROPOSED',
    "workflowInstanceId" TEXT,
    "relatedKpiCode" TEXT,
    "relatedPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_team_tasks" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeEmpId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_team_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accreditations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "standardCode" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "cycle" TEXT NOT NULL,
    "status" "AccreditationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "responsibleEmpId" TEXT,
    "dueDate" TIMESTAMP(3),
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accreditation_evidence" (
    "id" TEXT NOT NULL,
    "accreditationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accreditation_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_outcomes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "passRate" DECIMAL(5,2),
    "employmentRate" DECIMAL(5,2),
    "employerSatisfaction" DECIMAL(5,2),
    "studentSatisfaction" DECIMAL(5,2),
    "notes" TEXT,
    "measuredById" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "providerName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(15,2),
    "justification" TEXT NOT NULL,
    "status" "NominationStatus" NOT NULL DEFAULT 'PROPOSED',
    "workflowInstanceId" TEXT,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "outcomeNotes" TEXT,
    "recommendedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dg_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "DGReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "gmFeedback" TEXT,
    "gmFeedbackAt" TIMESTAMP(3),
    "status" "DGReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dg_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_campaigns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "objectiveAr" TEXT NOT NULL,
    "materialsUrl" TEXT,
    "attendeesCount" INTEGER,
    "impactAssessment" TEXT,
    "ownerEmpId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_plans_workflowInstanceId_key" ON "quality_plans"("workflowInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_plans_tenantId_fiscalYear_scope_season_key" ON "quality_plans"("tenantId", "fiscalYear", "scope", "season");

-- CreateIndex
CREATE UNIQUE INDEX "quality_teams_workflowInstanceId_key" ON "quality_teams"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "quality_team_tasks_teamId_status_idx" ON "quality_team_tasks"("teamId", "status");

-- CreateIndex
CREATE INDEX "accreditations_tenantId_status_idx" ON "accreditations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "accreditations_tenantId_standardCode_cycle_key" ON "accreditations"("tenantId", "standardCode", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "training_outcomes_tenantId_departmentId_term_key" ON "training_outcomes"("tenantId", "departmentId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_workflowInstanceId_key" ON "nominations"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "nominations_tenantId_status_idx" ON "nominations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dg_reports_tenantId_period_type_key" ON "dg_reports"("tenantId", "period", "type");

-- AddForeignKey
ALTER TABLE "quality_team_tasks" ADD CONSTRAINT "quality_team_tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "quality_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accreditation_evidence" ADD CONSTRAINT "accreditation_evidence_accreditationId_fkey" FOREIGN KEY ("accreditationId") REFERENCES "accreditations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
