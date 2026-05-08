import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class DgReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dGReport.findMany({
      where: { tenantId },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    });
  }

  upsert(data: {
    period: string;
    type: 'QUARTERLY' | 'ANNUAL';
    title: string;
    body: string;
    attachments?: any[];
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dGReport.upsert({
      where: { tenantId_period_type: { tenantId, period: data.period, type: data.type as any } },
      update: { title: data.title, body: data.body, attachments: data.attachments as any },
      create: {
        tenantId,
        period: data.period,
        type: data.type as any,
        title: data.title,
        body: data.body,
        attachments: data.attachments as any,
      },
    });
  }

  async submit(id: string, userId: string) {
    const tracking = `CCI-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    return this.prisma.dGReport.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedById: userId,
        submittedAt: new Date(),
        trackingNumber: tracking,
      },
    });
  }

  recordFeedback(id: string, feedback: string) {
    return this.prisma.dGReport.update({
      where: { id },
      data: {
        gmFeedback: feedback,
        gmFeedbackAt: new Date(),
        status: 'ACKNOWLEDGED',
      },
    });
  }
}
