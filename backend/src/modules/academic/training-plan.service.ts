import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { WorkflowService } from '../../workflow/workflow.service';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly workflow: WorkflowService,
  ) {}

  list(query: { departmentId?: string; fiscalYear?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainingPlan.findMany({
      where: {
        tenantId,
        departmentId: query.departmentId,
        fiscalYear: query.fiscalYear,
        status: query.status as any,
      },
      include: { department: { select: { nameAr: true, code: true } } },
      orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id, tenantId },
      include: { department: true, workflowInstance: { include: { steps: true } } },
    });
    if (!plan) throw new NotFoundException({ messageAr: 'الخطة غير موجودة' });
    return plan;
  }

  async create(data: {
    departmentId: string;
    fiscalYear: string;
    scope?: 'SEASONAL' | 'YEARLY';
    goals: any[];
    activities: any[];
    createdById: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    if (!Array.isArray(data.goals) || !Array.isArray(data.activities)) {
      throw new BadRequestException({ messageAr: 'الأهداف والنشاطات يجب أن تكون قوائم' });
    }
    return this.prisma.trainingPlan.create({
      data: {
        tenantId,
        departmentId: data.departmentId,
        fiscalYear: data.fiscalYear,
        scope: (data.scope ?? 'YEARLY') as any,
        goals: data.goals,
        activities: data.activities,
        createdById: data.createdById,
      },
    });
  }

  async submit(id: string, userId: string) {
    const tenantId = this.tenancy.getTenantId();
    const plan = await this.prisma.trainingPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException({ messageAr: 'الخطة غير موجودة' });
    if (plan.status !== 'DRAFT') {
      throw new BadRequestException({ messageAr: 'الخطة مقدّمة مسبقاً' });
    }

    const flow = await this.workflow.start({
      tenantId,
      initiatedById: userId,
      definitionCode: 'TRAINING_PLAN_APPROVAL',
      entityType: 'training_plan',
      entityId: id,
      data: { fiscalYear: plan.fiscalYear, scope: plan.scope },
    });

    return this.prisma.trainingPlan.update({
      where: { id },
      data: { status: 'SUBMITTED', workflowInstanceId: flow.id },
    });
  }

  async approve(id: string) {
    return this.prisma.trainingPlan.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }
}
