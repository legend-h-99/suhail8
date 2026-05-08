import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

const DEFAULT_COLUMNS = [
  { name: 'جديد', color: '#94a3b8' },
  { name: 'قيد التنفيذ', color: '#3b82f6' },
  { name: 'بانتظار الاعتماد', color: '#f59e0b' },
  { name: 'مكتمل', color: '#10b981' },
];

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.board.findMany({
      where: { tenantId },
      include: { _count: { select: { columns: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const board = await this.prisma.board.findFirst({
      where: { id, tenantId },
      include: {
        columns: {
          include: {
            cards: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!board) throw new NotFoundException();
    return board;
  }

  async create(data: { nameAr: string; type?: string; scope?: string; ownerId: string }) {
    const tenantId = this.tenancy.getTenantId();
    const board = await this.prisma.board.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        type: (data.type ?? 'TASK') as any,
        scope: data.scope ?? 'global',
        ownerId: data.ownerId,
      },
    });
    // أنشئ 4 columns افتراضية
    await this.prisma.boardColumn.createMany({
      data: DEFAULT_COLUMNS.map((c, i) => ({
        boardId: board.id,
        nameAr: c.name,
        color: c.color,
        order: i,
      })),
    });
    return this.get(board.id);
  }

  addCard(columnId: string, data: { title: string; description?: string; assigneeId?: string; dueDate?: string; taskId?: string }) {
    return this.prisma.boardCard.create({
      data: {
        columnId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        taskId: data.taskId,
      },
    });
  }

  moveCard(cardId: string, newColumnId: string, newOrder: number) {
    return this.prisma.boardCard.update({
      where: { id: cardId },
      data: { columnId: newColumnId, order: newOrder },
    });
  }

  deleteCard(cardId: string) {
    return this.prisma.boardCard.delete({ where: { id: cardId } });
  }
}
