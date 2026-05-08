import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  listCourses() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.communityCourse.findMany({
      where: { tenantId },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  createCourse(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.communityCourse.create({
      data: {
        ...data,
        tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  register(courseId: string, data: any) {
    return this.prisma.communityRegistration.create({
      data: { courseId, ...data },
    });
  }

  markPaid(registrationId: string, amount: number) {
    return this.prisma.communityRegistration.update({
      where: { id: registrationId },
      data: { paid: true, paidAmount: amount },
    });
  }

  issueCertificate(registrationId: string) {
    const number = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return this.prisma.communityRegistration.update({
      where: { id: registrationId },
      data: { certificateIssued: true, certificateNumber: number },
    });
  }
}
