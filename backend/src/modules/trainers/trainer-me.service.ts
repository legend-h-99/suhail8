import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainerMeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────
  // 1. شاشة "اليوم"
  // ─────────────────────────────────────────────────────────
  async today(trainerId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      include: {
        employee: { select: { fullNameAr: true } },
        loads: { where: { term: { contains: '1446' } }, take: 1 },
      },
    });
    if (!trainer) throw new NotFoundException({ messageAr: 'سجل المدرب غير موجود' });

    const today = new Date();
    const dayOfWeek = today.getDay();  // 0=Sun
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayKey = dayNames[dayOfWeek];

    // الحصص اليوم
    const sections = await this.prisma.section.findMany({
      where: { trainerId },
      include: {
        course: { select: { code: true, nameAr: true } },
        _count: { select: { enrollments: true } },
      },
    });

    const todaySchedule: any[] = [];
    for (const s of sections) {
      const sched = (s.schedule as any) ?? [];
      for (const slot of sched) {
        if (slot.day === todayKey) {
          todaySchedule.push({
            sectionId: s.id,
            courseCode: s.course.code,
            courseName: s.course.nameAr,
            from: slot.from,
            to: slot.to,
            room: slot.room,
            isLab: s.isLab || slot.type === 'lab' || slot.type === 'workshop',
            studentsCount: s._count.enrollments,
          });
        }
      }
    }
    todaySchedule.sort((a, b) => (a.from < b.from ? -1 : 1));

    // التنبيهات الذكية
    const alerts: { type: string; severity: 'info' | 'warning' | 'critical'; messageAr: string; link?: string }[] = [];

    // أ. تقارير غير مسلّمة
    const draftReports = await this.prisma.trainerReport.count({
      where: { trainerId, status: 'DRAFT' },
    });
    if (draftReports > 0) {
      alerts.push({
        type: 'pending_reports',
        severity: 'warning',
        messageAr: `لديك ${draftReports} تقرير لم يُسلّم بعد`,
        link: '/dashboard/me/reports',
      });
    }

    // ب. متدربون متغيبون متكرر
    const enrollments = await this.prisma.enrollment.findMany({
      where: { section: { trainerId } },
      include: {
        trainee: { select: { id: true, fullNameAr: true } },
        attendanceRecords: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 86400_000) },
            status: 'ABSENT',
          },
        },
      },
    });
    const chronicAbsentees = enrollments
      .filter((e) => e.attendanceRecords.length >= 3)
      .map((e) => ({ traineeId: e.trainee.id, name: e.trainee.fullNameAr, absences: e.attendanceRecords.length }));
    if (chronicAbsentees.length > 0) {
      alerts.push({
        type: 'chronic_absent',
        severity: 'warning',
        messageAr: `${chronicAbsentees.length} متدرب غاب ٣ مرات أو أكثر هذا الشهر`,
        link: '/dashboard/me/sections',
      });
    }

    // ج. زيارة إشرافية جديدة لم يقرأها
    const recentVisits = await this.prisma.supervisionVisit.count({
      where: {
        trainerId,
        visitDate: { gte: new Date(Date.now() - 7 * 86400_000) },
      },
    });
    if (recentVisits > 0) {
      alerts.push({
        type: 'recent_visit',
        severity: 'info',
        messageAr: `${recentVisits} زيارة إشرافية جديدة هذا الأسبوع`,
        link: '/dashboard/me/visits',
      });
    }

    // د. ساعات تطوير ناقصة
    const dev = await this.prisma.developmentPlan.findFirst({
      where: { trainerId, year: String(new Date().getFullYear()) },
    });
    if (dev && Number(dev.progress) < 80) {
      alerts.push({
        type: 'development_gap',
        severity: 'info',
        messageAr: `أكملت ${dev.progress}% من خطتك التطويرية لهذا العام`,
        link: '/dashboard/me/development',
      });
    }

    // هـ. النصاب
    const load = trainer.loads[0];

    // ──── Stats للأسبوع الجاري
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const myAttendance = await this.prisma.attendance.findMany({
      where: {
        employee: { userId: trainer.userId ?? undefined },
        date: { gte: weekStart },
      },
    });
    const presentDays = myAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

    return {
      trainer: {
        id: trainer.id,
        name: trainer.employee?.fullNameAr,
        trainerNumber: trainer.trainerNumber,
        specialization: trainer.specialization,
      },
      todaySchedule,
      alerts,
      thisWeek: {
        loadHours: load?.hours ?? trainer.loadHours,
        myAttendance: presentDays,
        weekDaySoFar: dayOfWeek + 1,
      },
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. الجدول الأسبوعي
  // ─────────────────────────────────────────────────────────
  async schedule(trainerId: string) {
    const sections = await this.prisma.section.findMany({
      where: { trainerId },
      include: {
        course: { select: { code: true, nameAr: true, credits: true } },
        _count: { select: { enrollments: true } },
      },
    });

    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU'];
    const grid: Record<string, any[]> = {};
    for (const d of dayNames) grid[d] = [];

    for (const s of sections) {
      const sched = (s.schedule as any) ?? [];
      for (const slot of sched) {
        if (grid[slot.day]) {
          grid[slot.day].push({
            sectionId: s.id,
            courseCode: s.course.code,
            courseName: s.course.nameAr,
            from: slot.from,
            to: slot.to,
            room: slot.room,
            isLab: s.isLab || slot.type === 'lab' || slot.type === 'workshop',
            studentsCount: s._count.enrollments,
          });
        }
      }
    }
    for (const d of dayNames) grid[d].sort((a, b) => (a.from < b.from ? -1 : 1));
    return grid;
  }

  // ─────────────────────────────────────────────────────────
  // 3. شُعبي
  // ─────────────────────────────────────────────────────────
  mySections(trainerId: string) {
    return this.prisma.section.findMany({
      where: { trainerId },
      include: {
        course: { select: { code: true, nameAr: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { term: 'desc' },
    });
  }

  async sectionDetail(trainerId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, trainerId },
      include: {
        course: true,
        enrollments: {
          include: {
            trainee: { select: { id: true, studentNumber: true, fullNameAr: true, gpa: true, status: true } },
          },
          orderBy: { trainee: { fullNameAr: 'asc' } },
        },
      },
    });
    if (!section) throw new NotFoundException({ messageAr: 'الشعبة ليست لك' });
    return section;
  }

  // ─────────────────────────────────────────────────────────
  // 4. ابدأ حصة (Safety check + session)
  // ─────────────────────────────────────────────────────────
  async startClass(trainerId: string, sectionId: string, safetyCheck: any) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, trainerId } });
    if (!section) throw new ForbiddenException({ messageAr: 'الشعبة ليست لك' });

    if (section.isLab && safetyCheck) {
      const required = ['equipmentOk', 'exitsOk', 'firstAidOk', 'electricalOk'];
      const missing = required.filter((k) => !safetyCheck[k]);
      if (missing.length > 0) {
        throw new BadRequestException({
          messageAr: `لا يمكن بدء الحصة. لم يكتمل فحص السلامة: ${missing.join(', ')}`,
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.classSession.upsert({
      where: { sectionId_date: { sectionId, date: today } },
      update: { startTime: new Date(), safetyCheck },
      create: {
        trainerId,
        sectionId,
        date: today,
        startTime: new Date(),
        safetyCheck,
      },
    });
  }

  async endClass(trainerId: string, sectionId: string, report: { mood?: string; planCompletion?: string; notes?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session = await this.prisma.classSession.findUnique({
      where: { sectionId_date: { sectionId, date: today } },
    });
    if (!session || session.trainerId !== trainerId) {
      throw new ForbiddenException({ messageAr: 'الجلسة غير موجودة أو ليست لك' });
    }

    return this.prisma.classSession.update({
      where: { id: session.id },
      data: {
        endTime: new Date(),
        mood: report.mood,
        planCompletion: report.planCompletion,
        notes: report.notes,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5. ملاحظات شخصية على المتدربين
  // ─────────────────────────────────────────────────────────
  async listNotes(trainerId: string, traineeId?: string) {
    return this.prisma.trainerNote.findMany({
      where: { trainerId, traineeId },
      include: { trainee: { select: { fullNameAr: true, studentNumber: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createNote(trainerId: string, data: { traineeId: string; body: string; visibility?: 'PRIVATE' | 'TEAM' | 'ADMINISTRATIVE' }) {
    return this.prisma.trainerNote.create({
      data: {
        trainerId,
        traineeId: data.traineeId,
        body: data.body,
        visibility: (data.visibility ?? 'PRIVATE') as any,
      },
    });
  }

  async deleteNote(trainerId: string, id: string) {
    const note = await this.prisma.trainerNote.findFirst({ where: { id, trainerId } });
    if (!note) throw new NotFoundException();
    return this.prisma.trainerNote.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────
  // 6. التقارير الدورية
  // ─────────────────────────────────────────────────────────
  listReports(trainerId: string) {
    return this.prisma.trainerReport.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertReport(trainerId: string, data: {
    period: string;
    type: 'WEEKLY' | 'MONTHLY' | 'TERM';
    body: string;
    highlights?: any[];
    challenges?: any[];
  }) {
    return this.prisma.trainerReport.upsert({
      where: { trainerId_period: { trainerId, period: data.period } },
      update: {
        body: data.body,
        highlights: data.highlights as any,
        challenges: data.challenges as any,
      },
      create: {
        trainerId,
        period: data.period,
        type: data.type as any,
        body: data.body,
        highlights: data.highlights as any,
        challenges: data.challenges as any,
      },
    });
  }

  async submitReport(trainerId: string, id: string) {
    const r = await this.prisma.trainerReport.findFirst({ where: { id, trainerId } });
    if (!r) throw new NotFoundException();
    return this.prisma.trainerReport.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────
  // 7. خطة التطوير المهني
  // ─────────────────────────────────────────────────────────
  async myDevelopment(trainerId: string) {
    return this.prisma.developmentPlan.findMany({
      where: { trainerId },
      orderBy: { year: 'desc' },
    });
  }

  async upsertDevelopment(trainerId: string, year: string, goals: any[], progress?: number) {
    const existing = await this.prisma.developmentPlan.findFirst({ where: { trainerId, year } });
    if (existing) {
      return this.prisma.developmentPlan.update({
        where: { id: existing.id },
        data: { goals: goals as any, progress: progress ?? existing.progress },
      });
    }
    return this.prisma.developmentPlan.create({
      data: { trainerId, year, goals: goals as any, progress: progress ?? 0 },
    });
  }

  // ─────────────────────────────────────────────────────────
  // 8. التدريب التعاوني — متدربيّ
  // ─────────────────────────────────────────────────────────
  async myCoop(trainerId: string) {
    // متدربي = اللي مسجلين في شعبي
    const sections = await this.prisma.section.findMany({
      where: { trainerId },
      select: { enrollments: { select: { traineeId: true } } },
    });
    const traineeIds = Array.from(new Set(
      sections.flatMap((s) => s.enrollments.map((e) => e.traineeId))
    ));
    if (traineeIds.length === 0) return [];

    return this.prisma.coopPlacement.findMany({
      where: { traineeId: { in: traineeIds } },
      include: {
        trainee: { select: { studentNumber: true, fullNameAr: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async evaluateCoop(trainerId: string, coopId: string, evaluation: number) {
    if (evaluation < 0 || evaluation > 100) {
      throw new BadRequestException({ messageAr: 'التقييم بين ٠ و١٠٠' });
    }
    const coop = await this.prisma.coopPlacement.findUnique({
      where: { id: coopId },
      include: { trainee: true },
    });
    if (!coop) throw new NotFoundException();
    // تحقق أن المتدرب من شُعبه
    const owns = await this.prisma.section.findFirst({
      where: {
        trainerId,
        enrollments: { some: { traineeId: coop.traineeId } },
      },
    });
    if (!owns) throw new ForbiddenException({ messageAr: 'هذا المتدرب ليس من شعبك' });

    return this.prisma.coopPlacement.update({
      where: { id: coopId },
      data: { evaluation },
    });
  }

  // ─────────────────────────────────────────────────────────
  // 9. KPIs الشخصية للمدرب
  // ─────────────────────────────────────────────────────────
  async myKpis(trainerId: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id: trainerId } });
    if (!trainer) throw new NotFoundException();

    const visits = await this.prisma.supervisionVisit.findMany({ where: { trainerId } });
    const avgRating = visits.length
      ? visits.reduce((s, v) => s + Number(v.rating), 0) / visits.length
      : null;

    const enrollments = await this.prisma.enrollment.findMany({
      where: { section: { trainerId } },
    });
    const passed = enrollments.filter((e) => e.status === 'PASSED').length;
    const total = enrollments.filter((e) => e.status === 'PASSED' || e.status === 'FAILED').length;
    const passRate = total > 0 ? (passed / total) * 100 : null;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const myAttendance = await this.prisma.attendance.findMany({
      where: {
        employee: { userId: trainer.userId ?? undefined },
        date: { gte: weekStart },
      },
    });
    const presentDays = myAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const expectedDays = today.getDay() + 1;
    const myAttendanceRate = expectedDays > 0 ? (presentDays / expectedDays) * 100 : null;

    const dev = await this.prisma.developmentPlan.findFirst({
      where: { trainerId, year: String(new Date().getFullYear()) },
    });

    return {
      avgSupervisionRating: avgRating !== null ? Number(avgRating.toFixed(2)) : null,
      passRate: passRate !== null ? Number(passRate.toFixed(2)) : null,
      myAttendanceRate: myAttendanceRate !== null ? Number(myAttendanceRate.toFixed(2)) : null,
      developmentProgress: dev ? Number(dev.progress) : null,
      teachingLoad: trainer.loadHours,
      visitsCount: visits.length,
    };
  }
}
