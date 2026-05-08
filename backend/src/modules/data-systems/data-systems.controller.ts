import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataSystemsService } from './data-systems.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Data — Lake / Warehouse / Processing')
@Controller('data')
export class DataSystemsController {
  constructor(private readonly data: DataSystemsService) {}

  // Data Lake
  @Get('lake')
  @RequirePermissions('data_lake.read')
  listFiles(@Query('category') category?: string) {
    return this.data.listFiles(category);
  }

  @Post('lake')
  @RequirePermissions('data_lake.upload')
  registerFile(@Body() body: any, @CurrentUser() user: RequestUser) {
    return this.data.registerFile({ ...body, uploadedById: user.userId });
  }

  // Data Warehouse
  @Get('warehouse')
  @RequirePermissions('data_warehouse.read')
  listFacts(@Query('factName') factName?: string, @Query('period') period?: string) {
    return this.data.listFacts({ factName, period });
  }

  @Post('warehouse/compute')
  @RequirePermissions('data_processing.manage')
  compute(@Body() body: { period: string }) {
    return this.data.computeFacts(body.period);
  }

  // Data Processing
  @Get('processing/jobs')
  @RequirePermissions('data_processing.manage')
  listJobs() {
    return this.data.listJobs();
  }

  @Post('processing/jobs')
  @RequirePermissions('data_processing.manage')
  createJob(@Body() body: any) {
    return this.data.createJob(body);
  }

  @Post('processing/jobs/:id/run')
  @RequirePermissions('data_processing.manage')
  runJob(@Param('id') id: string) {
    return this.data.runJob(id);
  }
}
