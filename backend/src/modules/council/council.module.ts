import { Module } from '@nestjs/common';
import { CouncilService } from './council.service';
import { MeetingsService } from './meetings.service';
import { CouncilController } from './council.controller';
import { MeetingsController } from './meetings.controller';

@Module({
  controllers: [CouncilController, MeetingsController],
  providers: [CouncilService, MeetingsService],
  exports: [CouncilService, MeetingsService],
})
export class CouncilModule {}
