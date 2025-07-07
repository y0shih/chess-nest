import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: { username: string; email: string; password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updateElo(userId: string, newElo: number): Promise<void> {
    await this.userRepository.update(userId, { elo: newElo });
  }

  async updateGameStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const updates = {
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: result === 'win' ? user.gamesWon + 1 : user.gamesWon,
      gamesLost: result === 'loss' ? user.gamesLost + 1 : user.gamesLost,
      gamesDraw: result === 'draw' ? user.gamesDraw + 1 : user.gamesDraw,
    };

    await this.userRepository.update(userId, updates);
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      order: { elo: 'DESC' },
      take: limit,
      select: ['id', 'username', 'elo', 'gamesPlayed', 'gamesWon', 'gamesLost', 'gamesDraw'],
    });
  }
}
