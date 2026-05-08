import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Academic — البرامج والمقررات والشُّعب')
@Controller('academic')
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Get('programs')
  programs() { return this.academic.listPrograms(); }

  @Get('courses')
  courses(@Query('programId') programId?: string, @Query('departmentId') departmentId?: string) {
    return this.academic.listCourses({ programId, departmentId });
  }

  @Get('courses/:id/sections')
  sections(@Param('id') id: string) {
    return this.academic.listSections(id);
  }

  @Post('enrollments')
  @RequirePermissions('academic.enroll')
  enroll(@Body() body: { traineeId: string; sectionId: string }) {
    return this.academic.enroll(body.traineeId, body.sectionId);
  }

  @Post('enrollments/:id/grade')
  @RequirePermissions('academic.grade')
  grade(@Param('id') id: string, @Body() body: { grade: number }) {
    return this.academic.recordGrade(id, body.grade);
  }
}
