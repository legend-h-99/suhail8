import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

export interface JwtPayload {
  sub: string;
  tid: string;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly permissions: PermissionsService,
  ) {}

  async login(email: string, password: string, tenantSlug?: string) {
    const tenant = tenantSlug
      ? await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
      : await this.prisma.tenant.findFirst({
          where: {
            slug: this.config.get<string>('DEFAULT_TENANT_SLUG') || 'cci-riyadh',
          },
        });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException({ messageAr: 'الكلية غير متاحة' });
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ messageAr: 'بيانات الدخول غير صحيحة' });
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException({ messageAr: 'بيانات الدخول غير صحيحة' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.tenantId, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ messageAr: 'الجلسة منتهية' });
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({ messageAr: 'رمز غير صالح' });
    }

    const session = await this.prisma.session.findFirst({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!session || !(await argon2.verify(session.refreshTokenHash, refreshToken))) {
      throw new UnauthorizedException({ messageAr: 'الجلسة غير صالحة' });
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.tid, payload.email);
  }

  async logout(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async resolveRequestUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
        employeeProfile: {
          include: {
            department: { select: { id: true, code: true, nameAr: true } },
            assignments: {
              where: { OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
              include: { position: true, department: { select: { id: true, nameAr: true } } },
            },
          },
        },
        traineeProfile: { select: { id: true, studentNumber: true, programId: true } },
        trainerProfile: { select: { id: true, trainerNumber: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    const permissions = new Set<string>();
    const roles = new Set<string>();
    for (const ur of user.userRoles) {
      roles.add(ur.role.code);
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullNameAr: user.fullNameAr,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
      employeeId: user.employeeProfile?.id ?? null,
      employee: user.employeeProfile
        ? {
            id: user.employeeProfile.id,
            employeeNumber: user.employeeProfile.employeeNumber,
            fullNameAr: user.employeeProfile.fullNameAr,
            jobTitleAr: user.employeeProfile.jobTitleAr,
            department: user.employeeProfile.department,
            assignments: user.employeeProfile.assignments.map((a) => ({
              positionTitle: a.position.titleAr,
              departmentName: a.department.nameAr,
              isManagerial: a.position.isManagerial,
            })),
          }
        : null,
      traineeId: user.traineeProfile?.id ?? null,
      trainerId: user.trainerProfile?.id ?? null,
    };
  }

  private async issueTokens(userId: string, tenantId: string, email: string) {
    const accessTtl = parseInt(this.config.get<string>('JWT_ACCESS_TTL') || '900', 10);
    const refreshTtl = parseInt(this.config.get<string>('JWT_REFRESH_TTL') || '2592000', 10);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, tid: tenantId, email, type: 'access' } satisfies JwtPayload,
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: accessTtl },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, tid: tenantId, email, type: 'refresh' } satisfies JwtPayload,
      { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: refreshTtl },
    );

    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl, refreshExpiresIn: refreshTtl };
  }
}
