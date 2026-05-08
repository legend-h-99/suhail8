import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class ResearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.researchProject.findMany({
      where: { tenantId, status: query.status as any },
      orderBy: { createdAt: 'desc' },
    });
  }

  propose(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.researchProject.create({ data: { ...data, tenantId } });
  }

  approve(id: string, fundingAmount?: number, fundingSource?: string) {
    return this.prisma.researchProject.update({
      where: { id },
      data: { status: 'APPROVED', fundingAmount, fundingSource },
    });
  }

  complete(id: string, outcomeUrl?: string) {
    return this.prisma.researchProject.update({
      where: { id },
      data: { status: 'COMPLETED', outcomeUrl, endDate: new Date() },
    });
  }
}
