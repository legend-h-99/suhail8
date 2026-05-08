import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class ItService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  // Tickets
  async openTicket(data: { creatorId: string; category: any; priority?: any; subject: string; description: string }) {
    const tenantId = this.tenancy.getTenantId();
    const count = await this.prisma.ticket.count({ where: { tenantId } });
    const number = `TK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    return this.prisma.ticket.create({
      data: {
        tenantId,
        number,
        creatorId: data.creatorId,
        category: data.category,
        priority: data.priority ?? 'NORMAL',
        subject: data.subject,
        description: data.description,
      },
    });
  }

  listTickets(query: { status?: string; assigneeId?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        status: query.status as any,
        assigneeId: query.assigneeId,
      },
      include: { creator: { select: { fullNameAr: true } }, assignee: { select: { fullNameAr: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  assign(ticketId: string, assigneeId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId, status: 'IN_PROGRESS' },
    });
  }

  resolve(ticketId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', closedAt: new Date() },
    });
  }

  // Assets
  listAssets(query: { status?: string; category?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.asset.findMany({
      where: { tenantId, status: query.status as any, category: query.category },
      orderBy: { tag: 'asc' },
    });
  }

  registerAsset(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.asset.create({ data: { ...data, tenantId } });
  }
}
