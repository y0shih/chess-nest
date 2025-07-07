import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && (await this.userService.validatePassword(user, password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        elo: user.elo,
      },
    };
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      return { error: 'Username already exists' };
    }

    const existingEmail = await this.userService.findByEmail(userData.email);
    if (existingEmail) {
      return { error: 'Email already exists' };
    }

    try {
      const user = await this.userService.create(userData);
      const { password, ...result } = user;
      return { user: result };
    } catch (error) {
      return { error: 'Registration failed' };
    }
  }
}
