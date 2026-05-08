import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SectionAttendanceService } from './attendance.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Academic — حضور المتدربين')
@Controller('academic/attendance')
export class AttendanceController {
  constructor(private readonly attendance: SectionAttendanceService) {}

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'قائمة الحضور للشعبة في تاريخ' })
  roster(@Param('sectionId') sectionId: string, @Query('date') date: string) {
    return this.attendance.rosterForDate(sectionId, date ?? new Date().toISOString().split('T')[0]);
  }

  @Post('section/:sectionId')
  @RequirePermissions('trainer.section.attendance')
  @ApiOperation({ summary: 'رصد حضور دفعة واحدة (مدرب الشعبة فقط)' })
  mark(
    @Param('sectionId') sectionId: string,
    @Body() body: { date: string; entries: any[] },
    @CurrentUser() user: RequestUser,
  ) {
    return this.attendance.markBulk({
      sectionId,
      date: body.date,
      trainerUserId: user.userId,
      entries: body.entries,
    });
  }

  @Get('trainee/:traineeId/report')
  @ApiOperation({ summary: 'تقرير حضور لمتدرب' })
  traineeReport(@Param('traineeId') traineeId: string) {
    return this.attendance.traineeReport(traineeId);
  }
}
