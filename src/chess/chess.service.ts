import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io'; // Added import for Server

const DEFAULT_GAME_TIME_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

interface Game {
  id: string;
  chess: Chess;
  players: { white?: string; black?: string }; // client.id
  spectators: string[];
  whiteTime: number; // Time remaining for white in milliseconds
  blackTime: number; // Time remaining for black in milliseconds
  lastMoveTime: number; // Timestamp of the last move
  outcome?: { winner: 'white' | 'black' | 'draw'; reason: string }; // Added for game outcome
}

@Injectable()
export class ChessService {
  private games: Map<string, Game> = new Map();
  private clientToGameMap: Map<string, string> = new Map(); // client.id -> game.id
  private server: Server; // Added to store the WebSocket server instance

  setServer(server: Server) {
    this.server = server;
  }

  handleConnection() {
    // Logic to assign players to games will be primarily in joinGame
  }

  handleDisconnect(client: Socket) {
    const gameId = this.clientToGameMap.get(client.id);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        // Remove player or spectator
        if (game.players.white === client.id) {
          game.players.white = undefined;
          if (game.players.black) {
            game.outcome = { winner: 'black', reason: 'White disconnected.' };
            this.server.to(gameId).emit('gameUpdate', this.getGameState(gameId));
          }
        } else if (game.players.black === client.id) {
          game.players.black = undefined;
          if (game.players.white) {
            game.outcome = { winner: 'white', reason: 'Black disconnected.' };
            this.server.to(gameId).emit('gameUpdate', this.getGameState(gameId));
          }
        } else {
          game.spectators = game.spectators.filter((id) => id !== client.id);
        }

        // If no players left, delete the game
        if (
          !game.players.white &&
          !game.players.black &&
          game.spectators.length === 0
        ) {
          this.games.delete(gameId);
          console.log(`Game ${gameId} deleted due to no players.`);
        }
      }
      this.clientToGameMap.delete(client.id);
    }
  }

  joinGame(client: Socket, gameId?: string): string {
    let game: Game | null = null;
    let assignedGameId: string | null = null;

    if (gameId && this.games.has(gameId)) {
      // Attempt to join a specific game if gameId is provided
      game = this.games.get(gameId)!;
      assignedGameId = gameId;
      if (!game.players.white) {
        game.players.white = client.id;
      } else if (!game.players.black) {
        game.players.black = client.id;
      } else {
        game.spectators.push(client.id);
        client.emit('playerColor', 'spectator'); // Spectators are assigned immediately
      }
    } else {
      // Search for an available lobby (a game with one player)
      let foundAvailableGame = false;
      for (const [id, existingGame] of this.games.entries()) {
        if ((existingGame.players.white && !existingGame.players.black) || (!existingGame.players.white && existingGame.players.black)) {
          game = existingGame;
          assignedGameId = id;
          foundAvailableGame = true;
          // Assign the current client to the empty player slot
          if (!game.players.white) {
            game.players.white = client.id;
            client.emit('playerColor', 'white');
          } else if (!game.players.black) {
            game.players.black = client.id;
            client.emit('playerColor', 'black');
          }
          break;
        }
      }

      if (!foundAvailableGame) {
        // Create a new game if no available lobby is found
        assignedGameId = uuidv4();
        game = {
          id: assignedGameId,
          chess: new Chess(),
          players: {},
          spectators: [],
          whiteTime: DEFAULT_GAME_TIME_MS,
          blackTime: DEFAULT_GAME_TIME_MS,
          lastMoveTime: Date.now(),
        };
        this.games.set(assignedGameId, game);
        // Assign first player as white by default for new games
        game.players.white = client.id;
      }
    }

    this.clientToGameMap.set(client.id, assignedGameId!);

    // If two players are now in the game, assign sides randomly if not already assigned
    if (game!.players.white && game!.players.black) {
      this.assignPlayers(game!);
    }

    console.log(`ChessService: Returning gameId: ${assignedGameId}`);
    return assignedGameId!;
  }

  makeMove(
    gameId: string,
    clientId: string,
    move: string | { from: string; to: string; promotion?: string },
  ): { success: boolean; message?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, message: 'Game not found.' };
    }

    // If game is already over, no more moves allowed
    if (game.outcome) {
      return { success: false, message: 'Game is already over.' };
    }

    const isWhitePlayer = game.players.white === clientId;
    const isBlackPlayer = game.players.black === clientId;

    if (!isWhitePlayer && !isBlackPlayer) {
      return { success: false, message: 'You are not a player in this game.' };
    }

    const turn = game.chess.turn();
    if ((turn === 'w' && !isWhitePlayer) || (turn === 'b' && !isBlackPlayer)) {
      return { success: false, message: 'It is not your turn.' };
    }

    try {
      const result = game.chess.move(move);
      if (result) {
        // Deduct time from the player who just moved
        const now = Date.now();
        const timeElapsed = now - game.lastMoveTime;
        game.lastMoveTime = now;

        if (turn === 'w') {
          game.whiteTime -= timeElapsed;
        } else {
          game.blackTime -= timeElapsed;
        }

        // Check for timeout after move
        if (game.whiteTime <= 0) {
          game.outcome = { winner: 'black', reason: 'White ran out of time.' };
        } else if (game.blackTime <= 0) {
          game.outcome = { winner: 'white', reason: 'Black ran out of time.' };
        }

        // Check for checkmate or draw
        if (game.chess.isCheckmate()) {
          game.outcome = { winner: turn === 'w' ? 'white' : 'black', reason: 'Checkmate!' };
        } else if (game.chess.isDraw()) {
          game.outcome = { winner: 'draw', reason: 'Draw!' };
        }

        return { success: true };
      } else {
        return { success: false, message: 'Invalid move.' };
      }
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }
  }

  getGameState(gameId: string) {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }
    return {
      id: game.id, // Added game ID
      board: game.chess.board(),
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      pgn: game.chess.pgn(),
      players: game.players,
      gameOver: game.chess.isGameOver(),
      inCheck: game.chess.inCheck(),
      inDraw: game.chess.isDraw(),
      inStalemate: game.chess.isStalemate(),
      inThreefoldRepetition: game.chess.isThreefoldRepetition(),
      insufficientMaterial: game.chess.isInsufficientMaterial(),
      checkmate: game.chess.isCheckmate(),
      whiteTime: game.whiteTime,
      blackTime: game.blackTime,
      lastMoveTime: game.lastMoveTime,
      outcome: game.outcome,
    };
  }

  getGameIdByClientId(clientId: string): string | undefined {
    return this.clientToGameMap.get(clientId);
  }

  private assignPlayers(game: Game) {
    if (game.players.white && game.players.black) {
      const players = [
        { id: game.players.white, color: 'white' },
        { id: game.players.black, color: 'black' },
      ];
      // Randomize the order of players
      players.sort(() => Math.random() - 0.5);

      // Assign colors based on the randomized order
      game.players.white = players[0].id;
      game.players.black = players[1].id;

      // Notify players of their assigned color via the gateway
      // This requires the gateway to have access to the server instance
      // For now, we'll assume the gateway will pick up the updated game state
      // and emit gameUpdate, which includes player assignments.
      // However, for direct playerColor notification, we need to emit from here.
      // This means the service needs a way to emit to specific clients.
      // Let's adjust the gateway to handle this emission.
      // For now, the gameUpdate will carry the correct player assignments.
    }
  }
}