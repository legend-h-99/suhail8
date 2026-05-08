import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { LeavesService } from './leaves.service';
import { EmployeesController } from './employees.controller';
import { LeavesController } from './leaves.controller';

@Module({
  controllers: [EmployeesController, LeavesController],
  providers: [EmployeesService, LeavesService],
  exports: [EmployeesService, LeavesService],
})
export class HrModule {}
