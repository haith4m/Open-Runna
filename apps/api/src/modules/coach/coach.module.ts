import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AiCoachService } from './services/ai-coach.service';
import { CoachController } from './controllers/coach.controller';

@Module({
  imports: [PrismaModule],
  providers: [AiCoachService],
  controllers: [CoachController],
  exports: [AiCoachService],
})
export class CoachModule {}
