import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  async list(query: { search?: string; status?: string }) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.user.findMany({
      where: {
        tenantId,
        status: (query.status as any) ?? undefined,
        OR: query.search
          ? [
              { fullNameAr: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        userRoles: { include: { role: { select: { code: true, nameAr: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getById(id: string) {
    const tenantId = this.tenancy.getTenantId();
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: {
        userRoles: { include: { role: true } },
        employeeProfile: true,
        traineeProfile: true,
        trainerProfile: true,
      },
    });
    if (!user) throw new NotFoundException({ messageAr: 'المستخدم غير موجود' });
    return user;
  }

  async create(dto: CreateUserDto) {
    const tenantId = this.tenancy.getTenantId();
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException({ messageAr: 'البريد مسجل مسبقاً' });

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        fullNameAr: dto.fullNameAr,
        fullNameEn: dto.fullNameEn,
        phone: dto.phone,
        nationalId: dto.nationalId,
      },
    });

    if (dto.roleCodes?.length) {
      const roles = await this.prisma.role.findMany({
        where: { tenantId, code: { in: dto.roleCodes } },
      });
      await this.prisma.userRole.createMany({
        data: roles.map((r) => ({ userId: user.id, roleId: r.id })),
        skipDuplicates: true,
      });
    }

    return this.getById(user.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const tenantId = this.tenancy.getTenantId();
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException({ messageAr: 'المستخدم غير موجود' });

    const data: any = { ...dto };
    delete data.password;
    delete data.roleCodes;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.update({ where: { id }, data });
  }

  async assignRole(userId: string, dto: AssignRoleDto) {
    const tenantId = this.tenancy.getTenantId();
    const role = await this.prisma.role.findUnique({
      where: { tenantId_code: { tenantId, code: dto.roleCode } },
    });
    if (!role) throw new NotFoundException({ messageAr: 'الدور غير موجود' });

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
      },
    });
  }

  async revokeRole(userId: string, roleId: string) {
    return this.prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
