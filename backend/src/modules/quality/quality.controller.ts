import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Quality — الجودة والمؤشرات')
@Controller('quality')
export class QualityController {
  constructor(private readonly q: QualityService) {}

  @Get('kpis')
  kpis() { return this.q.listKpis(); }

  @Post('kpis')
  @RequirePermissions('quality.kpi.update')
  @ApiOperation({ summary: 'إنشاء/تحديث مؤشر' })
  upsertKpi(@Body() body: any) { return this.q.upsertKpi(body); }

  @Post('kpis/:id/measurements')
  @RequirePermissions('quality.kpi.measure')
  @ApiOperation({ summary: 'تسجيل قياس لمؤشر' })
  measure(@Param('id') id: string, @Body() body: { period: string; value: number; notes?: string }) {
    return this.q.recordKpi(id, body.period, body.value, body.notes);
  }

  @Get('surveys')
  surveys() { return this.q.listSurveys(); }

  @Post('surveys')
  @RequirePermissions('quality.survey.create')
  createSurvey(@Body() body: any) { return this.q.createSurvey(body); }

  @Post('surveys/:id/responses')
  respond(@Param('id') id: string, @Body() body: { answers: any }, @CurrentUser() user: RequestUser) {
    return this.q.respond(id, user.userId, body.answers);
  }

  @Get('risks')
  risks() { return this.q.listRisks(); }

  @Post('risks')
  @RequirePermissions('quality.risk.register')
  registerRisk(@Body() body: any) { return this.q.registerRisk(body); }
}
