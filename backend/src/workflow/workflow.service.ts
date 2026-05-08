import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { WorkflowStepDef } from './types';

export interface StartFlowParams {
  tenantId: string;
  initiatedById: string;
  definitionCode: string;
  entityType: string;
  entityId: string;
  data?: Record<string, unknown>;
}

export interface ActOnStepParams {
  instanceId: string;
  userId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'DELEGATE';
  comment?: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * يبدأ instance جديدة بناءً على workflow definition.
   * ينشئ ApprovalSteps وفقاً للخطوات المعرّفة، مع تطبيق الشروط.
   */
  async start(params: StartFlowParams) {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { tenantId: params.tenantId, code: params.definitionCode, active: true },
      orderBy: { version: 'desc' },
    });
    if (!def) throw new NotFoundException({ messageAr: 'تعريف سير العمل غير موجود' });

    const stepDefs = ((def.steps as any) ?? []) as WorkflowStepDef[];
    const applicable = stepDefs.filter((s) => this.matchCondition(s, params.data ?? {}));

    if (applicable.length === 0) {
      throw new BadRequestException({ messageAr: 'لا توجد خطوات اعتماد مطلوبة' });
    }

    const instance = await this.prisma.workflowInstance.create({
      data: {
        tenantId: params.tenantId,
        definitionId: def.id,
        entityType: params.entityType,
        entityId: params.entityId,
        initiatedById: params.initiatedById,
        currentStep: applicable[0].key,
        data: params.data as any,
        steps: {
          create: applicable.map((s, idx) => ({
            stepKey: s.key,
            stepNameAr: s.nameAr,
            requiredRole: s.requiredRole ?? null,
            scopeType: s.scope ?? null,
            order: idx,
            status: idx === 0 ? 'ACTIVE' : 'PENDING',
            dueAt: s.slaHours
              ? new Date(Date.now() + s.slaHours * 3600 * 1000)
              : null,
          })),
        },
      },
      include: { steps: true },
    });

    // إشعار: مَن لديهم الدور المطلوب للخطوة الأولى
    await this.notifyStepReviewers(instance.id, params.tenantId, applicable[0], def.nameAr);

    return instance;
  }

  /**
   * إشعار جماعي للمستخدمين أصحاب الدور المطلوب للخطوة.
   */
  private async notifyStepReviewers(
    instanceId: string,
    tenantId: string,
    step: WorkflowStepDef,
    workflowNameAr: string,
  ) {
    if (!step.requiredRole) return;
    const userIds = await this.notifications.findUsersWithRole(tenantId, step.requiredRole);
    if (userIds.length === 0) return;
    await this.notifications.createMany(
      userIds.map((userId) => ({
        tenantId,
        userId,
        type: 'workflow.action_required',
        titleAr: `طلب يحتاج اعتمادكم: ${workflowNameAr}`,
        bodyAr: `الخطوة المطلوبة: ${step.nameAr}`,
        link: '/dashboard/inbox',
        data: { instanceId, step: step.key },
      })),
    );
  }

  /**
   * يأخذ قراراً على الخطوة الحالية للـ instance.
   * يتحقق من صلاحية المستخدم (role required)، ثم يُمرّر إلى الخطوة التالية أو ينهي الـ instance.
   */
  async act(params: ActOnStepParams) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: params.instanceId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!instance) throw new NotFoundException({ messageAr: 'الإجراء غير موجود' });
    if (instance.status !== 'IN_PROGRESS') {
      throw new BadRequestException({ messageAr: 'الإجراء مغلق' });
    }

    const activeStep = instance.steps.find((s) => s.status === 'ACTIVE');
    if (!activeStep) throw new BadRequestException({ messageAr: 'لا توجد خطوة نشطة' });

    if (activeStep.requiredRole) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: params.userId },
        include: { role: true },
      });
      const hasRole = userRoles.some((ur) => ur.role.code === activeStep.requiredRole);
      if (!hasRole) {
        throw new ForbiddenException({
          messageAr: `هذه الخطوة تتطلب دور: ${activeStep.requiredRole}`,
        });
      }
    }

    const stepDecision = this.mapDecision(params.decision);
    const stepStatus =
      params.decision === 'APPROVE'
        ? 'APPROVED'
        : params.decision === 'REJECT'
          ? 'REJECTED'
          : 'PENDING';

    await this.prisma.approvalStep.update({
      where: { id: activeStep.id },
      data: {
        status: stepStatus as any,
        decision: stepDecision as any,
        actedById: params.userId,
        comment: params.comment,
        actedAt: new Date(),
      },
    });

    const def = await this.prisma.workflowDefinition.findUnique({
      where: { id: instance.definitionId },
    });
    const wfName = def?.nameAr ?? 'إجراء';

    if (params.decision === 'REJECT') {
      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: 'REJECTED', completedAt: new Date() },
      });
      await this.syncEntityStatus(instance.entityType, instance.entityId, 'REJECTED');
      // إشعار صاحب الطلب
      await this.notifications.create({
        tenantId: instance.tenantId,
        userId: instance.initiatedById,
        type: 'workflow.rejected',
        titleAr: `تم رفض طلبك: ${wfName}`,
        bodyAr: params.comment ?? undefined,
        link: '/dashboard/inbox',
        data: { instanceId: instance.id },
      });
      return { status: 'REJECTED' };
    }

    if (params.decision === 'APPROVE') {
      const remaining = instance.steps
        .filter((s) => s.id !== activeStep.id)
        .find((s) => s.status === 'PENDING');

      if (remaining) {
        await this.prisma.approvalStep.update({
          where: { id: remaining.id },
          data: { status: 'ACTIVE' },
        });
        await this.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { currentStep: remaining.stepKey },
        });
        // إشعار: المراجعون التاليون
        await this.notifyStepReviewers(
          instance.id,
          instance.tenantId,
          {
            key: remaining.stepKey,
            nameAr: remaining.stepNameAr,
            requiredRole: remaining.requiredRole,
            scope: remaining.scopeType as any,
          },
          wfName,
        );
        return { status: 'IN_PROGRESS', nextStep: remaining.stepKey };
      }

      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: 'APPROVED', completedAt: new Date(), currentStep: null },
      });
      await this.syncEntityStatus(instance.entityType, instance.entityId, 'APPROVED');
      // إشعار صاحب الطلب
      await this.notifications.create({
        tenantId: instance.tenantId,
        userId: instance.initiatedById,
        type: 'workflow.approved',
        titleAr: `تم اعتماد طلبك: ${wfName}`,
        link: '/dashboard/inbox',
        data: { instanceId: instance.id },
      });
      return { status: 'APPROVED' };
    }

    return { status: 'IN_PROGRESS' };
  }

  async getInstance(id: string) {
    return this.prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' }, include: { actedBy: true } },
        definition: true,
        initiatedBy: true,
      },
    });
  }

  async listPendingForUser(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const roleCodes = userRoles.map((ur) => ur.role.code);

    return this.prisma.workflowInstance.findMany({
      where: {
        status: 'IN_PROGRESS',
        steps: {
          some: { status: 'ACTIVE', requiredRole: { in: roleCodes } },
        },
      },
      include: {
        steps: { where: { status: 'ACTIVE' }, take: 1 },
        definition: true,
        initiatedBy: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * يحدّث حالة الكيان المرتبط (Leave / PurchaseRequest / Meeting / إلخ)
   * بناءً على نتيجة سير العمل النهائية.
   */
  private async syncEntityStatus(entityType: string, entityId: string, outcome: 'APPROVED' | 'REJECTED') {
    try {
      switch (entityType) {
        case 'leave':
          await this.prisma.leave.update({
            where: { id: entityId },
            data: { status: outcome as any },
          });
          break;
        case 'purchase_request': {
          const newStatus = outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED';
          await this.prisma.purchaseRequest.update({
            where: { id: entityId },
            data: { status: newStatus as any },
          });
          break;
        }
        case 'evaluation':
          // evaluation: mark as completed
          break;
        case 'meeting':
          // minutes approved → no field change (already COMPLETED)
          break;
        case 'graduation':
          // certificate issued workflow
          break;
        case 'training_plan': {
          const newStatus = outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED';
          await this.prisma.trainingPlan.update({
            where: { id: entityId },
            data: {
              status: newStatus as any,
              approvedAt: outcome === 'APPROVED' ? new Date() : null,
            },
          });
          break;
        }
        case 'curriculum_review': {
          if (outcome === 'APPROVED') {
            await this.prisma.curriculumReview.update({
              where: { id: entityId },
              data: { status: 'APPROVED' },
            });
          }
          break;
        }
      }
    } catch {
      // غير حاسم — السجل يبقى كما هو لو كان الكيان محذوفاً
    }
  }

  private matchCondition(step: WorkflowStepDef, data: Record<string, unknown>): boolean {
    if (!step.condition) return true;
    const v = data[step.condition.path];
    const c = step.condition.value;
    switch (step.condition.op) {
      case 'gt': return Number(v) > Number(c);
      case 'gte': return Number(v) >= Number(c);
      case 'lt': return Number(v) < Number(c);
      case 'lte': return Number(v) <= Number(c);
      case 'eq': return v === c;
      case 'neq': return v !== c;
    }
  }

  private mapDecision(d: string): string {
    const map: Record<string, string> = {
      APPROVE: 'APPROVE',
      REJECT: 'REJECT',
      REQUEST_CHANGES: 'REQUEST_CHANGES',
      DELEGATE: 'DELEGATE',
    };
    return map[d] ?? 'APPROVE';
  }
}
