import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Tasks — نظام المهام')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('mineOnly') mineOnly?: string,
  ) {
    return this.tasks.list({
      assigneeId, status, projectId,
      mineOnly: mineOnly === 'true',
      userId: user.userId,
    });
  }

  @Get('stats')
  stats(@CurrentUser() user: RequestUser) {
    return this.tasks.stats(user.userId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tasks.get(id);
  }

  @Post()
  @RequirePermissions('tasks.create')
  create(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.tasks.create({ ...body, createdById: user.userId });
  }

  @Patch(':id')
  @RequirePermissions('tasks.update_status')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: RequestUser) {
    return this.tasks.update(id, body, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('tasks.delete')
  remove(@Param('id') id: string) {
    return this.tasks.delete(id);
  }

  @Post(':id/comments')
  comment(@Param('id') id: string, @Body() body: { body: string }, @CurrentUser() user: RequestUser) {
    return this.tasks.addComment(id, user.userId, body.body);
  }
}
