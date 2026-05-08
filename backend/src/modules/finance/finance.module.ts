import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';

@Module({
  controllers: [PurchaseController, BudgetsController],
  providers: [PurchaseService, BudgetsService],
  exports: [PurchaseService, BudgetsService],
})
export class FinanceModule {}
