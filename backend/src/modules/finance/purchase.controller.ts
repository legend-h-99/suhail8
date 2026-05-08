import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SubmitPurchaseDto } from './dto/submit-purchase.dto';

@ApiBearerAuth()
@ApiTags('Finance — طلبات الشراء')
@Controller('finance/purchases')
export class PurchaseController {
  constructor(private readonly purchase: PurchaseService) {}

  @Get()
  @RequirePermissions('finance.purchase.read')
  @ApiOperation({ summary: 'قائمة طلبات الشراء' })
  list(@Query('departmentId') departmentId?: string, @Query('status') status?: string) {
    return this.purchase.list({ departmentId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل طلب شراء' })
  get(@Param('id') id: string) {
    return this.purchase.get(id);
  }

  @Post()
  @RequirePermissions('finance.purchase.create')
  @ApiOperation({ summary: 'تقديم طلب شراء (يبدأ سير اعتماد)' })
  submit(@Body() dto: SubmitPurchaseDto, @CurrentUser() user: RequestUser) {
    return this.purchase.submit({ ...dto, requesterId: user.userId });
  }
}
