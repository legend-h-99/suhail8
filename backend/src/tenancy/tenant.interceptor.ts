import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenancyService } from './tenancy.service';

/**
 * يستخرج tenantId من JWT (req.user.tenantId) أو من header X-Tenant-Slug
 * ويحقنه في الـ CLS context قبل تنفيذ الـ handler.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenancy: TenancyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    let tenantId: string | undefined = req.user?.tenantId;

    if (!tenantId && req.headers['x-tenant-slug']) {
      const tenant = await this.tenancy.resolveBySlug(req.headers['x-tenant-slug']);
      if (tenant) tenantId = tenant.id;
    }

    if (tenantId) {
      this.tenancy.setTenantId(tenantId);
      req.tenantId = tenantId;
    }

    return next.handle();
  }
}
