import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { HashUtil } from '@/common/utils/hash.util';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await HashUtil.hash(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
      },
    });

    // Create athlete profile
    await this.prisma.athleteProfile.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await HashUtil.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private generateTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwt.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
