import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class NominationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(status?: string) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.nomination.findMany({
      where: { tenantId, status: status as any },
      orderBy: { startDate: 'desc' },
    });
  }

  recommend(data: {
    employeeId: string;
    courseTitle: string;
    providerName?: string;
    startDate: string;
    endDate: string;
    cost?: number;
    justification: string;
    recommendedById: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.nomination.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        courseTitle: data.courseTitle,
        providerName: data.providerName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        cost: data.cost,
        justification: data.justification,
        recommendedById: data.recommendedById,
      },
    });
  }

  updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'ATTENDED' | 'NO_SHOW', notes?: string) {
    return this.prisma.nomination.update({
      where: { id },
      data: {
        status: status as any,
        outcomeNotes: notes,
        attendanceConfirmed: status === 'ATTENDED',
      },
    });
  }
}
