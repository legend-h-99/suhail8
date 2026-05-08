import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupervisionService } from './supervision.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Trainers — الزيارات الإشرافية')
@Controller('supervision-visits')
export class SupervisionController {
  constructor(private readonly visits: SupervisionService) {}

  @Get('me')
  @ApiOperation({ summary: 'زياراتي الإشرافية كمدرب' })
  mine(@CurrentUser() user: RequestUser) {
    if (!user.trainerId) return [];
    return this.visits.list({ trainerId: user.trainerId });
  }

  @Get()
  @RequirePermissions('trainers.read')
  list(
    @Query('trainerId') trainerId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.visits.list({ trainerId, departmentId, status });
  }

  @Get(':id')
  @RequirePermissions('trainers.read')
  get(@Param('id') id: string) {
    return this.visits.get(id);
  }

  @Post()
  @RequirePermissions('dept.supervision_visit.log')
  @ApiOperation({ summary: 'تسجيل زيارة إشرافية لمدرب' })
  log(@Body() body: any) {
    return this.visits.log(body);
  }

  @Post(':id/close')
  @RequirePermissions('dept.supervision_visit.log')
  close(@Param('id') id: string) {
    return this.visits.close(id);
  }
}
