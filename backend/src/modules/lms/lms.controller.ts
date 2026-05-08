import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('LMS — التدرب الإلكتروني')
@Controller('lms')
export class LmsController {
  constructor(private readonly lms: LmsService) {}

  @Get('courses')
  courses() { return this.lms.listCourses(); }

  @Post('courses')
  @RequirePermissions('lms.course.create')
  createCourse(@Body() body: any) { return this.lms.createCourse(body); }

  @Post('exams')
  @RequirePermissions('lms.exam.create')
  createExam(@Body() body: any) { return this.lms.createExam(body); }

  @Post('exams/:id/questions')
  @RequirePermissions('lms.exam.create')
  addQ(@Param('id') id: string, @Body() body: any) { return this.lms.addQuestion(id, body); }

  @Post('exams/:id/submissions/start')
  start(@Param('id') id: string, @Body() body: { traineeId: string }) {
    return this.lms.startSubmission(id, body.traineeId);
  }

  @Post('submissions/:id/submit')
  submit(@Param('id') id: string, @Body() body: { answers: any; score?: number }) {
    return this.lms.submit(id, body.answers, body.score);
  }
}
