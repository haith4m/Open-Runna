import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Runner',
      passwordHash: hashedPassword,
      emailVerified: true,
      athleteProfile: {
        create: {
          dateOfBirth: new Date('1990-05-15'),
          weight: 70,
          height: 180,
          gender: 'M',
          experienceLevel: 'intermediate',
          currentVdot: 55,
          estimatedVo2Max: 58,
          preferredRunDays: 4,
          maxWeeklyDistance: 60,
          timezone: 'America/New_York',
        },
      },
    },
  });

  // Create goal
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Marathon Goal',
      description: 'Train for a sub-3 hour marathon',
      raceDistance: 'marathon',
      targetDate: new Date('2026-11-01'),
      targetTime: '03:00:00',
      difficultyLevel: 'advanced',
    },
  });

  console.log('✅ Seeding completed!');
  console.log(`📧 Test user: test@example.com`);
  console.log(`🔑 Test password: TestPassword123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
