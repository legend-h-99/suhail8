import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Users — المستخدمون')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.users.list({ search, status });
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'مستخدم واحد بالتفصيل' })
  get(@Param('id') id: string) {
    return this.users.getById(id);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'إضافة مستخدم' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'تعديل بيانات مستخدم' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Post(':id/roles')
  @RequirePermissions('users.assign_role')
  @ApiOperation({ summary: 'إسناد دور للمستخدم' })
  assign(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.users.assignRole(id, dto);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('users.assign_role')
  @ApiOperation({ summary: 'سحب دور من المستخدم' })
  revoke(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.users.revokeRole(id, roleId);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @ApiOperation({ summary: 'تعطيل مستخدم' })
  deactivate(@Param('id') id: string) {
    return this.users.deactivate(id);
  }
}
