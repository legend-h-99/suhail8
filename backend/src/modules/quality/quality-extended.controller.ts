import { Body, Controller, Delete, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QualityPlansService } from './plans.service';
import { QualityTeamsService } from './teams.service';
import { AccreditationService } from './accreditation.service';
import { TrainingOutcomesService } from './outcomes.service';
import { NominationsService } from './nominations.service';
import { DgReportsService } from './dg-reports.service';
import { CampaignsService } from './campaigns.service';
import { QualityDashboardService } from './dashboard.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Quality — Extended (Plans, Teams, Accreditation, …)')
@Controller('quality')
export class QualityExtendedController {
  constructor(
    private readonly plans: QualityPlansService,
    private readonly teams: QualityTeamsService,
    private readonly accreditation: AccreditationService,
    private readonly outcomes: TrainingOutcomesService,
    private readonly nominations: NominationsService,
    private readonly dgReports: DgReportsService,
    private readonly campaigns: CampaignsService,
    private readonly dashboard: QualityDashboardService,
  ) {}

  // ── Strategic Dashboard
  @Get('dashboard')
  @RequirePermissions('quality.kpi.measure')
  @ApiOperation({ summary: 'لوحة الجودة الاستراتيجية' })
  strategicDashboard() { return this.dashboard.strategic(); }

  // ── Plans
  @Get('plans')
  listPlans(@Query('fiscalYear') fiscalYear?: string, @Query('scope') scope?: string, @Query('status') status?: string) {
    return this.plans.list({ fiscalYear, scope, status });
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string) { return this.plans.get(id); }

  @Post('plans')
  @RequirePermissions('quality.plan.create_yearly')
  createPlan(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.plans.create({ ...body, createdById: user.userId });
  }

  @Patch('plans/:id')
  @RequirePermissions('quality.plan.create_yearly')
  updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.plans.update(id, body);
  }

  @Post('plans/:id/submit')
  @RequirePermissions('quality.plan.create_yearly')
  submitPlan(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.plans.submit(id, user.userId);
  }

  // ── Teams
  @Get('teams')
  listTeams(@Query('status') status?: string) { return this.teams.list(status); }

  @Get('teams/:id')
  getTeam(@Param('id') id: string) { return this.teams.get(id); }

  @Post('teams')
  @RequirePermissions('quality.team.charter')
  createTeam(@Body() body: any) { return this.teams.create(body); }

  @Post('teams/:id/activate')
  @RequirePermissions('quality.team.charter')
  activateTeam(@Param('id') id: string) { return this.teams.activate(id); }

  @Post('teams/:id/disband')
  @RequirePermissions('quality.team.charter')
  disbandTeam(@Param('id') id: string) { return this.teams.disband(id); }

  @Post('teams/:id/tasks')
  @RequirePermissions('quality.team.task.update')
  addTask(@Param('id') id: string, @Body() body: any) { return this.teams.addTask(id, body); }

  @Patch('teams/tasks/:taskId')
  @RequirePermissions('quality.team.task.update')
  updateTask(@Param('taskId') taskId: string, @Body() body: { status: any; notes?: string }) {
    return this.teams.updateTaskStatus(taskId, body.status, body.notes);
  }

  @Delete('teams/tasks/:taskId')
  @RequirePermissions('quality.team.task.update')
  deleteTask(@Param('taskId') taskId: string) { return this.teams.deleteTask(taskId); }

  // ── Accreditation
  @Get('accreditation')
  listAccred(@Query('cycle') cycle?: string, @Query('status') status?: string) {
    return this.accreditation.list({ cycle, status });
  }

  @Get('accreditation/:id')
  getAccred(@Param('id') id: string) { return this.accreditation.get(id); }

  @Post('accreditation')
  @RequirePermissions('quality.accreditation.manage')
  upsertAccred(@Body() body: any) { return this.accreditation.upsert(body); }

  @Patch('accreditation/:id/status')
  @RequirePermissions('quality.accreditation.manage')
  setAccredStatus(@Param('id') id: string, @Body() body: { status: any }) {
    return this.accreditation.updateStatus(id, body.status);
  }

  @Post('accreditation/:id/evidence')
  @RequirePermissions('quality.evidence.upload')
  addEvidence(@Param('id') id: string, @Body() body: any, @CurrentUser() user: RequestUser) {
    return this.accreditation.uploadEvidence(id, { ...body, uploadedById: user.userId });
  }

  @Delete('accreditation/evidence/:evidenceId')
  @RequirePermissions('quality.evidence.upload')
  removeEvidence(@Param('evidenceId') id: string) {
    return this.accreditation.deleteEvidence(id);
  }

  // ── Training Outcomes
  @Get('outcomes')
  listOutcomes(@Query('departmentId') departmentId?: string, @Query('term') term?: string) {
    return this.outcomes.list({ departmentId, term });
  }

  @Post('outcomes')
  @RequirePermissions('quality.training_outcomes.measure')
  upsertOutcome(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.outcomes.upsert({ ...body, measuredById: user.userId });
  }

  // ── Nominations
  @Get('nominations')
  listNominations(@Query('status') status?: string) { return this.nominations.list(status); }

  @Post('nominations')
  @RequirePermissions('quality.nomination.recommend')
  recommend(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.nominations.recommend({ ...body, recommendedById: user.userId });
  }

  @Patch('nominations/:id/status')
  @RequirePermissions('quality.nomination.recommend')
  setNominationStatus(@Param('id') id: string, @Body() body: { status: any; notes?: string }) {
    return this.nominations.updateStatus(id, body.status, body.notes);
  }

  // ── DG Reports
  @Get('dg-reports')
  listDgReports() { return this.dgReports.list(); }

  @Post('dg-reports')
  @RequirePermissions('quality.report.dg_submit')
  upsertDgReport(@Body() body: any) { return this.dgReports.upsert(body); }

  @Post('dg-reports/:id/submit')
  @RequirePermissions('quality.report.dg_submit')
  submitDgReport(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.dgReports.submit(id, user.userId);
  }

  @Post('dg-reports/:id/feedback')
  @RequirePermissions('quality.report.dg_submit')
  recordFeedback(@Param('id') id: string, @Body() body: { feedback: string }) {
    return this.dgReports.recordFeedback(id, body.feedback);
  }

  // ── Campaigns
  @Get('campaigns')
  listCampaigns() { return this.campaigns.list(); }

  @Post('campaigns')
  @RequirePermissions('quality.campaign.create')
  createCampaign(@Body() body: any) { return this.campaigns.create(body); }

  @Patch('campaigns/:id')
  @RequirePermissions('quality.campaign.create')
  updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.campaigns.update(id, body);
  }
}
