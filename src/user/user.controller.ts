import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return { error: 'User not found' };
    }
    const { password, ...result } = user;
    return result;
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.userService.getLeaderboard();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      return { error: 'User not found' };
    }
    const { password, email, ...result } = user;
    return result;
  }
}
