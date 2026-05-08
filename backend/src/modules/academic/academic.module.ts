import { Module } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AcademicController } from './academic.controller';
import { TrainingPlanService } from './training-plan.service';
import { TrainingPlanController } from './training-plan.controller';
import { CurriculumReviewService } from './curriculum-review.service';
import { CurriculumReviewController } from './curriculum-review.controller';
import { SectionAttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  controllers: [
    AcademicController,
    TrainingPlanController,
    CurriculumReviewController,
    AttendanceController,
  ],
  providers: [
    AcademicService,
    TrainingPlanService,
    CurriculumReviewService,
    SectionAttendanceService,
  ],
})
export class AcademicModule {}
