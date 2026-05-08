import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  listCourses() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.lmsCourse.findMany({
      where: { tenantId },
      include: { exams: { select: { id: true, title: true, durationMins: true } } },
    });
  }

  createCourse(data: { courseId?: string; title: string; contentUrl?: string; scormUrl?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.lmsCourse.create({ data: { ...data, tenantId } });
  }

  createExam(data: { lmsCourseId?: string; title: string; durationMins: number; passingScore?: number }) {
    return this.prisma.examBank.create({ data });
  }

  addQuestion(examBankId: string, data: { type: any; textAr: string; options?: any; correctAnswer?: any; points?: number }) {
    return this.prisma.question.create({ data: { examBankId, ...data } });
  }

  startSubmission(examBankId: string, traineeId: string) {
    return this.prisma.examSubmission.create({
      data: { examBankId, traineeId, startedAt: new Date() },
    });
  }

  submit(submissionId: string, answers: any, score?: number) {
    return this.prisma.examSubmission.update({
      where: { id: submissionId },
      data: { answers, score, submittedAt: new Date() },
    });
  }
}
