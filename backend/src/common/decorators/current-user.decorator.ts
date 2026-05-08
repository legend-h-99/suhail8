import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  tenantId: string;
  email: string;
  fullNameAr: string;
  permissions: string[];
  roles: string[];
  employeeId?: string | null;
  traineeId?: string | null;
  trainerId?: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
