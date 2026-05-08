import { Module } from '@nestjs/common';
import { ItService } from './it.service';
import { ItController } from './it.controller';

@Module({ controllers: [ItController], providers: [ItService] })
export class ItModule {}
