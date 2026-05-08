import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GpsTrackingService } from './services/gps-tracking.service';
import { RunController } from './controllers/run.controller';

@Module({
  imports: [PrismaModule],
  providers: [GpsTrackingService],
  controllers: [RunController],
  exports: [GpsTrackingService],
})
export class RunModule {}
