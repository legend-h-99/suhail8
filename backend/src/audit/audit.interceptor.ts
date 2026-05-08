import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * يسجّل تلقائياً كل request تعديل ناجح إلى audit_logs.
 * المسارات التي تحتاج audit detail أعمق تستخدم AuditService مباشرة.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        if (!MUTATING_METHODS.has(req.method)) return;
        if (req.url?.startsWith('/api/v1/auth')) return; // skip auth chatter
        const ms = Date.now() - start;
        // fire-and-forget
        this.audit
          .record({
            tenantId: req.tenantId ?? req.user?.tenantId ?? null,
            userId: req.user?.userId ?? null,
            action: `${req.method} ${req.route?.path ?? req.url}`,
            entityType: 'http',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            after: { status: 'ok', durationMs: ms, body: req.body },
          })
          .catch(() => undefined);
      }),
    );
  }
}
