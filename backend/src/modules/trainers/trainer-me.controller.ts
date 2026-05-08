import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrainerMeService } from './trainer-me.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

function ensureTrainer(user: RequestUser) {
  if (!user.trainerId) {
    throw new ForbiddenException({ messageAr: 'هذه المسارات للمدربين فقط' });
  }
  return user.trainerId;
}

@ApiBearerAuth()
@ApiTags('Trainer-Me — مساحة المدرب الشخصية')
@Controller('trainers/me')
export class TrainerMeController {
  constructor(private readonly me: TrainerMeService) {}

  @Get('today')
  @ApiOperation({ summary: 'شاشة اليوم — حصص + تنبيهات + KPIs' })
  today(@CurrentUser() user: RequestUser) {
    return this.me.today(ensureTrainer(user));
  }

  @Get('schedule')
  @ApiOperation({ summary: 'الجدول الأسبوعي' })
  schedule(@CurrentUser() user: RequestUser) {
    return this.me.schedule(ensureTrainer(user));
  }

  @Get('sections')
  sections(@CurrentUser() user: RequestUser) {
    return this.me.mySections(ensureTrainer(user));
  }

  @Get('sections/:id')
  sectionDetail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.me.sectionDetail(ensureTrainer(user), id);
  }

  @Post('sections/:id/start')
  @ApiOperation({ summary: 'بدء حصة (مع safety check إن كانت معمل)' })
  startClass(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { safetyCheck?: any }) {
    return this.me.startClass(ensureTrainer(user), id, body.safetyCheck);
  }

  @Post('sections/:id/end')
  @ApiOperation({ summary: 'إنهاء حصة + تقرير ٣ ضغطات' })
  endClass(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { mood?: string; planCompletion?: string; notes?: string },
  ) {
    return this.me.endClass(ensureTrainer(user), id, body);
  }

  @Get('notes')
  notes(@CurrentUser() user: RequestUser, @Query('traineeId') traineeId?: string) {
    return this.me.listNotes(ensureTrainer(user), traineeId);
  }

  @Post('notes')
  createNote(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.me.createNote(ensureTrainer(user), body);
  }

  @Delete('notes/:id')
  deleteNote(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.me.deleteNote(ensureTrainer(user), id);
  }

  @Get('reports')
  reports(@CurrentUser() user: RequestUser) {
    return this.me.listReports(ensureTrainer(user));
  }

  @Post('reports')
  upsertReport(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.me.upsertReport(ensureTrainer(user), body);
  }

  @Post('reports/:id/submit')
  submitReport(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.me.submitReport(ensureTrainer(user), id);
  }

  @Get('development')
  development(@CurrentUser() user: RequestUser) {
    return this.me.myDevelopment(ensureTrainer(user));
  }

  @Patch('development')
  updateDevelopment(@CurrentUser() user: RequestUser, @Body() body: { year: string; goals: any[]; progress?: number }) {
    return this.me.upsertDevelopment(ensureTrainer(user), body.year, body.goals, body.progress);
  }

  @Get('coop')
  coop(@CurrentUser() user: RequestUser) {
    return this.me.myCoop(ensureTrainer(user));
  }

  @Post('coop/:id/evaluate')
  evaluateCoop(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { evaluation: number }) {
    return this.me.evaluateCoop(ensureTrainer(user), id, body.evaluation);
  }

  @Get('kpis')
  kpis(@CurrentUser() user: RequestUser) {
    return this.me.myKpis(ensureTrainer(user));
  }
}
