import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityCampaign.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  create(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.qualityCampaign.create({
      data: {
        tenantId,
        title: data.title,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        targetAudience: data.targetAudience,
        objectiveAr: data.objectiveAr,
        ownerEmpId: data.ownerEmpId,
        materialsUrl: data.materialsUrl,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.qualityCampaign.update({
      where: { id },
      data: {
        attendeesCount: data.attendeesCount,
        impactAssessment: data.impactAssessment,
      },
    });
  }
}
