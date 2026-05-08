import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TraineesService } from './trainees.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Trainees — شؤون المتدربين')
@Controller('trainees')
export class TraineesController {
  constructor(private readonly trainees: TraineesService) {}

  @Get()
  @RequirePermissions('trainees.read')
  list(@Query('search') search?: string, @Query('status') status?: string, @Query('programId') programId?: string) {
    return this.trainees.list({ search, status, programId });
  }

  @Get(':id')
  @RequirePermissions('trainees.read')
  get(@Param('id') id: string) {
    return this.trainees.get(id);
  }

  @Post()
  @RequirePermissions('trainees.create')
  @ApiOperation({ summary: 'تسجيل متدرب جديد' })
  create(@Body() body: any) {
    return this.trainees.create(body);
  }

  @Post(':id/warnings')
  @RequirePermissions('trainees.warning.issue')
  @ApiOperation({ summary: 'إصدار إنذار أكاديمي' })
  warn(@Param('id') id: string, @Body() body: { level: number; reason: string }) {
    return this.trainees.issueWarning(id, body.level, body.reason);
  }
}
