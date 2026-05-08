import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiBearerAuth()
@ApiTags('HR — الموظفون')
@Controller('hr/employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermissions('hr.employee.read')
  @ApiOperation({ summary: 'قائمة الموظفين' })
  list(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.employees.list({ search, departmentId, status });
  }

  @Get('directory')
  @ApiOperation({ summary: 'دليل الموظفين (أسماء فقط — متاح لكل المصادق عليهم)' })
  directory() {
    return this.employees.directory();
  }

  @Get(':id')
  @RequirePermissions('hr.employee.read')
  @ApiOperation({ summary: 'تفاصيل موظف' })
  get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  @RequirePermissions('hr.employee.create')
  @ApiOperation({ summary: 'إضافة موظف' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('hr.employee.update')
  @ApiOperation({ summary: 'تعديل بيانات موظف' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }
}
