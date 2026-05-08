import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Trainers — شؤون المدربين')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainers: TrainersService) {}

  @Get()
  @RequirePermissions('trainers.read')
  list() { return this.trainers.list(); }

  @Get(':id')
  @RequirePermissions('trainers.read')
  get(@Param('id') id: string) { return this.trainers.get(id); }

  @Post(':id/loads')
  @RequirePermissions('trainers.load.set')
  @ApiOperation({ summary: 'تحديد النصاب التدريبي للفصل' })
  setLoad(@Param('id') id: string, @Body() body: { term: string; hours: number; notes?: string }) {
    return this.trainers.setLoad(id, body.term, body.hours, body.notes);
  }
}
