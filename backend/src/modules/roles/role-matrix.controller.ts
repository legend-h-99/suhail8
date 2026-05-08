import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleMatrixService } from './role-matrix.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('Roles — RACI Matrix & Access Test')
@Controller('roles/matrix')
export class RoleMatrixController {
  constructor(private readonly matrix: RoleMatrixService) {}

  @Get()
  @ApiOperation({ summary: 'مصفوفة كل الأدوار × كل الصلاحيات (RACI matrix)' })
  getMatrix() {
    return this.matrix.matrix();
  }

  @Get('access-test/me')
  @ApiOperation({ summary: 'اختبار الوصول للمستخدم الحالي — ماذا يقدر يشاهد ويفعل' })
  testMyAccess(@CurrentUser() user: RequestUser) {
    return this.matrix.accessTest(user.userId);
  }

  @Get('access-test/:userId')
  @ApiOperation({ summary: 'اختبار الوصول لمستخدم محدد (للأدمن)' })
  testUserAccess(@Param('userId') userId: string) {
    return this.matrix.accessTest(userId);
  }
}
