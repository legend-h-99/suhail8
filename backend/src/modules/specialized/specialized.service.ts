import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class SpecializedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  // ─────────────────────────────────────────────────────
  // 1. أمين المجلس (Council Secretariat)
  // ─────────────────────────────────────────────────────
  async councilSecretariat() {
    const tenantId = this.tenancy.getTenantId();
    const [upcomingMeetings, recentDecisions, pendingMinutes] = await Promise.all([
      this.prisma.meeting.findMany({
        where: { scheduledAt: { gte: new Date() } },
        include: { _count: { select: { attendees: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.decision.findMany({
        include: { meeting: { select: { titleAr: true, scheduledAt: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.meeting.count({
        where: { status: 'COMPLETED', minutesUrl: null },
      }),
    ]);
    return {
      summary: {
        upcomingMeetings: upcomingMeetings.length,
        pendingMinutes,
        recentDecisions: recentDecisions.length,
      },
      upcomingMeetings,
      recentDecisions,
    };
  }

  // ─────────────────────────────────────────────────────
  // 2. أمين المستودع (Warehouse)
  // ─────────────────────────────────────────────────────
  async warehouse() {
    const tenantId = this.tenancy.getTenantId();
    const [assets, recentPRs, totalValue] = await Promise.all([
      this.prisma.asset.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.purchaseRequest.findMany({
        where: { status: { in: ['APPROVED', 'ORDERED'] } },
        include: { items: true, department: { select: { nameAr: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.purchaseRequest.aggregate({
        where: { status: 'RECEIVED' },
        _sum: { amount: true },
      }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const a of assets) {
      byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    }
    const lowStockAlerts = Object.entries(byCategory)
      .filter(([, c]) => c < 3)
      .map(([cat]) => `فئة "${cat}" أقل من 3 وحدات`);

    return {
      summary: {
        totalAssets: assets.length,
        categoriesCount: Object.keys(byCategory).length,
        pendingDeliveries: recentPRs.length,
        totalReceivedValue: totalValue._sum.amount ?? 0,
      },
      byCategory,
      lowStockAlerts,
      pendingDeliveries: recentPRs,
      recentAssets: assets.slice(0, 10),
    };
  }

  // ─────────────────────────────────────────────────────
  // 3. أمين الصندوق (Treasury)
  // ─────────────────────────────────────────────────────
  async treasury() {
    const tenantId = this.tenancy.getTenantId();
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [budgets, invoices, pendingPayments] = await Promise.all([
      this.prisma.budget.findMany({
        where: { tenantId, fiscalYear: '1446' },
        include: { department: { select: { nameAr: true } } },
      }),
      this.prisma.invoice.findMany({
        where: { createdAt: { gte: monthStart } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.invoice.count({ where: { status: 'PENDING' } }),
    ]);

    const totalAllocated = budgets.reduce((s, b) => s + Number(b.allocated), 0);
    const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
    const totalReserved = budgets.reduce((s, b) => s + Number(b.reserved), 0);

    return {
      summary: {
        totalAllocated,
        totalSpent,
        totalReserved,
        utilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
        pendingPayments,
      },
      budgets,
      recentInvoices: invoices,
    };
  }

  // ─────────────────────────────────────────────────────
  // 4. طبيب العيادة (Clinic)
  // ─────────────────────────────────────────────────────
  async clinic() {
    const tenantId = this.tenancy.getTenantId();
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const [thisWeekVisits, recentVisits, byPatientType] = await Promise.all([
      this.prisma.medicalVisit.count({
        where: { tenantId, visitDate: { gte: weekStart } },
      }),
      this.prisma.medicalVisit.findMany({
        where: { tenantId },
        orderBy: { visitDate: 'desc' },
        take: 20,
      }),
      this.prisma.medicalVisit.groupBy({
        by: ['patientType'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    return {
      summary: {
        thisWeekVisits,
        totalVisits: recentVisits.length,
      },
      byPatientType: byPatientType.map((g: any) => ({
        type: g.patientType,
        count: g._count._all,
      })),
      recentVisits,
    };
  }

  // ─────────────────────────────────────────────────────
  // 5. مراقب وحدة الرقابة (Monitoring)
  // ─────────────────────────────────────────────────────
  async monitoring() {
    const tenantId = this.tenancy.getTenantId();
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const [todayAttendance, weekAttendance, recentIncidents] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { date: today },
        take: 50,
      }),
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { date: { gte: weekStart } },
        _count: { _all: true },
      }),
      this.prisma.securityIncident.findMany({
        where: { tenantId, occurredAt: { gte: weekStart } },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
    ]);

    const attendanceCounts: Record<string, number> = {};
    weekAttendance.forEach((g: any) => {
      attendanceCounts[g.status] = g._count._all;
    });

    return {
      summary: {
        todayPresent: todayAttendance.filter((a) => a.status === 'PRESENT').length,
        todayAbsent: todayAttendance.filter((a) => a.status === 'ABSENT').length,
        todayLate: todayAttendance.filter((a) => a.status === 'LATE').length,
        recentIncidents: recentIncidents.length,
      },
      weekAttendanceCounts: attendanceCounts,
      recentIncidents,
    };
  }
}
