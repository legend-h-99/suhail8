import { Global, Module } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import { TenantInterceptor } from './tenant.interceptor';

@Global()
@Module({
  providers: [TenancyService, TenantInterceptor],
  exports: [TenancyService],
})
export class TenancyModule {}
