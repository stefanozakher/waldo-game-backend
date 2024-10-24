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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinGame', ({ username }) => {
    players[socket.id] = {
      username,
      score: 0,
    };
  

    // Notify all players of the new player
    io.emit('playerList', players);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove the player from the list
    delete players[socket.id];

    // Notify all players of the updated player list
    io.emit('playerList', players);
  });
});
// server.js

// ...existing code...

let timeLeft = 300; // Game duration in seconds (5 minutes)

// Function to start the game timer
function startTimer() {
  const timer = setInterval(() => {
    timeLeft--;
    io.emit('timerUpdate', timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      io.emit('gameOver');
    }
  }, 1000); // Update every second
}

// Start the timer when the first player joins
io.on('connection', (socket) => {
  // ...existing code...

  socket.on('joinGame', ({ username }) => {
    // ...existing code...

    if (Object.keys(players).length === 1) {
      // Start the timer
      startTimer();
    }
  });

  // ...existing code...
});

// server.js

// ...existing code...

const characterData = require('./characterData');

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

  socket.on('imageClick', ({ x, y }) => {
    const character = checkCharacterFound(x, y);

    if (character && !character.found) {
      character.found = true;
      players[socket.id].score += character.points;

      // Notify all players that a character has been found
      io.emit('characterFound', {
        username: players[socket.id].username,
        character: character.name,
        players,
      });
    }
  });


});
