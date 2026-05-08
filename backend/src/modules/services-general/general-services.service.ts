import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class GeneralServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  // Maintenance
  async openMaintenance(data: any) {
    const tenantId = this.tenancy.getTenantId();
    const count = await this.prisma.maintenanceRequest.count({ where: { tenantId } });
    const number = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    return this.prisma.maintenanceRequest.create({ data: { ...data, tenantId, number } });
  }

  listMaintenance(status?: string) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.maintenanceRequest.findMany({
      where: { tenantId, status: status as any },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Security
  async logSecurity(data: any) {
    const tenantId = this.tenancy.getTenantId();
    const count = await this.prisma.securityIncident.count({ where: { tenantId } });
    const number = `SEC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    return this.prisma.securityIncident.create({
      data: { ...data, tenantId, number, occurredAt: new Date(data.occurredAt) },
    });
  }

  listSecurity() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.securityIncident.findMany({
      where: { tenantId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  // Medical
  recordVisit(data: any) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.medicalVisit.create({
      data: { ...data, tenantId, visitDate: new Date(data.visitDate) },
    });
  }

  listVisits() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.medicalVisit.findMany({
      where: { tenantId },
      orderBy: { visitDate: 'desc' },
      take: 200,
    });
  }
}
