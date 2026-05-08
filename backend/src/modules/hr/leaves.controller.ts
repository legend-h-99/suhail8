import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { LeaveType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

class SubmitLeaveDto {
  @IsString() employeeId!: string;
  @IsEnum(LeaveType) type!: LeaveType;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional() @IsString() reason?: string;
}

@ApiBearerAuth()
@ApiTags('HR — الإجازات')
@Controller('hr/leaves')
export class LeavesController {
  constructor(private readonly leaves: LeavesService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الإجازات (mineOnly=true لطلباتي فقط)' })
  list(
    @CurrentUser() user: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('mineOnly') mineOnly?: string,
  ) {
    const isMine = mineOnly === 'true' || mineOnly === '1';
    // Without 'hr.leave.read' permission, force mineOnly behaviour
    const hasPerm = user.permissions.includes('hr.leave.read') || user.roles.includes('SUPER_ADMIN');
    if (!hasPerm && !isMine) {
      return this.leaves.list({ mineOnly: true, userId: user.userId });
    }
    return this.leaves.list({ employeeId, status, mineOnly: isMine, userId: user.userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل طلب إجازة' })
  get(@Param('id') id: string) {
    return this.leaves.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'تقديم طلب إجازة (يبدأ سير اعتماد)' })
  submit(@Body() dto: SubmitLeaveDto, @CurrentUser() user: RequestUser) {
    return this.leaves.submit({ ...dto, submittedByUserId: user.userId });
  }
}
