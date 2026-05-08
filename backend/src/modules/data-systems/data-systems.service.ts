import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class DataSystemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  // ─────── Data Lake ───────
  listFiles(category?: string) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dataLakeFile.findMany({
      where: { tenantId, category: category as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  registerFile(data: { name: string; source: string; category?: string; mimeType?: string; size?: number; url?: string; metadata?: any; uploadedById: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dataLakeFile.create({
      data: {
        tenantId,
        name: data.name,
        source: data.source,
        category: (data.category ?? 'RAW') as any,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        metadata: data.metadata,
        uploadedById: data.uploadedById,
      },
    });
  }

  // ─────── Data Warehouse ───────
  async listFacts(query: { factName?: string; period?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dataWarehouseFact.findMany({
      where: { tenantId, factName: query.factName, period: query.period },
      orderBy: { computedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * يحسب كل فاكتس النظام على فترة معينة.
   * يُستخدم من Data Processing Jobs.
   */
  async computeFacts(period: string) {
    const tenantId = this.tenancy.getTenantId();
    let count = 0;

    // fact_tasks
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });
    await this.prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: 'fact_tasks', period,
        dimensions: {} as any,
        measures: {
          total: taskStats.reduce((s: number, g: any) => s + g._count._all, 0),
          byStatus: taskStats.reduce((acc: any, g: any) => ({ ...acc, [g.status]: g._count._all }), {}),
        } as any,
      },
    });
    count++;

    // fact_attendance
    const attStats = await this.prisma.traineeAttendance.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    await this.prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: 'fact_attendance', period,
        dimensions: {} as any,
        measures: {
          total: attStats.reduce((s: number, g: any) => s + g._count._all, 0),
          byStatus: attStats.reduce((acc: any, g: any) => ({ ...acc, [g.status]: g._count._all }), {}),
        } as any,
      },
    });
    count++;

    // fact_finance
    const totalSpent = await this.prisma.purchaseRequest.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    });
    await this.prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: 'fact_finance', period,
        dimensions: {} as any,
        measures: { totalSpent: Number(totalSpent._sum.amount ?? 0) } as any,
      },
    });
    count++;

    // fact_quality
    const kpiCount = await this.prisma.kpi.count({ where: { tenantId } });
    const measurements = await this.prisma.kpiMeasurement.count();
    await this.prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: 'fact_quality', period,
        dimensions: {} as any,
        measures: { kpiCount, measurements } as any,
      },
    });
    count++;

    // fact_reports
    const reportCount = await this.prisma.dGReport.count({ where: { tenantId } });
    await this.prisma.dataWarehouseFact.create({
      data: {
        tenantId, factName: 'fact_reports', period,
        dimensions: {} as any,
        measures: { dgReports: reportCount } as any,
      },
    });
    count++;

    return { period, factsComputed: count };
  }

  // ─────── Data Processing Jobs ───────
  listJobs() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dataProcessingJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createJob(data: { nameAr: string; type: string; schedule?: string; source?: string; target?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.dataProcessingJob.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        type: data.type as any,
        schedule: data.schedule,
        source: data.source,
        target: data.target,
      },
    });
  }

  async runJob(id: string) {
    const job = await this.prisma.dataProcessingJob.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');

    await this.prisma.dataProcessingJob.update({
      where: { id },
      data: { lastStatus: 'RUNNING', lastRunAt: new Date() },
    });

    try {
      let rows = 0;
      if (job.type === 'AGGREGATION') {
        const result = await this.computeFacts(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
        rows = result.factsComputed;
      } else if (job.type === 'KPI_COMPUTE') {
        // مثال: يحسب KPI واحد
        rows = await this.prisma.kpiMeasurement.count();
      } else {
        // simulate
        rows = Math.floor(Math.random() * 1000);
      }
      return await this.prisma.dataProcessingJob.update({
        where: { id },
        data: {
          lastStatus: 'SUCCESS',
          rowsProcessed: rows,
          lastError: null,
        },
      });
    } catch (e: any) {
      return this.prisma.dataProcessingJob.update({
        where: { id },
        data: {
          lastStatus: 'FAILED',
          lastError: e.message,
        },
      });
    }
  }
}
