import { Module } from '@nestjs/common';
import { DataSystemsService } from './data-systems.service';
import { DataSystemsController } from './data-systems.controller';

@Module({
  controllers: [DataSystemsController],
  providers: [DataSystemsService],
})
export class DataSystemsModule {}
