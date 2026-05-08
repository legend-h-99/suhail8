import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { WorkflowService } from '../../workflow/workflow.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly workflow: WorkflowService,
  ) {}

  async list(query: { employeeId?: string; status?: string; mineOnly?: boolean; userId?: string }) {
    let employeeId = query.employeeId;
    if (query.mineOnly && query.userId) {
      const emp = await this.prisma.employee.findFirst({ where: { userId: query.userId } });
      employeeId = emp?.id ?? '__none__';
    }
    return this.prisma.leave.findMany({
      where: {
        employeeId,
        status: query.status as any,
      },
      include: {
        employee: { select: { fullNameAr: true, employeeNumber: true } },
        workflowInstance: {
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
      include: {
        employee: true,
        workflowInstance: { include: { steps: { include: { actedBy: true } } } },
      },
    });
    if (!leave) throw new NotFoundException({ messageAr: 'الإجازة غير موجودة' });
    return leave;
  }

  async submit(data: {
    employeeId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
    submittedByUserId: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) throw new BadRequestException({ messageAr: 'تاريخ الانتهاء قبل البداية' });
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    const leave = await this.prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
        status: 'PENDING',
      },
    });

    const flow = await this.workflow.start({
      tenantId,
      initiatedById: data.submittedByUserId,
      definitionCode: 'LEAVE_REQUEST',
      entityType: 'leave',
      entityId: leave.id,
      data: { type: data.type, days, employeeId: data.employeeId },
    });

    await this.prisma.leave.update({
      where: { id: leave.id },
      data: { workflowInstanceId: flow.id },
    });

    return this.get(leave.id);
  }

  /**
   * يستجيب لتغيرات حالة الـ workflow (مكتمل / مرفوض)
   * يُدعى من workflow.service بعد كل قرار، أو من webhook داخلي.
   */
  async syncFromWorkflow(leaveId: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
      include: { workflowInstance: true },
    });
    if (!leave?.workflowInstance) return leave;

    const newStatus =
      leave.workflowInstance.status === 'APPROVED'
        ? 'APPROVED'
        : leave.workflowInstance.status === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING';

    return this.prisma.leave.update({
      where: { id: leaveId },
      data: { status: newStatus as any },
    });
  }
}
