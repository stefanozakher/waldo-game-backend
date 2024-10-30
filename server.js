const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Data structure to hold all game sessions
const gameSessions = {};

// Serve lobby.html for a specific game session
app.get('/game/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  console.log(`Serving lobby for session: ${sessionId}`);
  res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});

// Handle creating a new game session
app.get('/create-session', (req, res) => {
  const sessionId = uuidv4();
  console.log(`Creating new session with ID: ${sessionId}`);
  // Initialize session data
  gameSessions[sessionId] = {
    players: [],
    adminId: null,
    gameInProgress: false,
    gameSettings: {},
    characterData: require('./characterData'), // Initial character data
    timerInterval: null,
    timeLeft: 300,
  };
  res.json({ sessionId, link: `/game/${sessionId}` });
});

// Object to keep track of disconnect timeouts
const disconnectTimers = {};

// Function to schedule session cleanup
function scheduleSessionCleanup(sessionId) {
  const session = gameSessions[sessionId];
  if (session.cleanupTimeout) {
    clearTimeout(session.cleanupTimeout);
  }
  session.cleanupTimeout = setTimeout(() => {
    if (session.players.length === 0) {
      delete gameSessions[sessionId];
      console.log(`Session ${sessionId} deleted due to inactivity.`);
    }
  }, 30 * 60 * 1000); // 30 minutes
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.join('gameRoom1');

  // Handle joining a specific game session
  socket.on('joinSession', ({ sessionId, username, avatarUrl }) => {
    console.log(`Received joinSession event from socket ${socket.id} for session ${sessionId} with username "${username}" and avatar "${avatarUrl}"`);
    const session = gameSessions[sessionId];
    if (!session) {
      console.log(`Invalid session ID: ${sessionId}`);
      socket.emit('errorMessage', 'Invalid session ID.');
      return;
    }

    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined room ${sessionId}`);

    const player = {
      id: socket.id,
      username,
      avatarUrl,
      score: 0,
      isAdmin: false,
    };
    session.players.push(player);
    console.log(`Player "${username}" added to session ${sessionId}`);

    // Assign admin if none exists
    if (!session.adminId) {
      session.adminId = socket.id;
      player.isAdmin = true;
      socket.emit('setAsAdmin');
      console.log(`Player "${username}" assigned as admin for session ${sessionId}`);
    }

    // Notify all players of the updated player list
    io.to(sessionId).emit('updatePlayerList', session.players);
    console.log(`Updated player list for session ${sessionId}:`, session.players);

    // Notify chat about new player
    socket.broadcast.to(sessionId).emit('playerJoined', player);
    console.log(`Player "${username}" has joined the lobby of session ${sessionId}`);
  });

  // Handle joining the game after game settings are sent
  socket.on('joinGame', ({ sessionId, username, avatarUrl }) => {
    console.log(`Received joinGame event from socket ${socket.id} for session ${sessionId}`);
    const session = gameSessions[sessionId];
    if (!session) {
      console.log(`Invalid session ID for joinGame: ${sessionId}`);
      socket.emit('errorMessage', 'Invalid session ID.');
      return;
    }

    socket.join(sessionId);
    console.log(`Socket ${socket.id} has joined the game in session ${sessionId}`);

    // Check if the player already exists in the session
    let player = session.players.find(p => p.username === username);

    if (player) {
      // Update player's socket ID
      player.id = socket.id;
      console.log(`Player "${username}" reconnected to session ${sessionId}`);
    } else {
      // Add new player to the session
      player = {
        id: socket.id,
        username: username,
        avatarUrl: avatarUrl || '/default-avatar.png',
        score: 0,
        isAdmin: false,
      };
      session.players.push(player);
      console.log(`Player "${username}" added to session ${sessionId}`);
    }

    // If there is no admin, assign this player as admin
    if (!session.adminId) {
      session.adminId = socket.id;
      player.isAdmin = true;
      socket.emit('setAsAdmin');
      console.log(`Player "${username}" assigned as admin for session ${sessionId}`);
    }

    // Update player list for all clients
    io.to(sessionId).emit('updatePlayerList', session.players);
    console.log(`Updated player list for session ${sessionId}:`, session.players);
  });

  // Handle chat messages within a session
  socket.on('chatMessage', ({ sessionId, username, message }) => {
    console.log(`Chat message from "${username}" in session ${sessionId}: ${message}`);
    io.to(sessionId).emit('chatMessage', { username, message });
  });

  // Handle game start (only admin can start the game)
  socket.on('startGame', ({ sessionId, settings }) => {
    const session = gameSessions[sessionId];
    if (!session) return;
    if (socket.id !== session.adminId) return;
    if (session.gameInProgress) return;

    session.gameSettings = settings;

    // Update characterData based on selected characters
    session.characterData = require('./characterData').filter(char => settings.characters.includes(char.name));

    resetGame(sessionId);

    // Set the game to in progress
    session.gameInProgress = true;

    // Record the game start timestamp and duration
    const gameStartTime = Date.now(); // Unix timestamp in milliseconds
    session.gameStartTime = gameStartTime;
    session.gameDuration = settings.timer || 300; // Default to 300 seconds if not specified

    // Notify all players that the game is starting
    io.to(sessionId).emit('gameStarting', {
      gameStartTime: session.gameStartTime,
      gameDuration: session.gameDuration,
    });

    console.log(`Game started in session ${sessionId} with settings:`, settings);

    // Set a server-side timer to end the game after the duration
    session.gameTimer = setTimeout(() => {
      endGame(sessionId);
    }, session.gameDuration * 1000);
  });

  // Handle image clicks within a session
  socket.on('imageClick', ({ sessionId, x, y }) => {
    console.log(`Received imageClick event from socket ${socket.id} in session ${sessionId} at coordinates (${x}, ${y})`);
    const session = gameSessions[sessionId];
    if (!session) {
      console.log(`Invalid session ID for imageClick: ${sessionId}`);
      return;
    }
    if (!session.gameInProgress) {
      console.log(`Game not in progress for session ${sessionId}. Ignoring imageClick.`);
      return;
    }

    const character = checkCharacterFound(session, x, y);

    if (character && !character.found) {
      character.found = true;
      const player = session.players.find(p => p.id === socket.id);
      if (player) {
        player.score += character.points;
        console.log(`Player "${player.username}" found character "${character.name}" in session ${sessionId}. New score: ${player.score}`);

        // Notify all players that a character has been found
        io.to(sessionId).emit('characterFound', {
          username: player.username,
          character: character.name,
        });
        console.log(`Notified all players in session ${sessionId} that "${player.username}" found "${character.name}"`);

        // Update players' scores
        io.to(sessionId).emit('updatePlayerList', session.players);
        console.log(`Updated player list for session ${sessionId}:`, session.players);

        // Check if all characters are found
        if (session.characterData.every(char => char.found)) {
          console.log(`All characters found in session ${sessionId}. Ending game.`);
          endGame(sessionId);
        }
      } else {
        console.log(`Player with socket ID ${socket.id} not found in session ${sessionId}`);
      }
    } else {
      if (character && character.found) {
        console.log(`Character "${character.name}" in session ${sessionId} has already been found.`);
      } else {
        console.log(`No character found at coordinates (${x}, ${y}) in session ${sessionId}.`);
      }
    }
  });

  // Handle play again (only admin can trigger)
  socket.on('playAgain', ({ sessionId }) => {
    console.log(`Received playAgain event from socket ${socket.id} for session ${sessionId}`);
    const session = gameSessions[sessionId];
    if (!session) {
      console.log(`Invalid session ID for playAgain: ${sessionId}`);
      socket.emit('errorMessage', 'Invalid session ID.');
      return;
    }
    if (socket.id !== session.adminId) {
      console.log(`Socket ${socket.id} is not admin of session ${sessionId} and cannot restart the game.`);
      socket.emit('errorMessage', 'Only admin can restart the game.');
      return;
    }
    if (session.gameInProgress) {
      console.log(`Game already in progress for session ${sessionId}. Cannot restart now.`);
      socket.emit('errorMessage', 'Game is already in progress.');
      return;
    }

    resetGame(sessionId);
    startTimer(sessionId);

    // Notify all players that the game is restarting
    io.to(sessionId).emit('gameRestarting');
    console.log(`Game restarting for session ${sessionId}`);
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Handle cleanup
  });

  // Handle client reconnection (if using Socket.IO's built-in reconnection)
  socket.on('connect', () => {
    if (disconnectTimers[socket.id]) {
      clearTimeout(disconnectTimers[socket.id]);
      delete disconnectTimers[socket.id];
      console.log(`User reconnected before timeout: ${socket.id}`);
    }
  });
});

// Function to end the game
function endGame(sessionId) {
  const session = gameSessions[sessionId];
  if (!session) {
    console.log(`Cannot end game. Session ${sessionId} does not exist.`);
    return;
  }

  // Clear any existing timers
  if (session.gameTimer) {
    clearTimeout(session.gameTimer);
    delete session.gameTimer;
  }

  session.gameInProgress = false;
  session.timeLeft = 0;

  io.to(sessionId).emit('gameOver');
  console.log(`Game ended for session ${sessionId}`);
}

// Function to reset the game
function resetGame(sessionId) {
  const session = gameSessions[sessionId];
  if (!session) {
    console.log(`Cannot reset game. Session ${sessionId} does not exist.`);
    return;
  }

  session.characterData.forEach(char => char.found = false);
  session.players.forEach(player => player.score = 0);
  io.to(sessionId).emit('updatePlayerList', session.players);
  console.log(`Game reset for session ${sessionId}. All player scores set to 0 and characters marked as not found.`);
}

// Function to check if a character is found
function checkCharacterFound(session, x, y) {
  for (let character of session.characterData) {
    if (
      x >= character.x &&
      x <= character.x + character.width &&
      y >= character.y &&
      y <= character.y + character.height
    ) {
      console.log(`Character "${character.name}" found at coordinates (${x}, ${y}) in session ${sessionId}`);
      return character;
    }
  }
  return null;
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});