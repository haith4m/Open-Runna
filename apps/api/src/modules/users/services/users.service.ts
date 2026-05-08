import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { athleteProfile: true },
    });
  }

  async updateUserProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
