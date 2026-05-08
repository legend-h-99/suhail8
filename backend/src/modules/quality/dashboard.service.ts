import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class QualityDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  /**
   * لوحة الجودة الاستراتيجية:
   * - KPIs مع traffic light + اتجاه
   * - heatmap للأقسام
   * - alerts (KPIs منخفضة + خطط متعثرة + اعتماد قريب)
   * - أعداد عامة
   */
  async strategic() {
    const tenantId = this.tenancy.getTenantId();

    const [kpis, plans, qips, accreditations, risks, teams, outcomes] = await Promise.all([
      this.prisma.kpi.findMany({
        where: { tenantId },
        include: { measurements: { orderBy: { period: 'desc' }, take: 6 } },
      }),
      this.prisma.qualityPlan.count({ where: { tenantId, status: { in: ['SUBMITTED', 'APPROVED'] } } }),
      this.prisma.qualityImprovementPlan.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      this.prisma.accreditation.findMany({
        where: { tenantId, cycle: String(new Date().getFullYear()) },
      }),
      this.prisma.risk.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.qualityTeam.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.trainingOutcome.findMany({
        where: { tenantId },
        orderBy: { measuredAt: 'desc' },
        take: 30,
      }),
    ]);

    // KPI traffic light + trend
    const kpisAnalyzed = kpis.map((k) => {
      const last = k.measurements[0];
      const prev = k.measurements[1];
      const lastVal = last ? Number(last.value) : null;
      const prevVal = prev ? Number(prev.value) : null;
      const target = k.target ? Number(k.target) : null;

      let trafficLight: 'green' | 'yellow' | 'red' | 'gray' = 'gray';
      if (lastVal !== null && target !== null) {
        const ratio = lastVal / target;
        trafficLight = ratio >= 0.9 ? 'green' : ratio >= 0.7 ? 'yellow' : 'red';
      }

      let trend: 'up' | 'down' | 'flat' | null = null;
      if (lastVal !== null && prevVal !== null) {
        const delta = ((lastVal - prevVal) / Math.max(prevVal, 1)) * 100;
        trend = Math.abs(delta) < 2 ? 'flat' : delta > 0 ? 'up' : 'down';
      }

      return {
        id: k.id,
        code: k.code,
        nameAr: k.nameAr,
        unit: k.unit,
        target,
        lastValue: lastVal,
        trafficLight,
        trend,
        measurementsCount: k.measurements.length,
      };
    });

    // Department heatmap (from outcomes)
    const deptMap: Record<string, any> = {};
    for (const o of outcomes) {
      const k = o.departmentId;
      if (!deptMap[k]) deptMap[k] = { departmentId: k, term: o.term, scores: {} };
      const scores: Record<string, number | null> = {
        passRate: o.passRate ? Number(o.passRate) : null,
        employmentRate: o.employmentRate ? Number(o.employmentRate) : null,
        employerSatisfaction: o.employerSatisfaction ? Number(o.employerSatisfaction) : null,
        studentSatisfaction: o.studentSatisfaction ? Number(o.studentSatisfaction) : null,
      };
      const valid = Object.values(scores).filter((v) => v !== null) as number[];
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      deptMap[k].scores = scores;
      deptMap[k].overall = avg;
    }

    // join dept names
    const deptIds = Object.keys(deptMap);
    if (deptIds.length > 0) {
      const depts = await this.prisma.department.findMany({
        where: { id: { in: deptIds } },
        select: { id: true, nameAr: true, code: true },
      });
      depts.forEach((d) => {
        if (deptMap[d.id]) {
          deptMap[d.id].departmentName = d.nameAr;
          deptMap[d.id].departmentCode = d.code;
        }
      });
    }

    // Accreditation summary
    const total = accreditations.length;
    const byStatus: Record<string, number> = {};
    accreditations.forEach((a) => { byStatus[a.status] = (byStatus[a.status] ?? 0) + 1; });
    const accredReadiness = total > 0
      ? Math.round(((byStatus.VERIFIED ?? 0) + (byStatus.EVIDENCE_READY ?? 0) * 0.7 + (byStatus.IN_PROGRESS ?? 0) * 0.3) / total * 100)
      : 0;

    // Alerts
    const alerts: { type: string; severity: 'critical' | 'warning' | 'info'; messageAr: string; link?: string }[] = [];
    const reds = kpisAnalyzed.filter((k) => k.trafficLight === 'red').length;
    if (reds > 0) {
      alerts.push({
        type: 'kpi_red',
        severity: 'critical',
        messageAr: `${reds} مؤشر دون ٧٠٪ من المستهدف — تحتاج تدخل عاجل`,
        link: '/dashboard/quality',
      });
    }
    const yellows = kpisAnalyzed.filter((k) => k.trafficLight === 'yellow').length;
    if (yellows > 0) {
      alerts.push({
        type: 'kpi_yellow',
        severity: 'warning',
        messageAr: `${yellows} مؤشر بين ٧٠-٩٠٪ من المستهدف`,
        link: '/dashboard/quality',
      });
    }
    if (accredReadiness < 50 && total > 0) {
      alerts.push({
        type: 'accred_low',
        severity: 'warning',
        messageAr: `جاهزية الاعتماد ${accredReadiness}٪ — يحتاج رفع شواهد`,
        link: '/dashboard/quality/accreditation',
      });
    }
    if (qips > 5) {
      alerts.push({
        type: 'qip_many',
        severity: 'info',
        messageAr: `${qips} خطة تحسين قيد التنفيذ — تابع تقدمها`,
        link: '/dashboard/quality/improvement',
      });
    }

    // KPI counts
    const kpiCounts = {
      green: kpisAnalyzed.filter((k) => k.trafficLight === 'green').length,
      yellow: yellows,
      red: reds,
      gray: kpisAnalyzed.filter((k) => k.trafficLight === 'gray').length,
    };

    return {
      kpis: kpisAnalyzed,
      kpiCounts,
      heatmap: Object.values(deptMap),
      counts: {
        plans,
        qips,
        risks,
        teams,
        accreditations: total,
        accredReadiness,
      },
      accreditationByStatus: byStatus,
      alerts,
      summary: {
        narrative: this.buildNarrative(kpisAnalyzed),
      },
    };
  }

  private buildNarrative(kpis: any[]): string {
    const greens = kpis.filter((k) => k.trafficLight === 'green').length;
    const reds = kpis.filter((k) => k.trafficLight === 'red').length;
    const upTrend = kpis.filter((k) => k.trend === 'up').length;
    const downTrend = kpis.filter((k) => k.trend === 'down').length;

    const parts: string[] = [];
    if (greens > 0) parts.push(`${greens} مؤشرات على المسار`);
    if (reds > 0) parts.push(`${reds} يحتاج تدخل`);
    if (upTrend > downTrend) parts.push(`اتجاه عام إيجابي`);
    else if (downTrend > upTrend) parts.push(`تراجع في ${downTrend} مؤشر`);
    return parts.join(' • ');
  }
}
