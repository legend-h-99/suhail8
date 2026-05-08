import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class TrainingOutcomesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { departmentId?: string; term?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainingOutcome.findMany({
      where: { tenantId, departmentId: query.departmentId, term: query.term },
      orderBy: [{ term: 'desc' }, { measuredAt: 'desc' }],
    });
  }

  upsert(data: {
    departmentId: string;
    term: string;
    passRate?: number;
    employmentRate?: number;
    employerSatisfaction?: number;
    studentSatisfaction?: number;
    notes?: string;
    measuredById: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainingOutcome.upsert({
      where: { tenantId_departmentId_term: { tenantId, departmentId: data.departmentId, term: data.term } },
      update: {
        passRate: data.passRate,
        employmentRate: data.employmentRate,
        employerSatisfaction: data.employerSatisfaction,
        studentSatisfaction: data.studentSatisfaction,
        notes: data.notes,
        measuredById: data.measuredById,
        measuredAt: new Date(),
      },
      create: {
        tenantId,
        departmentId: data.departmentId,
        term: data.term,
        passRate: data.passRate,
        employmentRate: data.employmentRate,
        employerSatisfaction: data.employerSatisfaction,
        studentSatisfaction: data.studentSatisfaction,
        notes: data.notes,
        measuredById: data.measuredById,
      },
    });
  }
}
