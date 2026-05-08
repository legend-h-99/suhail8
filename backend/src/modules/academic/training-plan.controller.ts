import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrainingPlanService } from './training-plan.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Academic — الخطط التشغيلية للأقسام')
@Controller('academic/training-plans')
export class TrainingPlanController {
  constructor(private readonly plans: TrainingPlanService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الخطط التشغيلية' })
  list(
    @Query('departmentId') departmentId?: string,
    @Query('fiscalYear') fiscalYear?: string,
    @Query('status') status?: string,
  ) {
    return this.plans.list({ departmentId, fiscalYear, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.plans.get(id);
  }

  @Post()
  @RequirePermissions('dept.training_plan.create')
  @ApiOperation({ summary: 'إعداد خطة تشغيلية' })
  create(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.plans.create({ ...body, createdById: user.userId });
  }

  @Post(':id/submit')
  @RequirePermissions('dept.training_plan.create')
  @ApiOperation({ summary: 'تقديم الخطة للاعتماد (يبدأ سير العمل)' })
  submit(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.plans.submit(id, user.userId);
  }

  @Post(':id/approve')
  @RequirePermissions('dept.training_plan.create')
  approve(@Param('id') id: string) {
    return this.plans.approve(id);
  }
}
