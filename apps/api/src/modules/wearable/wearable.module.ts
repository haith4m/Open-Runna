import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [],
  controllers: [],
})
export class WearableModule {}
