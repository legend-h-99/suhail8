import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeneralServicesService } from './general-services.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('General Services — الخدمات العامة')
@Controller('services')
export class GeneralServicesController {
  constructor(private readonly s: GeneralServicesService) {}

  @Get('maintenance')
  maint(@Query('status') status?: string) { return this.s.listMaintenance(status); }

  @Post('maintenance')
  openMaint(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.s.openMaintenance({ ...body, requesterId: user.userId });
  }

  @Get('security')
  @RequirePermissions('services.security.read')
  sec() { return this.s.listSecurity(); }

  @Post('security')
  @RequirePermissions('services.security.log')
  logSec(@Body() body: any) { return this.s.logSecurity(body); }

  @Get('medical')
  @RequirePermissions('services.medical.read')
  medical() { return this.s.listVisits(); }

  @Post('medical')
  @RequirePermissions('services.medical.record')
  recordVisit(@Body() body: any) { return this.s.recordVisit(body); }
}
