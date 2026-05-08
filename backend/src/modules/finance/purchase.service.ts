import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { WorkflowService } from '../../workflow/workflow.service';

const APPROVAL_THRESHOLD_SAR = 100_000; // حسب الوثيقة: حد العميد للاعتماد المباشر

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly workflow: WorkflowService,
  ) {}

  async list(query: { departmentId?: string; status?: string }) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        departmentId: query.departmentId,
        status: query.status as any,
      },
      include: {
        department: { select: { nameAr: true, code: true } },
        items: true,
        workflowInstance: { include: { steps: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        department: true,
        items: true,
        invoices: true,
        attachments: true,
        budget: true,
        workflowInstance: {
          include: { steps: { orderBy: { order: 'asc' }, include: { actedBy: true } } },
        },
      },
    });
    if (!pr) throw new NotFoundException({ messageAr: 'طلب الشراء غير موجود' });
    return pr;
  }

  /**
   * إنشاء طلب شراء + بدء سير اعتماد ديناميكي:
   *   - إذا المبلغ ≤ 100,000: اعتماد العميد مباشرة
   *   - إذا > 100,000: العميد ثم مدير عام المنطقة
   */
  async submit(data: {
    requesterId: string;
    departmentId: string;
    type: 'EQUIPMENT' | 'TRAINING_NEEDS' | 'MAINTENANCE' | 'INSURANCE' | 'COMMUNITY_CENTER' | 'OTHER';
    description: string;
    amount: number;
    items: { nameAr: string; qty: number; unit?: string; unitPrice: number }[];
    vendorName?: string;
    expectedDate?: string;
    budgetId?: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    const total = data.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    if (Math.abs(total - data.amount) > 0.01) {
      throw new BadRequestException({ messageAr: 'الإجمالي لا يطابق البنود' });
    }

    // رقم متسلسل
    const yearShort = String(new Date().getFullYear() - 622); // hijri-ish; adapt to your needs
    const count = await this.prisma.purchaseRequest.count({ where: { number: { startsWith: `PR-${yearShort}-` } } });
    const number = `PR-${yearShort}-${String(count + 1).padStart(4, '0')}`;

    const pr = await this.prisma.purchaseRequest.create({
      data: {
        number,
        requesterId: data.requesterId,
        departmentId: data.departmentId,
        type: data.type as any,
        description: data.description,
        amount: data.amount,
        budgetId: data.budgetId,
        vendorName: data.vendorName,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        status: 'SUBMITTED',
        items: {
          create: data.items.map((i) => ({
            nameAr: i.nameAr,
            qty: i.qty,
            unit: i.unit,
            unitPrice: i.unitPrice,
            total: i.qty * i.unitPrice,
          })),
        },
      },
    });

    const flow = await this.workflow.start({
      tenantId,
      initiatedById: data.requesterId,
      definitionCode: 'PR_APPROVAL',
      entityType: 'purchase_request',
      entityId: pr.id,
      data: { amount: data.amount, threshold: APPROVAL_THRESHOLD_SAR },
    });

    await this.prisma.purchaseRequest.update({
      where: { id: pr.id },
      data: { workflowInstanceId: flow.id, status: 'UNDER_REVIEW' },
    });

    return this.get(pr.id);
  }

  /**
   * يستجيب لاكتمال سير الاعتماد ويحدّث حالة طلب الشراء.
   */
  async syncFromWorkflow(prId: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id: prId },
      include: { workflowInstance: true },
    });
    if (!pr?.workflowInstance) return pr;

    const newStatus =
      pr.workflowInstance.status === 'APPROVED'
        ? 'APPROVED'
        : pr.workflowInstance.status === 'REJECTED'
          ? 'REJECTED'
          : 'UNDER_REVIEW';

    return this.prisma.purchaseRequest.update({
      where: { id: prId },
      data: { status: newStatus as any },
    });
  }
}
