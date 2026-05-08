import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { type?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.project.findMany({
      where: { tenantId, type: query.type as any, status: query.status as any },
      include: {
        _count: { select: { tasks: true, members: true, milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        members: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: { take: 50, orderBy: { dueDate: 'asc' } },
        risks: true,
      },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async create(data: any) {
    const tenantId = this.tenancy.getTenantId();
    const count = await this.prisma.project.count({ where: { tenantId } });
    const code = data.code ?? `PRJ-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.project.create({
      data: {
        tenantId,
        code,
        nameAr: data.nameAr,
        description: data.description,
        type: (data.type ?? 'OPERATIONAL') as any,
        ownerId: data.ownerId,
        startDate: new Date(data.startDate ?? new Date()),
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
        budget: data.budget,
        departmentId: data.departmentId,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
        actualEndDate: data.status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  addMember(projectId: string, userId: string, role: string = 'MEMBER') {
    return this.prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  addMilestone(projectId: string, data: { nameAr: string; dueDate: string }) {
    return this.prisma.milestone.create({
      data: {
        projectId,
        nameAr: data.nameAr,
        dueDate: new Date(data.dueDate),
      },
    });
  }

  completeMilestone(id: string) {
    return this.prisma.milestone.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }
}
