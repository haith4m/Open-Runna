import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaceCalculationService } from './services/pace-calculation.service';
import { TrainingPlanGeneratorService } from './services/training-plan-generator.service';
import { AdaptiveTrainingService } from './services/adaptive-training.service';
import { TrainingController } from './controllers/training.controller';

@Module({
  imports: [PrismaModule],
  providers: [
    PaceCalculationService,
    TrainingPlanGeneratorService,
    AdaptiveTrainingService,
  ],
  controllers: [TrainingController],
  exports: [
    PaceCalculationService,
    TrainingPlanGeneratorService,
    AdaptiveTrainingService,
  ],
})
export class TrainingModule {}
