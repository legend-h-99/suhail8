import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpecializedService } from './specialized.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Specialized — مساحات الأدوار المتخصصة')
@Controller('specialized')
export class SpecializedController {
  constructor(private readonly s: SpecializedService) {}

  @Get('council-secretariat')
  @RequirePermissions('council.minutes.draft')
  @ApiOperation({ summary: 'مساحة أمين المجلس' })
  council() { return this.s.councilSecretariat(); }

  @Get('warehouse')
  @RequirePermissions('warehouse.inventory')
  @ApiOperation({ summary: 'مساحة أمين المستودع' })
  warehouse() { return this.s.warehouse(); }

  @Get('treasury')
  @RequirePermissions('treasury.reconcile')
  @ApiOperation({ summary: 'مساحة أمين الصندوق' })
  treasury() { return this.s.treasury(); }

  @Get('clinic')
  @RequirePermissions('clinic.examine')
  @ApiOperation({ summary: 'مساحة طبيب العيادة' })
  clinic() { return this.s.clinic(); }

  @Get('monitoring')
  @RequirePermissions('monitoring.tour')
  @ApiOperation({ summary: 'مساحة مراقب وحدة الرقابة' })
  monitoring() { return this.s.monitoring(); }
}
