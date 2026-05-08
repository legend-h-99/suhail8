import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: AuditEvent) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: event.tenantId ?? null,
        userId: event.userId ?? null,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        before: event.before as any,
        after: event.after as any,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
