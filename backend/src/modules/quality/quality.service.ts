import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  // KPIs
  listKpis() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.kpi.findMany({
      where: { tenantId },
      include: { measurements: { orderBy: { period: 'desc' }, take: 6 } },
    });
  }

  upsertKpi(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.kpi.upsert({
      where: { tenantId_code: { tenantId, code: data.code } },
      update: data,
      create: { ...data, tenantId },
    });
  }

  recordKpi(kpiId: string, period: string, value: number, notes?: string) {
    return this.prisma.kpiMeasurement.upsert({
      where: { kpiId_period: { kpiId, period } },
      update: { value, notes },
      create: { kpiId, period, value, notes },
    });
  }

  // Surveys
  listSurveys() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.survey.findMany({ where: { tenantId } });
  }

  createSurvey(data: { title: string; audience: string; questions: any }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.survey.create({ data: { ...data, tenantId } });
  }

  respond(surveyId: string, respondentId: string, answers: any) {
    return this.prisma.surveyResponse.create({
      data: { surveyId, respondentId, answers },
    });
  }

  // Risks
  listRisks() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.risk.findMany({ where: { tenantId }, orderBy: { score: 'desc' } });
  }

  registerRisk(data: any) {
    const tenantId = this.tenancy.getTenantId();
    const score = (data.likelihood ?? 1) * (data.impact ?? 1);
    return this.prisma.risk.create({ data: { ...data, tenantId, score } });
  }
}
