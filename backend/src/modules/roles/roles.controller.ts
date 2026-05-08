import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

class CreateRoleDto {
  @IsString() code!: string;
  @IsString() nameAr!: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() scope?: 'GLOBAL' | 'TENANT' | 'DEPARTMENT' | 'UNIT';
  @IsOptional() @IsArray() @IsString({ each: true }) permissionCodes?: string[];
}

class PermissionListDto {
  @IsArray() @IsString({ each: true }) permissionCodes!: string[];
}

@ApiBearerAuth()
@ApiTags('Roles — الأدوار والصلاحيات')
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الأدوار' })
  list() {
    return this.roles.list();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'قائمة كل الصلاحيات (يمكن تصفيتها بـ module)' })
  listPermissions(@Query('module') filterModule?: string) {
    return this.roles.listPermissions(filterModule);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل دور' })
  get(@Param('id') id: string) {
    return this.roles.get(id);
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'إضافة دور جديد' })
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'منح صلاحيات لدور' })
  add(@Param('id') id: string, @Body() dto: PermissionListDto) {
    return this.roles.addPermissions(id, dto.permissionCodes);
  }

  @Post(':id/permissions/revoke')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'سحب صلاحيات من دور' })
  remove(@Param('id') id: string, @Body() dto: PermissionListDto) {
    return this.roles.removePermissions(id, dto.permissionCodes);
  }
}
