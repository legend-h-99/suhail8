import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class ImprovementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { fiscalYear?: string; status?: string; scope?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityImprovementPlan.findMany({
      where: {
        tenantId,
        fiscalYear: query.fiscalYear,
        status: query.status as any,
        scope: query.scope,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const qip = await this.prisma.qualityImprovementPlan.findFirst({ where: { id, tenantId } });
    if (!qip) throw new NotFoundException({ messageAr: 'خطة التحسين غير موجودة' });
    return qip;
  }

  create(data: {
    fiscalYear: string;
    scope: string;
    rootCause: string;
    targetKpiCode?: string;
    targetValue?: number;
    actions: any[];
    ownerEmpId?: string;
    startDate?: string;
    dueDate?: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityImprovementPlan.create({
      data: {
        tenantId,
        fiscalYear: data.fiscalYear,
        scope: data.scope,
        rootCause: data.rootCause,
        targetKpiCode: data.targetKpiCode,
        targetValue: data.targetValue,
        actions: data.actions,
        ownerEmpId: data.ownerEmpId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  start(id: string) {
    return this.prisma.qualityImprovementPlan.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startDate: new Date() },
    });
  }

  complete(id: string, outcomeNotes?: string) {
    return this.prisma.qualityImprovementPlan.update({
      where: { id },
      data: { status: 'COMPLETED', closedAt: new Date(), outcomeNotes },
    });
  }
}
