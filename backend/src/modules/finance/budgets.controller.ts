import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@ApiBearerAuth()
@ApiTags('Finance — الميزانيات')
@Controller('finance/budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  @RequirePermissions('finance.budget.read')
  list(@Query('fiscalYear') fiscalYear?: string, @Query('departmentId') departmentId?: string) {
    return this.budgets.list({ fiscalYear, departmentId });
  }

  @Post()
  @RequirePermissions('finance.budget.update')
  @ApiOperation({ summary: 'إنشاء/تحديث ميزانية' })
  upsert(@Body() dto: UpsertBudgetDto) {
    return this.budgets.upsert(dto);
  }
}
