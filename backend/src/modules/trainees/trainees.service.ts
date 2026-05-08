import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class TraineesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { search?: string; status?: string; programId?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainee.findMany({
      where: {
        tenantId,
        status: query.status as any,
        programId: query.programId,
        OR: query.search
          ? [
              { fullNameAr: { contains: query.search, mode: 'insensitive' } },
              { studentNumber: { contains: query.search } },
              { nationalId: { contains: query.search } },
            ]
          : undefined,
      },
      include: {
        program: { select: { nameAr: true, code: true } },
        warnings: { take: 3, orderBy: { issuedAt: 'desc' } },
      },
      orderBy: { fullNameAr: 'asc' },
      take: 200,
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const t = await this.prisma.trainee.findFirst({
      where: { id, tenantId },
      include: {
        program: true,
        warnings: { orderBy: { issuedAt: 'desc' } },
        records: { orderBy: { term: 'desc' } },
        coopPlacements: true,
        graduation: true,
        enrollments: { include: { section: { include: { course: true } } } },
      },
    });
    if (!t) throw new NotFoundException({ messageAr: 'المتدرب غير موجود' });
    return t;
  }

  create(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainee.create({
      data: { ...data, tenantId, enrollmentDate: new Date(data.enrollmentDate) },
    });
  }

  issueWarning(traineeId: string, level: number, reason: string) {
    return this.prisma.academicWarning.create({
      data: { traineeId, level, reason },
    });
  }
}
