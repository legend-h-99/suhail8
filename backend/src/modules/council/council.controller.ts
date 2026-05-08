import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouncilService } from './council.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Council — مجلس المنشأة')
@Controller('councils')
export class CouncilController {
  constructor(private readonly council: CouncilService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المجالس' })
  list() {
    return this.council.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل مجلس' })
  get(@Param('id') id: string) {
    return this.council.get(id);
  }

  @Post()
  @RequirePermissions('council.create')
  @ApiOperation({ summary: 'تأسيس مجلس' })
  create(@Body() body: any) {
    return this.council.create(body);
  }

  @Post(':id/members')
  @RequirePermissions('council.member.add')
  @ApiOperation({ summary: 'إضافة عضو' })
  addMember(@Param('id') id: string, @Body() body: any) {
    return this.council.addMember(id, body);
  }
}
