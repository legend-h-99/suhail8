import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ItService } from './it.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('IT — Helpdesk والأصول التقنية')
@Controller('it')
export class ItController {
  constructor(private readonly it: ItService) {}

  @Get('tickets')
  tickets(@Query('status') status?: string, @Query('assigneeId') assigneeId?: string) {
    return this.it.listTickets({ status, assigneeId });
  }

  @Post('tickets')
  @ApiOperation({ summary: 'فتح تذكرة دعم تقني' })
  open(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.it.openTicket({ ...body, creatorId: user.userId });
  }

  @Post('tickets/:id/assign')
  @RequirePermissions('it.ticket.assign')
  assign(@Param('id') id: string, @Body() body: { assigneeId: string }) {
    return this.it.assign(id, body.assigneeId);
  }

  @Post('tickets/:id/resolve')
  @RequirePermissions('it.ticket.resolve')
  resolve(@Param('id') id: string) {
    return this.it.resolve(id);
  }

  @Get('assets')
  assets(@Query('status') status?: string, @Query('category') category?: string) {
    return this.it.listAssets({ status, category });
  }

  @Post('assets')
  @RequirePermissions('it.asset.create')
  register(@Body() body: any) {
    return this.it.registerAsset(body);
  }
}
