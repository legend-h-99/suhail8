import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    if (!user) throw new ForbiddenException({ messageAr: 'غير مصرح' });

    // Super admin bypass
    if (user.roles.includes('SUPER_ADMIN')) return true;

    const granted = required.every((perm) => user.permissions.includes(perm));
    if (!granted) {
      throw new ForbiddenException({
        messageAr: `لا تملك صلاحية: ${required.join(', ')}`,
      });
    }
    return true;
  }
}
