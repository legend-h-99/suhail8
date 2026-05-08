import { Module } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { TrainersController } from './trainers.controller';
import { SupervisionService } from './supervision.service';
import { SupervisionController } from './supervision.controller';
import { TrainerMeService } from './trainer-me.service';
import { TrainerMeController } from './trainer-me.controller';

@Module({
  controllers: [TrainerMeController, TrainersController, SupervisionController],
  providers: [TrainersService, SupervisionService, TrainerMeService],
})
export class TrainersModule {}
