import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../prisma/prisma.service';

/**
 * يحمل سياق الـ tenant عبر الطلب (CLS).
 * يُستخدم من قبل الخدمات لتطبيق scope تلقائياً.
 */
@Injectable()
export class TenancyService {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
  ) {}

  setTenantId(tenantId: string) {
    this.cls.set('tenantId', tenantId);
  }

  getTenantId(): string {
    const id = this.cls.get<string>('tenantId');
    if (!id) throw new Error('No tenant context');
    return id;
  }

  getTenantIdOrNull(): string | null {
    return this.cls.get<string>('tenantId') ?? null;
  }

  async resolveBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }
}
