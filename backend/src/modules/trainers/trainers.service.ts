import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class TrainersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.trainer.findMany({
      where: { tenantId },
      include: {
        employee: { select: { fullNameAr: true, employeeNumber: true, departmentId: true } },
        loads: { take: 4, orderBy: { term: 'desc' } },
      },
      orderBy: { trainerNumber: 'asc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const t = await this.prisma.trainer.findFirst({
      where: { id, tenantId },
      include: {
        employee: true,
        loads: { orderBy: { term: 'desc' } },
        sections: { include: { course: true } },
        developmentPlans: true,
      },
    });
    if (!t) throw new NotFoundException({ messageAr: 'المدرب غير موجود' });
    return t;
  }

  setLoad(trainerId: string, term: string, hours: number, notes?: string) {
    return this.prisma.teachingLoad.upsert({
      where: { trainerId_term: { trainerId, term } },
      update: { hours, notes },
      create: { trainerId, term, hours, notes },
    });
  }
}
