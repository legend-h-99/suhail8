import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class OrgService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  /**
   * شجرة الهيكل التنظيمي بالكامل (هرمية).
   */
  async tree() {
    const tenantId = this.tenancy.getTenantId();
    const all = await this.prisma.department.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: { positions: true, managedBy: true },
      orderBy: [{ type: 'asc' }, { nameAr: 'asc' }],
    });

    const byParent = new Map<string | null, typeof all>();
    for (const d of all) {
      const key = d.parentId ?? null;
      const list = byParent.get(key) ?? [];
      list.push(d);
      byParent.set(key, list);
    }

    const build = (parentId: string | null): any[] =>
      (byParent.get(parentId) ?? []).map((d) => ({
        ...d,
        children: build(d.id),
      }));

    return build(null);
  }

  async listFlat() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { positions: true, parent: { select: { id: true, nameAr: true } } },
      orderBy: { nameAr: 'asc' },
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.department.create({
      data: {
        tenantId,
        code: dto.code,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        type: dto.type,
        parentId: dto.parentId,
        managerId: dto.managerId,
        costCenter: dto.costCenter,
      },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const tenantId = this.tenancy.getTenantId();
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException({ messageAr: 'الإدارة غير موجودة' });

    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async deleteDepartment(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException({ messageAr: 'الإدارة غير موجودة' });

    return this.prisma.department.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async listPositions(departmentId: string) {
    return this.prisma.position.findMany({ where: { departmentId } });
  }

  async listAssignments(departmentId: string) {
    return this.prisma.assignment.findMany({
      where: { departmentId },
      include: { employee: true, position: true },
    });
  }
}
