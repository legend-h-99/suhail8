import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNotification {
  tenantId: string;
  userId: string;
  type: string;          // e.g. 'workflow.action_required', 'leave.approved'
  titleAr: string;
  bodyAr?: string;
  link?: string;         // e.g. '/dashboard/inbox' أو '/dashboard/me/leaves'
  data?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotification) {
    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        channel: 'IN_APP',
        type: input.type,
        titleAr: input.titleAr,
        bodyAr: input.bodyAr,
        link: input.link,
        data: input.data,
      },
    });
  }

  async createMany(inputs: CreateNotification[]) {
    if (inputs.length === 0) return { count: 0 };
    return this.prisma.notification.createMany({
      data: inputs.map((i) => ({
        tenantId: i.tenantId,
        userId: i.userId,
        channel: 'IN_APP' as const,
        type: i.type,
        titleAr: i.titleAr,
        bodyAr: i.bodyAr,
        link: i.link,
        data: i.data,
      })),
    });
  }

  list(userId: string, query: { unreadOnly?: boolean }) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        readAt: query.unreadOnly ? null : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  markRead(userId: string, ids: string[]) {
    return this.prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * يجد المستخدمين أصحاب دور معين (مع scope اختياري) لإرسال إشعار جماعي.
   * يُستخدم من Workflow عند ترقية لخطوة جديدة.
   */
  async findUsersWithRole(tenantId: string, roleCode: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { tenantId_code: { tenantId, code: roleCode } },
    });
    if (!role) return [];

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        roleId: role.id,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      select: { userId: true },
    });
    return userRoles.map((ur) => ur.userId);
  }
}
