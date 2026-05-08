import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class CurriculumReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  list(query: { departmentId?: string; reviewYear?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.curriculumReview.findMany({
      where: { tenantId, departmentId: query.departmentId, reviewYear: query.reviewYear },
      include: {
        department: { select: { nameAr: true } },
        feedbackEntries: { include: { trainer: { select: { trainerNumber: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const r = await this.prisma.curriculumReview.findFirst({
      where: { id, tenantId },
      include: { department: true, feedbackEntries: true },
    });
    if (!r) throw new NotFoundException({ messageAr: 'المراجعة غير موجودة' });
    return r;
  }

  create(data: {
    departmentId: string;
    programId?: string;
    reviewYear: string;
    marketAlignmentScore?: number;
    recommendations: string;
  }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.curriculumReview.create({
      data: {
        tenantId,
        departmentId: data.departmentId,
        programId: data.programId,
        reviewYear: data.reviewYear,
        marketAlignmentScore: data.marketAlignmentScore,
        recommendations: data.recommendations,
      },
    });
  }

  addFeedback(reviewId: string, data: {
    trainerId?: string;
    courseCode?: string;
    feedback: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) {
    return this.prisma.curriculumFeedback.create({
      data: { reviewId, ...data, severity: data.severity ?? 'MEDIUM' },
    });
  }

  approve(id: string, approvedById: string) {
    return this.prisma.curriculumReview.update({
      where: { id },
      data: { status: 'APPROVED', approvedById },
    });
  }
}
