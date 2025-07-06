import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChessService } from './chess.service';

@WebSocketGateway({ cors: true })
export class ChessGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly chessService: ChessService) {}

  afterInit(server: Server) {
    console.log('ChessGateway initialized');
    this.chessService.setServer(server);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.chessService.handleConnection();
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.chessService.handleDisconnect(client);
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId?: string },
  ) {
    const gameId = this.chessService.joinGame(client, payload.gameId);
    void client.join(gameId);
    this.server
      .to(gameId)
      .emit('gameUpdate', this.chessService.getGameState(gameId));
    console.log(`ChessGateway: Emitting joinedGame with gameId: ${gameId}`);
    return { event: 'joinedGame', gameId };
  }

  @SubscribeMessage('move')
  handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    move: string | { from: string; to: string; promotion?: string },
  ) {
    const gameId = this.chessService.getGameIdByClientId(client.id);
    if (gameId) {
      const result = this.chessService.makeMove(gameId, client.id, move);
      if (result.success) {
        this.server
          .to(gameId)
          .emit('gameUpdate', this.chessService.getGameState(gameId));
      } else {
        client.emit('error', result.message);
      }
    } else {
      client.emit('error', 'Not in a game.');
    }
  }

  @SubscribeMessage('chat')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const gameId = this.chessService.getGameIdByClientId(client.id);
    if (gameId) {
      this.server
        .to(gameId)
        .emit('chatMessage', { sender: client.id, message });
    }
  }
}
