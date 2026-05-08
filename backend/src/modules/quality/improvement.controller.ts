import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImprovementService } from './improvement.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Quality — خطط التحسين')
@Controller('quality/improvement-plans')
export class ImprovementController {
  constructor(private readonly qip: ImprovementService) {}

  @Get()
  list(
    @Query('fiscalYear') fiscalYear?: string,
    @Query('status') status?: string,
    @Query('scope') scope?: string,
  ) {
    return this.qip.list({ fiscalYear, status, scope });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.qip.get(id);
  }

  @Post()
  @RequirePermissions('quality.improvement_plan.execute')
  @ApiOperation({ summary: 'إنشاء خطة تحسين جودة' })
  create(@Body() body: any) {
    return this.qip.create(body);
  }

  @Post(':id/start')
  @RequirePermissions('quality.improvement_plan.execute')
  start(@Param('id') id: string) {
    return this.qip.start(id);
  }

  @Post(':id/complete')
  @RequirePermissions('quality.improvement_plan.execute')
  complete(@Param('id') id: string, @Body() body: { outcomeNotes?: string }) {
    return this.qip.complete(id, body?.outcomeNotes);
  }
}
