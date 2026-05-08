import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class QualityTeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(status?: string) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityTeam.findMany({
      where: { tenantId, status: status as any },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const team = await this.prisma.qualityTeam.findFirst({
      where: { id, tenantId },
      include: { tasks: { orderBy: { createdAt: 'desc' } } },
    });
    if (!team) throw new NotFoundException();
    return team;
  }

  create(data: {
    nameAr: string;
    charter: { purposeAr: string; scopeAr?: string; deliverables: string[]; deadline?: string; sponsorEmpId?: string };
    leadEmpId?: string;
    members?: any[];
    relatedKpiCode?: string;
    relatedPlanId?: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityTeam.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        charter: data.charter as any,
        leadEmpId: data.leadEmpId,
        members: (data.members ?? []) as any,
        relatedKpiCode: data.relatedKpiCode,
        relatedPlanId: data.relatedPlanId,
      },
    });
  }

  activate(id: string) {
    return this.prisma.qualityTeam.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  disband(id: string) {
    return this.prisma.qualityTeam.update({
      where: { id },
      data: { status: 'DISBANDED' },
    });
  }

  // Tasks
  addTask(teamId: string, data: { title: string; assigneeEmpId?: string; dueAt?: string }) {
    return this.prisma.qualityTeamTask.create({
      data: {
        teamId,
        title: data.title,
        assigneeEmpId: data.assigneeEmpId,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
  }

  updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE', notes?: string) {
    return this.prisma.qualityTeamTask.update({
      where: { id: taskId },
      data: { status: status as any, notes },
    });
  }

  deleteTask(taskId: string) {
    return this.prisma.qualityTeamTask.delete({ where: { id: taskId } });
  }
}
