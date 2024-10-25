const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const players = {}; // Object to keep track of connected players
let timeLeft = 300; // Game duration in seconds (5 minutes)
let timerInterval; // Variable to store the timer interval
let gameInProgress = false; // Flag to track if a game is in progress

const characterData = require('./characterData');

// Function to start the game timer
function startTimer() {
  clearInterval(timerInterval); // Clear any existing timer
  timeLeft = 300; // Reset the timer
  gameInProgress = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    io.emit('timerUpdate', timeLeft);

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000); // Update every second
}

// Function to end the game
function endGame() {
    clearInterval(timerInterval);
    gameInProgress = false;
    updateScores();
    io.emit('gameOver');
  }

// Function to reset the game
function resetGame() {
    characterData.forEach(char => char.found = false);
    io.emit('playerList', players);
  }
  
  // Function to update scores after a game
  function updateScores() {
    Object.values(players).forEach(player => {
      player.totalScore = (player.totalScore || 0) + player.score;
      player.score = 0;
    });
    io.emit('playerList', players);
  }
  
  // Function to restart the game
  function restartGame() {
    updateScores();
    resetGame();
    startTimer();
    io.emit('gameRestart');
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
      totalScore: 0,
    };

    // Notify all players of the new player
    io.emit('playerList', players);

    if (!gameInProgress && Object.keys(players).length === 1) {
      // Start the timer when the first player joins and no game is in progress
      startTimer();
    }
  });

  socket.on('imageClick', ({ x, y }) => {
    if (!gameInProgress) return; // Ignore clicks if the game is not in progress

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
        endGame();
      }
    }
  });

  socket.on('playAgain', () => {
    if (!gameInProgress) {
      restartGame();
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
      endGame();
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});