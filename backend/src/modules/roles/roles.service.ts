import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list() {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: { select: { userRoles: true, rolePermissions: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async get(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException({ messageAr: 'الدور غير موجود' });
    return role;
  }

  async create(data: {
    code: string;
    nameAr: string;
    nameEn?: string;
    description?: string;
    scope?: 'GLOBAL' | 'TENANT' | 'DEPARTMENT' | 'UNIT';
    permissionCodes?: string[];
  }) {
    const tenantId = this.tenancy.getTenantId();
    const role = await this.prisma.role.create({
      data: {
        tenantId,
        code: data.code,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        scope: (data.scope as any) ?? 'TENANT',
      },
    });

    if (data.permissionCodes?.length) {
      const perms = await this.prisma.permission.findMany({
        where: { code: { in: data.permissionCodes } },
      });
      await this.prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }

    return this.get(role.id);
  }

  async addPermissions(roleId: string, permissionCodes: string[]) {
    const perms = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });
    await this.prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });
    return this.get(roleId);
  }

  async removePermissions(roleId: string, permissionCodes: string[]) {
    const perms = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { in: perms.map((p) => p.id) } },
    });
    return this.get(roleId);
  }

  async listPermissions(filterModule?: string) {
    return this.prisma.permission.findMany({
      where: filterModule ? { module: filterModule } : undefined,
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }
}
