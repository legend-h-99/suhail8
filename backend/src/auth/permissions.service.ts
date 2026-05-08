import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * نموذج الصلاحيات: <module>.<resource>.<action>
 * يستخدم في seed data، وفي فحص الصلاحيات على مستوى الخدمات.
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async userHas(userId: string, code: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    return userRoles.some((ur) =>
      ur.role.rolePermissions.some((rp) => rp.permission.code === code),
    );
  }

  async listForUser(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    const set = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        set.add(rp.permission.code);
      }
    }
    return Array.from(set);
  }

  /**
   * فحص حد الاعتماد المالي (مثلاً: العميد له سقف 100,000 ريال للمشتريات)
   */
  async canApproveAmount(userId: string, amount: number): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    // Look up the user's positions and their budget limits
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
      include: { assignments: { include: { position: true } } },
    });

    if (!employee) return false;

    const maxLimit = employee.assignments.reduce((max, a) => {
      const limit = a.position.budgetLimit ? Number(a.position.budgetLimit) : 0;
      return limit > max ? limit : max;
    }, 0);

    return amount <= maxLimit;
  }
}
