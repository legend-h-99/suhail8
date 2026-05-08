import { Module } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { ImprovementService } from './improvement.service';
import { ImprovementController } from './improvement.controller';
import { QualityExtendedController } from './quality-extended.controller';
import { QualityPlansService } from './plans.service';
import { QualityTeamsService } from './teams.service';
import { AccreditationService } from './accreditation.service';
import { TrainingOutcomesService } from './outcomes.service';
import { NominationsService } from './nominations.service';
import { DgReportsService } from './dg-reports.service';
import { CampaignsService } from './campaigns.service';
import { QualityDashboardService } from './dashboard.service';

@Module({
  // Extended controller أولاً ليعتلي على QualityController في route resolution
  controllers: [QualityExtendedController, QualityController, ImprovementController],
  providers: [
    QualityService,
    ImprovementService,
    QualityPlansService,
    QualityTeamsService,
    AccreditationService,
    TrainingOutcomesService,
    NominationsService,
    DgReportsService,
    CampaignsService,
    QualityDashboardService,
  ],
})
export class QualityModule {}
