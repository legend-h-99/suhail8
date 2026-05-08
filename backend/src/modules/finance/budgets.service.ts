import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list(query: { fiscalYear?: string; departmentId?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.budget.findMany({
      where: {
        tenantId,
        fiscalYear: query.fiscalYear,
        departmentId: query.departmentId,
      },
      include: { department: { select: { nameAr: true, code: true } } },
      orderBy: [{ fiscalYear: 'desc' }, { category: 'asc' }],
    });
  }

  async upsert(data: {
    departmentId?: string;
    fiscalYear: string;
    category: string;
    allocated: number;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.budget.upsert({
      where: {
        tenantId_departmentId_fiscalYear_category: {
          tenantId,
          departmentId: data.departmentId ?? null,
          fiscalYear: data.fiscalYear,
          category: data.category,
        } as any,
      },
      update: { allocated: data.allocated },
      create: {
        tenantId,
        departmentId: data.departmentId,
        fiscalYear: data.fiscalYear,
        category: data.category,
        allocated: data.allocated,
      },
    });
  }
}
