import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Projects — نظام المشاريع')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query('type') type?: string, @Query('status') status?: string) {
    return this.projects.list({ type, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Post()
  @RequirePermissions('projects.create')
  create(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.projects.create({ ...body, ownerId: body.ownerId ?? user.userId });
  }

  @Patch(':id')
  @RequirePermissions('projects.manage')
  update(@Param('id') id: string, @Body() body: any) {
    return this.projects.update(id, body);
  }

  @Post(':id/members')
  @RequirePermissions('projects.manage')
  addMember(@Param('id') id: string, @Body() body: { userId: string; role?: string }) {
    return this.projects.addMember(id, body.userId, body.role);
  }

  @Post(':id/milestones')
  @RequirePermissions('projects.manage')
  addMilestone(@Param('id') id: string, @Body() body: any) {
    return this.projects.addMilestone(id, body);
  }

  @Post('milestones/:id/complete')
  @RequirePermissions('projects.manage')
  completeMilestone(@Param('id') id: string) {
    return this.projects.completeMilestone(id);
  }
}
