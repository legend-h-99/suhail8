import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class AccreditationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list(query: { cycle?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    const items = await this.prisma.accreditation.findMany({
      where: { tenantId, cycle: query.cycle, status: query.status as any },
      include: { _count: { select: { evidence: true } } },
      orderBy: [{ standardCode: 'asc' }],
    });

    // إحصاء سريع
    const total = items.length;
    const byStatus: Record<string, number> = {};
    items.forEach((i) => { byStatus[i.status] = (byStatus[i.status] ?? 0) + 1; });
    const readiness = total > 0
      ? Math.round(((byStatus.VERIFIED ?? 0) + (byStatus.EVIDENCE_READY ?? 0) * 0.7 + (byStatus.IN_PROGRESS ?? 0) * 0.3) / total * 100)
      : 0;

    return { items, summary: { total, byStatus, readiness } };
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const a = await this.prisma.accreditation.findFirst({
      where: { id, tenantId },
      include: { evidence: { orderBy: { createdAt: 'desc' } } },
    });
    if (!a) throw new NotFoundException();
    return a;
  }

  upsert(data: {
    standardCode: string;
    nameAr: string;
    description?: string;
    cycle: string;
    responsibleEmpId?: string;
    dueDate?: string;
    weight?: number;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.accreditation.upsert({
      where: { tenantId_standardCode_cycle: { tenantId, standardCode: data.standardCode, cycle: data.cycle } },
      update: {
        nameAr: data.nameAr,
        description: data.description,
        responsibleEmpId: data.responsibleEmpId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        weight: data.weight ?? 1,
      },
      create: {
        tenantId,
        standardCode: data.standardCode,
        nameAr: data.nameAr,
        description: data.description,
        cycle: data.cycle,
        responsibleEmpId: data.responsibleEmpId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        weight: data.weight ?? 1,
      },
    });
  }

  updateStatus(id: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'EVIDENCE_READY' | 'VERIFIED' | 'WEAK') {
    return this.prisma.accreditation.update({
      where: { id },
      data: { status: status as any },
    });
  }

  uploadEvidence(accreditationId: string, data: { fileName: string; url?: string; description?: string; uploadedById: string }) {
    return this.prisma.accreditationEvidence.create({
      data: {
        accreditationId,
        fileName: data.fileName,
        url: data.url,
        description: data.description,
        uploadedById: data.uploadedById,
      },
    });
  }

  deleteEvidence(id: string) {
    return this.prisma.accreditationEvidence.delete({ where: { id } });
  }
}
