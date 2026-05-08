import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Org — الهيكل التنظيمي')
@Controller('org')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('tree')
  @ApiOperation({ summary: 'شجرة الهيكل التنظيمي' })
  tree() {
    return this.org.tree();
  }

  @Get('departments')
  @ApiOperation({ summary: 'قائمة الإدارات' })
  list() {
    return this.org.listFlat();
  }

  @Post('departments')
  @RequirePermissions('org.department.create')
  @ApiOperation({ summary: 'إضافة إدارة' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.org.createDepartment(dto);
  }

  @Patch('departments/:id')
  @RequirePermissions('org.department.update')
  @ApiOperation({ summary: 'تعديل إدارة' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.org.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @RequirePermissions('org.department.delete')
  @ApiOperation({ summary: 'أرشفة إدارة' })
  remove(@Param('id') id: string) {
    return this.org.deleteDepartment(id);
  }

  @Get('departments/:id/positions')
  @ApiOperation({ summary: 'الوظائف في الإدارة' })
  positions(@Param('id') id: string) {
    return this.org.listPositions(id);
  }

  @Get('departments/:id/assignments')
  @ApiOperation({ summary: 'التكليفات الحالية' })
  assignments(@Param('id') id: string) {
    return this.org.listAssignments(id);
  }
}
