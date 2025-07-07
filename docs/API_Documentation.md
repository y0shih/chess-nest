# Chess Game API Documentation

This document outlines the REST API endpoints and WebSocket events for interacting with the NestJS chess game backend with ELO rating system.

## Base URL

- **REST API**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:8000` (or `wss://` if you configure SSL)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## REST API Endpoints

### Authentication

#### Register User
- **POST** `/auth/register`
- **Description**: Register a new user
- **Body**:
  ```typescript
  interface RegisterRequest {
    username: string;
    email: string;
    password: string;
  }
  ```
- **Response**:
  ```typescript
  interface RegisterResponse {
    user?: {
      id: string;
      username: string;
      email: string;
      elo: number;
      gamesPlayed: number;
      gamesWon: number;
      gamesLost: number;
      gamesDraw: number;
      createdAt: string;
      updatedAt: string;
    };
    error?: string;
  }
  ```
- **Example**:
  ```javascript
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'player1',
      email: 'player1@example.com',
      password: 'password123'
    })
  });
  ```

#### Login User
- **POST** `/auth/login`
- **Description**: Login user and get JWT token
- **Body**:
  ```typescript
  interface LoginRequest {
    username: string;
    password: string;
  }
  ```
- **Response**:
  ```typescript
  interface LoginResponse {
    access_token: string;
    user: {
      id: string;
      username: string;
      email: string;
      elo: number;
    };
  }
  ```
- **Example**:
  ```javascript
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'player1',
      password: 'password123'
    })
  });
  ```

### User Management

#### Get User Profile
- **GET** `/users/profile`
- **Description**: Get current user's profile (requires authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```typescript
  interface UserProfile {
    id: string;
    username: string;
    email: string;
    elo: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDraw: number;
    createdAt: string;
    updatedAt: string;
  }
  ```
- **Example**:
  ```javascript
  const response = await fetch('/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  ```

#### Get User by ID
- **GET** `/users/:id`
- **Description**: Get user by ID (public info only)
- **Response**:
  ```typescript
  interface PublicUserProfile {
    id: string;
    username: string;
    elo: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDraw: number;
    createdAt: string;
    updatedAt: string;
  }
  ```
- **Example**:
  ```javascript
  const response = await fetch('/users/123e4567-e89b-12d3-a456-426614174000');
  ```

#### Get Leaderboard
- **GET** `/users/leaderboard`
- **Description**: Get top 10 players by ELO rating
- **Response**:
  ```typescript
  interface LeaderboardEntry {
    id: string;
    username: string;
    elo: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDraw: number;
  }
  type LeaderboardResponse = LeaderboardEntry[];
  ```
- **Example**:
  ```javascript
  const response = await fetch('/users/leaderboard');
  ```

## WebSocket Events

## Client-to-Server Events

These are the events your frontend will emit to the backend.

### 1. `joinGame`

Used to join an existing game or create a new one.

*   **Description**: When a client connects, they should emit this event to join a game. If `gameId` is provided, the client attempts to join that specific game. If `gameId` is omitted or the provided `gameId` does not exist, a new game will be created, and the client will be assigned to it. Include `userId` to track ELO ratings.
*   **Payload**:
    ```typescript
    interface JoinGamePayload {
      gameId?: string; // Optional: ID of the game to join. If not provided, a new game is created.
      userId?: string; // Optional: User ID for ELO tracking (required for ranked games)
    }
    ```
*   **Example**:
    ```javascript
    // To create or join a random available game (guest)
    socket.emit('joinGame', {});

    // To join a specific game (guest)
    socket.emit('joinGame', { gameId: 'some-uuid-game-id' });

    // To join a ranked game with ELO tracking
    socket.emit('joinGame', { userId: 'user-123' });

    // To join a specific ranked game
    socket.emit('joinGame', { gameId: 'some-uuid-game-id', userId: 'user-123' });
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
      id: string;        // Game ID
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
      whiteTime: number; // Time remaining for white in milliseconds
      blackTime: number; // Time remaining for black in milliseconds
      lastMoveTime: number; // Timestamp of the last move
      outcome?: {
        winner: 'white' | 'black' | 'draw';
        reason: string;
      };
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

### 4. `joinedGame`

Confirms that the client has successfully joined a game.

*   **Description**: Sent to a client immediately after they successfully join a game, providing the game ID.
*   **Payload**:
    ```typescript
    interface JoinedGameResponse {
      event: 'joinedGame';
      gameId: string;
    }
    ```
*   **Example**:
    ```javascript
    socket.on('joinedGame', (data) => {
      console.log('Joined game:', data.gameId);
      // Store the game ID for future reference
    });
    ```

### 5. `error`

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

## Frontend Integration Examples

### Complete Authentication Flow

```javascript
// 1. Register a new user
async function registerUser(username, email, password) {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
}

// 2. Login user
async function loginUser(username, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
}

// 3. Get user profile
async function getUserProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch('/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// 4. Get leaderboard
async function getLeaderboard() {
  const response = await fetch('/users/leaderboard');
  return response.json();
}
```

### Complete Chess Game Integration

```javascript
import { io } from 'socket.io-client';

class ChessGameClient {
  constructor() {
    this.socket = io('ws://localhost:8000');
    this.gameId = null;
    this.userId = null;
    this.playerColor = null;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Game state updates
    this.socket.on('gameUpdate', (gameState) => {
      this.updateGameUI(gameState);
      
      // Check if game ended and show results
      if (gameState.outcome) {
        this.showGameResult(gameState.outcome);
      }
    });
    
    // Player color assignment
    this.socket.on('playerColor', (color) => {
      this.playerColor = color;
      console.log('Playing as:', color);
    });
    
    // Successfully joined game
    this.socket.on('joinedGame', (data) => {
      this.gameId = data.gameId;
      console.log('Joined game:', data.gameId);
    });
    
    // Chat messages
    this.socket.on('chatMessage', (data) => {
      this.displayChatMessage(data.sender, data.message);
    });
    
    // Errors
    this.socket.on('error', (error) => {
      console.error('Game error:', error);
    });
  }
  
  // Join a game with ELO tracking
  joinRankedGame(userId, gameId = null) {
    this.userId = userId;
    this.socket.emit('joinGame', { gameId, userId });
  }
  
  // Join a game as guest
  joinGuestGame(gameId = null) {
    this.socket.emit('joinGame', { gameId });
  }
  
  // Make a move
  makeMove(from, to, promotion = null) {
    const move = { from, to };
    if (promotion) move.promotion = promotion;
    
    this.socket.emit('move', move);
  }
  
  // Send chat message
  sendChatMessage(message) {
    this.socket.emit('chat', message);
  }
  
  // Update game UI (implement based on your frontend framework)
  updateGameUI(gameState) {
    // Update chessboard
    // Update timer displays
    // Update player information
    // Update move history
  }
  
  // Show game result
  showGameResult(outcome) {
    const winner = outcome.winner === 'draw' ? 'Draw' : `${outcome.winner} wins`;
    console.log(`Game over: ${winner} - ${outcome.reason}`);
    
    // If this was a ranked game, fetch updated user stats
    if (this.userId) {
      this.fetchUpdatedStats();
    }
  }
  
  // Fetch updated user statistics after game
  async fetchUpdatedStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userStats = await response.json();
      
      // Update UI with new ELO and game statistics
      this.updateUserStatsUI(userStats);
    } catch (error) {
      console.error('Failed to fetch updated stats:', error);
    }
  }
  
  updateUserStatsUI(stats) {
    // Update ELO display
    // Update win/loss record
    // Update games played
  }
}

// Usage example
const game = new ChessGameClient();

// For registered users
const userData = JSON.parse(localStorage.getItem('user'));
if (userData) {
  game.joinRankedGame(userData.id);
} else {
  // For guest users
  game.joinGuestGame();
}
```

### ELO System Integration

```javascript
// Display user stats component
function UserStatsDisplay({ userId }) {
  const [userStats, setUserStats] = useState(null);
  
  useEffect(() => {
    async function fetchStats() {
      const response = await fetch(`/users/${userId}`);
      const stats = await response.json();
      setUserStats(stats);
    }
    
    fetchStats();
  }, [userId]);
  
  if (!userStats) return <div>Loading...</div>;
  
  return (
    <div className="user-stats">
      <h3>{userStats.username}</h3>
      <div>ELO Rating: {userStats.elo}</div>
      <div>Games Played: {userStats.gamesPlayed}</div>
      <div>Wins: {userStats.gamesWon}</div>
      <div>Losses: {userStats.gamesLost}</div>
      <div>Draws: {userStats.gamesDraw}</div>
      <div>Win Rate: {((userStats.gamesWon / userStats.gamesPlayed) * 100).toFixed(1)}%</div>
    </div>
  );
}

// Leaderboard component
function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  
  useEffect(() => {
    async function fetchLeaderboard() {
      const response = await fetch('/users/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    }
    
    fetchLeaderboard();
  }, []);
  
  return (
    <div className="leaderboard">
      <h2>Top Players</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>ELO</th>
            <th>Games</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.username}</td>
              <td>{player.elo}</td>
              <td>{player.gamesPlayed}</td>
              <td>{((player.gamesWon / player.gamesPlayed) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Error Handling

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found (user/resource doesn't exist)
- **409**: Conflict (username/email already exists)
- **500**: Internal Server Error

### Example Error Responses

```typescript
// Registration with existing username
{
  "error": "Username already exists"
}

// Invalid login credentials
{
  "message": "Unauthorized",
  "statusCode": 401
}

// Invalid move in chess game
{
  "error": "Invalid move."
}
```

## Rate Limiting & Security

- All endpoints are protected against common attacks
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Database connections use SSL in production
- Input validation on all endpoints