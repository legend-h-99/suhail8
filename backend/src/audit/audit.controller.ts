import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Audit — سجل العمليات')
@Controller('audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'سجل العمليات (آخر 200)' })
  async list(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    const tenantId = this.tenancy.getTenantId();
    return this.prisma.auditLog.findMany({
      where: { tenantId, userId, entityType, action: action ? { contains: action } : undefined },
      include: { user: { select: { fullNameAr: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'سجل العمليات على كيان محدد' })
  byEntity(@Param('entityType') t: string, @Param('entityId') id: string) {
    return this.audit.findByEntity(t, id);
  }
}
