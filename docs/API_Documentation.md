# Chess Game WebSocket API Documentation

This document outlines the WebSocket events and data structures for interacting with the NestJS chess game backend.

## WebSocket Endpoint

The WebSocket server is available at:
`ws://your-backend-address:3000` (or `wss://` if you configure SSL)

## Client-to-Server Events

These are the events your frontend will emit to the backend.

### 1. `joinGame`

Used to join an existing game or create a new one.

*   **Description**: When a client connects, they should emit this event to join a game. If `gameId` is provided, the client attempts to join that specific game. If `gameId` is omitted or the provided `gameId` does not exist, a new game will be created, and the client will be assigned to it.
*   **Payload**:
    ```typescript
    interface JoinGamePayload {
      gameId?: string; // Optional: ID of the game to join. If not provided, a new game is created.
    }
    ```
*   **Example**:
    ```javascript
    // To create or join a random available game
    socket.emit('joinGame', {});

    // To join a specific game
    socket.emit('joinGame', { gameId: 'some-uuid-game-id' });
    ```

### 2. `move`

Used to make a chess move.

*   **Description**: Emitted by a player to make a move on the chessboard. The move object should conform to the `chess.js` move format. The backend will validate the move against the current game state and player's turn.
*   **Payload**:
    ```typescript
    // This is a simplified representation. Refer to chess.js documentation for full move object details.
    interface ChessMove {
      from: string; // e.g., 'e2'
      to: string;   // e.g., 'e4'
      promotion?: string; // Optional: 'q', 'r', 'b', or 'n' for pawn promotion
    }
    ```
*   **Example**:
    ```javascript
    socket.emit('move', { from: 'e2', to: 'e4' });
    ```

### 3. `chat`

Used to send chat messages within a game.

*   **Description**: Emitted by any client in a game to send a chat message to all other clients in the same game room (players and spectators).
*   **Payload**:
    ```typescript
    type ChatMessagePayload = string; // The chat message content
    ```
*   **Example**:
    ```javascript
    socket.emit('chat', 'Good luck, have fun!');
    ```

## Server-to-Client Events

These are the events the backend will emit to your frontend.

### 1. `gameUpdate`

Provides the current state of the chess game.

*   **Description**: Sent to all clients in a game room whenever the game state changes (e.g., after a valid move, or when players join/leave). This event provides all necessary information to render the chessboard and display game status.
*   **Payload**:
    ```typescript
    interface GameState {
      board: Array<Array<{ square: string; type: string; color: string } | null>>; // chess.js board representation
      fen: string;       // Forsyth-Edwards Notation of the current board
      turn: 'w' | 'b';   // Whose turn it is ('w' for white, 'b' for black)
      pgn: string;       // Portable Game Notation of the game history
      players: {
        white?: string;  // Client ID of the white player
        black?: string;  // Client ID of the black player
      };
      gameOver: boolean;
      inCheck: boolean;
      inDraw: boolean;
      inStalemate: boolean;
      inThreefoldRepetition: boolean;
      insufficientMaterial: boolean;
      checkmate: boolean;
    }
    ```
*   **Example**:
    ```javascript
    socket.on('gameUpdate', (gameState) => {
      console.log('Game state updated:', gameState);
      // Update your UI based on the new game state
    });
    ```

### 2. `chatMessage`

Delivers a chat message from another client.

*   **Description**: Sent to all clients in a game room when a client sends a `chat` message.
*   **Payload**:
    ```typescript
    interface ReceivedChatMessage {
      sender: string;  // The client ID of the sender
      message: string; // The chat message content
    }
    ```
*   **Example**:
    ```javascript
    socket.on('chatMessage', (data) => {
      console.log(`${data.sender}: ${data.message}`);
      // Display the message in your chat UI
    });
    ```

### 3. `playerColor`

Informs the client of their assigned color.

*   **Description**: Sent to a client immediately after they join a game, indicating whether they are assigned as 'white', 'black', or 'spectator'.
*   **Payload**:
    ```typescript
    type PlayerColor = 'white' | 'black' | 'spectator';
    ```
*   **Example**:
    ```javascript
    socket.on('playerColor', (color) => {
      console.log('You are playing as:', color);
      // Update your UI to reflect the assigned color
    });
    ```

### 4. `error`

Indicates an error occurred on the backend.

*   **Description**: Sent to a specific client if an operation they attempted (e.g., `move`) failed due to invalid input or game rules.
*   **Payload**:
    ```typescript
    type ErrorMessage = string; // A descriptive error message
    ```
*   **Example**:
    ```javascript
    socket.on('error', (errorMessage) => {
      console.error('Backend error:', errorMessage);
      // Display an error message to the user
    });
    ```