import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
  controllers: [ProjectsController, BoardsController],
  providers: [ProjectsService, BoardsService],
})
export class ProjectsModule {}
