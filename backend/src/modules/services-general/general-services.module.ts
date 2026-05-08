import { Module } from '@nestjs/common';
import { GeneralServicesService } from './general-services.service';
import { GeneralServicesController } from './general-services.controller';

@Module({
  controllers: [GeneralServicesController],
  providers: [GeneralServicesService],
})
export class GeneralServicesModule {}
