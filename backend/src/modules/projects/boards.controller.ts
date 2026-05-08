import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Boards — لوحات Kanban')
@Controller('boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  list() {
    return this.boards.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.boards.get(id);
  }

  @Post()
  @RequirePermissions('boards.create')
  create(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.boards.create({ ...body, ownerId: user.userId });
  }

  @Post('columns/:columnId/cards')
  @RequirePermissions('boards.manage_cards')
  addCard(@Param('columnId') columnId: string, @Body() body: any) {
    return this.boards.addCard(columnId, body);
  }

  @Post('cards/:cardId/move')
  @RequirePermissions('boards.manage_cards')
  moveCard(@Param('cardId') cardId: string, @Body() body: { columnId: string; order: number }) {
    return this.boards.moveCard(cardId, body.columnId, body.order);
  }

  @Delete('cards/:cardId')
  @RequirePermissions('boards.manage_cards')
  deleteCard(@Param('cardId') cardId: string) {
    return this.boards.deleteCard(cardId);
  }
}
