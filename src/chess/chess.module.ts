import { Module } from '@nestjs/common';
import { ChessGateway } from './chess.gateway';
import { ChessService } from './chess.service';

@Module({
  providers: [ChessGateway, ChessService],
})
export class ChessModule {}
