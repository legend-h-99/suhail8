import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require one or more permissions to access the route.
 * Permission codes follow the pattern: <module>.<resource>.<action>
 *   e.g., council.meeting.create, finance.purchase.approve
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
