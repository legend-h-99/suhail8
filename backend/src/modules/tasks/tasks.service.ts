import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly notifications: NotificationsService,
  ) {}

  list(query: { assigneeId?: string; status?: string; projectId?: string; departmentId?: string; mineOnly?: boolean; userId?: string }) {
    const tenantId = this.tenancy.getTenantId();
    const assignee = query.mineOnly ? query.userId : query.assigneeId;
    return this.prisma.task.findMany({
      where: {
        tenantId,
        assigneeId: assignee,
        status: query.status as any,
        projectId: query.projectId,
        departmentId: query.departmentId,
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 200,
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        comments: { orderBy: { createdAt: 'desc' } },
        subtasks: true,
        project: { select: { code: true, nameAr: true } },
      },
    });
    if (!task) throw new NotFoundException();
    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    departmentId?: string;
    projectId?: string;
    parentTaskId?: string;
    startDate?: string;
    dueDate?: string;
    tags?: string[];
    kpiCode?: string;
    createdById: string;
    tenantId?: string;
  }) {
    const tenantId = data.tenantId ?? this.tenancy.getTenantId();
    const task = await this.prisma.task.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        priority: (data.priority ?? 'NORMAL') as any,
        assigneeId: data.assigneeId,
        departmentId: data.departmentId,
        projectId: data.projectId,
        parentTaskId: data.parentTaskId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        tags: data.tags ?? [],
        kpiCode: data.kpiCode,
        createdById: data.createdById,
      },
    });

    if (data.assigneeId && data.assigneeId !== data.createdById) {
      await this.notifications.create({
        tenantId,
        userId: data.assigneeId,
        type: 'task.assigned',
        titleAr: 'مهمة جديدة أُسندت لك',
        bodyAr: data.title,
        link: `/dashboard/tasks/${task.id}`,
      });
    }

    return task;
  }

  async update(id: string, data: any, userId: string) {
    const tenantId = this.tenancy.getTenantId();
    const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException();
    if (task.assigneeId !== userId && task.createdById !== userId) {
      // فقط manager-level بيقدر يعدّل مهام غيره (من Permission)
    }

    const update: any = { ...data };
    if (data.startDate) update.startDate = new Date(data.startDate);
    if (data.dueDate) update.dueDate = new Date(data.dueDate);
    if (data.status === 'DONE' && !task.completedAt) {
      update.completedAt = new Date();
    }

    return this.prisma.task.update({ where: { id }, data: update });
  }

  delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  // Comments
  addComment(taskId: string, authorId: string, body: string) {
    return this.prisma.taskComment.create({
      data: { taskId, authorId, body },
    });
  }

  // ─────────────────────────────────────────
  // Stats للداشبورد
  // ─────────────────────────────────────────
  async stats(userId: string) {
    const tenantId = this.tenancy.getTenantId();
    const [mine, overdue, byStatus] = await Promise.all([
      this.prisma.task.count({ where: { tenantId, assigneeId: userId } }),
      this.prisma.task.count({
        where: { tenantId, assigneeId: userId, dueDate: { lt: new Date() }, status: { notIn: ['DONE', 'ARCHIVED'] as any } },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { tenantId, assigneeId: userId },
        _count: { _all: true },
      }),
    ]);

    return { mine, overdue, byStatus: byStatus.map((g: any) => ({ status: g.status, count: g._count._all })) };
  }
}
