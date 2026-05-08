import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Community — مركز خدمة المجتمع')
@Controller('community')
export class CommunityController {
  constructor(private readonly cc: CommunityService) {}

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'قائمة دورات خدمة المجتمع (عام)' })
  list() { return this.cc.listCourses(); }

  @Post('courses')
  @RequirePermissions('community.course.create')
  create(@Body() body: any) { return this.cc.createCourse(body); }

  @Public()
  @Post('courses/:id/register')
  @ApiOperation({ summary: 'تسجيل خارجي في دورة' })
  register(@Param('id') id: string, @Body() body: any) { return this.cc.register(id, body); }

  @Post('registrations/:id/payment')
  @RequirePermissions('community.payment.record')
  paid(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.cc.markPaid(id, body.amount);
  }

  @Post('registrations/:id/certificate')
  @RequirePermissions('community.certificate.issue')
  cert(@Param('id') id: string) { return this.cc.issueCertificate(id); }
}
