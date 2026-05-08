import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { WorkflowService } from '../../workflow/workflow.service';

@Injectable()
export class QualityPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly workflow: WorkflowService,
  ) {}

  list(query: { fiscalYear?: string; scope?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityPlan.findMany({
      where: {
        tenantId,
        fiscalYear: query.fiscalYear,
        scope: query.scope as any,
        status: query.status as any,
      },
      orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const plan = await this.prisma.qualityPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException({ messageAr: 'الخطة غير موجودة' });
    return plan;
  }

  create(data: {
    fiscalYear: string;
    scope: 'SEASONAL' | 'YEARLY';
    season?: string;
    goals: any[];
    activities: any[];
    createdById: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    if (data.scope === 'SEASONAL' && !data.season) {
      throw new BadRequestException({ messageAr: 'الخطة الفصلية تحتاج تحديد الفصل (Q1-Q4)' });
    }
    return this.prisma.qualityPlan.create({
      data: {
        tenantId,
        fiscalYear: data.fiscalYear,
        scope: data.scope as any,
        season: data.season,
        goals: data.goals as any,
        activities: data.activities as any,
        createdById: data.createdById,
      },
    });
  }

  async update(id: string, data: { goals?: any[]; activities?: any[] }) {
    const tenantId = this.tenancy.getTenantId();
    const plan = await this.prisma.qualityPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException();
    if (plan.status !== 'DRAFT') {
      throw new BadRequestException({ messageAr: 'لا يمكن تعديل خطة مقدّمة' });
    }
    return this.prisma.qualityPlan.update({
      where: { id },
      data: {
        goals: data.goals as any ?? plan.goals,
        activities: data.activities as any ?? plan.activities,
      },
    });
  }

  async submit(id: string, userId: string) {
    const tenantId = this.tenancy.getTenantId();
    const plan = await this.prisma.qualityPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException();
    if (plan.status !== 'DRAFT') {
      throw new BadRequestException({ messageAr: 'الخطة مقدّمة مسبقاً' });
    }

    // إن وُجدت workflow definition للجودة استخدمها، وإلا اعتمد مباشرة من العميد
    try {
      const flow = await this.workflow.start({
        tenantId,
        initiatedById: userId,
        definitionCode: 'QUALITY_PLAN_APPROVAL',
        entityType: 'quality_plan',
        entityId: id,
        data: { fiscalYear: plan.fiscalYear, scope: plan.scope },
      });
      return this.prisma.qualityPlan.update({
        where: { id },
        data: { status: 'SUBMITTED', workflowInstanceId: flow.id },
      });
    } catch {
      // لو ما وُجد workflow، علّمها submitted فقط
      return this.prisma.qualityPlan.update({
        where: { id },
        data: { status: 'SUBMITTED' },
      });
    }
  }
}
