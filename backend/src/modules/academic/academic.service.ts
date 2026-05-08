import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class AcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  listPrograms() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.program.findMany({ where: { tenantId }, orderBy: { code: 'asc' } });
  }

  listCourses(query: { programId?: string; departmentId?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.course.findMany({
      where: { tenantId, programId: query.programId, departmentId: query.departmentId },
      include: { program: { select: { nameAr: true, code: true } } },
      orderBy: { code: 'asc' },
    });
  }

  listSections(courseId: string) {
    return this.prisma.section.findMany({
      where: { courseId },
      include: {
        trainer: { select: { trainerNumber: true, employee: { select: { fullNameAr: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  enroll(traineeId: string, sectionId: string) {
    return this.prisma.enrollment.create({ data: { traineeId, sectionId } });
  }

  recordGrade(enrollmentId: string, grade: number) {
    const status = grade >= 60 ? 'PASSED' : 'FAILED';
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { grade, status: status as any },
    });
  }
}
