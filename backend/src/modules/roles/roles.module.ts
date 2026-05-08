import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RoleMatrixService } from './role-matrix.service';
import { RoleMatrixController } from './role-matrix.controller';

@Module({
  // Matrix controller أولاً ليلتقط /roles/matrix قبل /roles/:id
  controllers: [RoleMatrixController, RolesController],
  providers: [RolesService, RoleMatrixService],
  exports: [RolesService],
})
export class RolesModule {}
