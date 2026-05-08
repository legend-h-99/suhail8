import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResearchService } from './research.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Research — مركز البحث والابتكار')
@Controller('research')
export class ResearchController {
  constructor(private readonly r: ResearchService) {}

  @Get('projects')
  list(@Query('status') status?: string) { return this.r.list({ status }); }

  @Post('projects')
  @RequirePermissions('research.project.create')
  propose(@Body() body: any) { return this.r.propose(body); }

  @Post('projects/:id/approve')
  @RequirePermissions('research.project.approve')
  approve(@Param('id') id: string, @Body() body: { fundingAmount?: number; fundingSource?: string }) {
    return this.r.approve(id, body.fundingAmount, body.fundingSource);
  }

  @Post('projects/:id/complete')
  @RequirePermissions('research.project.complete')
  complete(@Param('id') id: string, @Body() body: { outcomeUrl?: string }) {
    return this.r.complete(id, body.outcomeUrl);
  }
}
