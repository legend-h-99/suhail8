import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurriculumReviewService } from './curriculum-review.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Academic — تقييم الحقائب التدريبية')
@Controller('academic/curriculum-reviews')
export class CurriculumReviewController {
  constructor(private readonly reviews: CurriculumReviewService) {}

  @Get()
  list(@Query('departmentId') departmentId?: string, @Query('reviewYear') reviewYear?: string) {
    return this.reviews.list({ departmentId, reviewYear });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.reviews.get(id);
  }

  @Post()
  @RequirePermissions('dept.curriculum_review.create')
  @ApiOperation({ summary: 'فتح مراجعة سنوية للحقائب' })
  create(@Body() body: any) {
    return this.reviews.create(body);
  }

  @Post(':id/feedback')
  @RequirePermissions('trainer.curriculum.feedback')
  @ApiOperation({ summary: 'إضافة ملاحظات مدرب على الحقائب' })
  feedback(@Param('id') id: string, @Body() body: any) {
    return this.reviews.addFeedback(id, body);
  }

  @Post(':id/approve')
  @RequirePermissions('dept.curriculum_review.create')
  approve(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.reviews.approve(id, user.userId);
  }
}
