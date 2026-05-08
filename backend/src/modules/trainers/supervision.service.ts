import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class SupervisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { trainerId?: string; departmentId?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.supervisionVisit.findMany({
      where: {
        tenantId,
        trainerId: query.trainerId,
        departmentId: query.departmentId,
        status: query.status as any,
      },
      include: {
        trainer: {
          select: {
            trainerNumber: true,
            employee: { select: { fullNameAr: true } },
          },
        },
        department: { select: { nameAr: true } },
      },
      orderBy: { visitDate: 'desc' },
      take: 100,
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const v = await this.prisma.supervisionVisit.findFirst({
      where: { id, tenantId },
      include: { trainer: { include: { employee: true } }, department: true },
    });
    if (!v) throw new NotFoundException({ messageAr: 'الزيارة غير موجودة' });
    return v;
  }

  async log(data: {
    trainerId: string;
    visitorEmpId: string;
    visitDate: string;
    sectionId?: string;
    rating: number;
    observations: string;
    recommendations?: string;
    followUpAt?: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: data.trainerId, tenantId },
      include: { employee: true },
    });
    if (!trainer) throw new NotFoundException({ messageAr: 'المدرب غير موجود' });

    return this.prisma.supervisionVisit.create({
      data: {
        tenantId,
        trainerId: data.trainerId,
        departmentId: trainer.employee?.departmentId ?? '',
        visitorEmpId: data.visitorEmpId,
        visitDate: new Date(data.visitDate),
        sectionId: data.sectionId,
        rating: data.rating,
        observations: data.observations,
        recommendations: data.recommendations,
        followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
        status: data.followUpAt ? 'FOLLOW_UP_NEEDED' : 'LOGGED',
      },
    });
  }

  close(id: string) {
    return this.prisma.supervisionVisit.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }
}
