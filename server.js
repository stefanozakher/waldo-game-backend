// server.js

// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express application
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const players = {}; // Object to keep track of connected players
let timeLeft = 300; // Game duration in seconds (5 minutes)
let timerInterval; // Variable to store the timer interval

const characterData = require('./characterData');

// Function to start the game timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    io.emit('timerUpdate', timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      io.emit('gameOver');
    }
  }, 1000); // Update every second
}

// Function to check if a character is found
function checkCharacterFound(x, y) {
  for (let character of characterData) {
    if (
      x >= character.x &&
      x <= character.x + character.width &&
      y >= character.y &&
      y <= character.y + character.height
    ) {
      return character;
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinGame', ({ username }) => {
    players[socket.id] = {
      username,
      score: 0,
    };

    // Notify all players of the new player
    io.emit('playerList', players);

    if (Object.keys(players).length === 1) {
      // Start the timer when the first player joins
      startTimer();
    }
  });

  socket.on('imageClick', ({ x, y }) => {
    const character = checkCharacterFound(x, y);

    if (character && !character.found && players[socket.id]) {
      character.found = true;
      players[socket.id].score += character.points;

      // Notify all players that a character has been found
      io.emit('characterFound', {
        username: players[socket.id].username,
        character: character.name,
        players,
      });

      // Check if all characters are found
      if (characterData.every(char => char.found)) {
        clearInterval(timerInterval);
        io.emit('gameOver');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove the player from the list
    delete players[socket.id];

    // Notify all players of the updated player list
    io.emit('playerList', players);

    // If no players left, reset the game
    if (Object.keys(players).length === 0) {
      clearInterval(timerInterval);
      timeLeft = 300;
      characterData.forEach(char => char.found = false);
    }
  });
});