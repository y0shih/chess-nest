import { Module } from '@nestjs/common';
import { ChessGateway } from './chess.gateway';
import { ChessService } from './chess.service';
import { UserModule } from '../user/user.module';
import { EloModule } from '../elo/elo.module';

@Module({
  imports: [UserModule, EloModule],
  providers: [ChessGateway, ChessService],
})
export class ChessModule {}
