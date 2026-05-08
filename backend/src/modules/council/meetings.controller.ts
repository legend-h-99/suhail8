import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Council — الاجتماعات والقرارات')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الاجتماعات' })
  list(
    @Query('councilId') councilId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetings.list({ councilId, from, to });
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل اجتماع' })
  get(@Param('id') id: string) {
    return this.meetings.get(id);
  }

  @Post()
  @RequirePermissions('council.meeting.create')
  @ApiOperation({ summary: 'جدولة اجتماع' })
  schedule(@Body() body: any) {
    return this.meetings.schedule(body);
  }

  @Post(':id/decisions')
  @RequirePermissions('council.decision.create')
  @ApiOperation({ summary: 'تسجيل قرار' })
  decision(@Param('id') id: string, @Body() body: any) {
    return this.meetings.addDecision(id, body);
  }

  @Post('decisions/:id/vote')
  @ApiOperation({ summary: 'تصويت على قرار' })
  vote(
    @Param('id') id: string,
    @Body() body: { vote: 'APPROVE' | 'REJECT' | 'ABSTAIN'; reason?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.meetings.castVote(id, user.userId, body.vote, body.reason);
  }

  @Post(':id/minutes')
  @RequirePermissions('council.meeting.minutes_submit')
  @ApiOperation({ summary: 'رفع المحضر للاعتماد (يبدأ سير العمل)' })
  submitMinutes(
    @Param('id') id: string,
    @Body() body: { minutesUrl: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.meetings.submitMinutes(id, user.userId, body.minutesUrl);
  }
}
