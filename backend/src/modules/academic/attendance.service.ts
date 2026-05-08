import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SectionAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * يجلب قائمة المتدربين في الشعبة + سجل حضورهم لتاريخ محدد.
   */
  async rosterForDate(sectionId: string, date: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId, status: 'ENROLLED' },
      include: {
        trainee: {
          select: { id: true, fullNameAr: true, studentNumber: true },
        },
      },
      orderBy: { trainee: { fullNameAr: 'asc' } },
    });

    const dateOnly = new Date(date);
    const records = await this.prisma.traineeAttendance.findMany({
      where: { enrollmentId: { in: enrollments.map((e) => e.id) }, date: dateOnly },
    });
    const byEnrollment = new Map(records.map((r) => [r.enrollmentId, r]));

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      trainee: e.trainee,
      attendance: byEnrollment.get(e.id) ?? null,
    }));
  }

  /**
   * يسجّل حضور المتدربين دفعة واحدة.
   * يتحقق أن المستخدم هو مدرب الشعبة (RBAC مستوى السجل).
   */
  async markBulk(params: {
    sectionId: string;
    date: string;
    trainerUserId: string;
    entries: { enrollmentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }[];
  }) {
    const section = await this.prisma.section.findUnique({
      where: { id: params.sectionId },
      include: { trainer: { select: { userId: true } } },
    });
    if (!section) throw new NotFoundException({ messageAr: 'الشعبة غير موجودة' });
    if (section.trainer && section.trainer.userId !== params.trainerUserId) {
      throw new ForbiddenException({ messageAr: 'يمكن لمدرب الشعبة فقط رصد الحضور' });
    }

    const dateOnly = new Date(params.date);
    const ops = params.entries.map((e) =>
      this.prisma.traineeAttendance.upsert({
        where: { enrollmentId_date: { enrollmentId: e.enrollmentId, date: dateOnly } },
        create: {
          enrollmentId: e.enrollmentId,
          date: dateOnly,
          status: e.status as any,
          notes: e.notes,
          markedById: params.trainerUserId,
        },
        update: { status: e.status as any, notes: e.notes, markedById: params.trainerUserId },
      }),
    );
    await this.prisma.$transaction(ops);
    return { count: params.entries.length };
  }

  /**
   * تقرير حضور لمتدرب: نسبة، عدد الغيابات، تأخر.
   */
  async traineeReport(traineeId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { traineeId },
      include: {
        section: { include: { course: true } },
        attendanceRecords: true,
      },
    });

    return enrollments.map((e) => {
      const total = e.attendanceRecords.length;
      const present = e.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      const absent = e.attendanceRecords.filter((r) => r.status === 'ABSENT').length;
      const late = e.attendanceRecords.filter((r) => r.status === 'LATE').length;
      return {
        course: e.section.course.nameAr,
        term: e.section.term,
        total,
        present,
        absent,
        late,
        rate: total > 0 ? +((present + late * 0.5) / total * 100).toFixed(2) : null,
      };
    });
  }
}
