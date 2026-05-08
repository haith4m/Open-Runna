import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AthleteModule } from './modules/athlete/athlete.module';
import { TrainingModule } from './modules/training/training.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { RunModule } from './modules/run/run.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CoachModule } from './modules/coach/coach.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { WearableModule } from './modules/wearable/wearable.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      cache: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    AthleteModule,
    TrainingModule,
    WorkoutModule,
    RunModule,
    AnalyticsModule,
    CoachModule,
    SubscriptionModule,
    WearableModule,
    NotificationModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
