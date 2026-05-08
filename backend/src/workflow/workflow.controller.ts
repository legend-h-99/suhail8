import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsIn } from 'class-validator';

class ActOnStepDto {
  @IsString()
  @IsIn(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'DELEGATE'])
  decision!: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'DELEGATE';

  @IsOptional()
  @IsString()
  comment?: string;
}

@ApiBearerAuth()
@ApiTags('Workflow — سير العمل والاعتمادات')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflow: WorkflowService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'الاعتمادات المعلقة بانتظار قراري' })
  inbox(@CurrentUser() user: RequestUser) {
    return this.workflow.listPendingForUser(user.userId);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'تفاصيل instance من سير العمل' })
  get(@Param('id') id: string) {
    return this.workflow.getInstance(id);
  }

  @Post('instances/:id/act')
  @ApiOperation({ summary: 'اتخاذ قرار على الخطوة الحالية' })
  act(
    @Param('id') id: string,
    @Body() dto: ActOnStepDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workflow.act({
      instanceId: id,
      userId: user.userId,
      decision: dto.decision,
      comment: dto.comment,
    });
  }
}
