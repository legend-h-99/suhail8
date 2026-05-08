import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class CouncilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.council.findMany({
      where: { tenantId },
      include: {
        members: true,
        _count: { select: { meetings: true } },
      },
    });
  }

  async get(id: string) {
    const c = await this.prisma.council.findUnique({
      where: { id },
      include: {
        members: true,
        meetings: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      },
    });
    if (!c) throw new NotFoundException({ messageAr: 'المجلس غير موجود' });
    return c;
  }

  async create(data: {
    nameAr: string;
    type: 'MAIN_COUNCIL' | 'EXEC_COMMITTEE' | 'WORK_COMMITTEE';
    termFrom: string;
    termUntil?: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.council.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        type: data.type as any,
        termFrom: new Date(data.termFrom),
        termUntil: data.termUntil ? new Date(data.termUntil) : null,
      },
    });
  }

  async addMember(councilId: string, data: {
    employeeId?: string;
    externalName?: string;
    role: string;
    isInternal?: boolean;
    validFrom: string;
    validUntil?: string;
  }) {
    return this.prisma.councilMember.create({
      data: {
        councilId,
        employeeId: data.employeeId,
        externalName: data.externalName,
        role: data.role,
        isInternal: data.isInternal ?? true,
        validFrom: new Date(data.validFrom),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });
  }
}
