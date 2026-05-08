import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import { UsersService } from '../services/users.service';
import { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@User() user: JwtPayload) {
    return this.usersService.getUserProfile(user.sub);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateProfile(@User() user: JwtPayload, @Body() data: any) {
    return this.usersService.updateUserProfile(user.sub, data);
  }
}
