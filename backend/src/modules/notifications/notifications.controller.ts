import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('Notifications — الإشعارات')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly n: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'إشعاراتي' })
  list(@CurrentUser() user: RequestUser, @Query('unreadOnly') unreadOnly?: string) {
    return this.n.list(user.userId, { unreadOnly: unreadOnly === 'true' });
  }

  @Get('unread-count')
  count(@CurrentUser() user: RequestUser) {
    return this.n.unreadCount(user.userId).then((count) => ({ count }));
  }

  @Post('mark-read')
  markRead(@CurrentUser() user: RequestUser, @Body() body: { ids: string[] }) {
    return this.n.markRead(user.userId, body.ids);
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.n.markAllRead(user.userId);
  }
}
