// script.js

// Connect to the server
const socket = io();

// Get references to HTML elements
const loginDiv = document.getElementById('login');
const gameDiv = document.getElementById('game');
const joinBtn = document.getElementById('joinBtn');
const usernameInput = document.getElementById('usernameInput');
const gameImage = document.getElementById('gameImage');
const timeLeftSpan = document.getElementById('timeLeft');
const playersList = document.getElementById('playersList');

// Handle the Join Game button click
joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    // Hide login and show game
    loginDiv.style.display = 'none';
    gameDiv.style.display = 'block';

    // Emit joinGame event to the server
    socket.emit('joinGame', { username });
  } else {
    alert('Please enter a nickname.');
  }
});

// Handle the playerList event from the server
socket.on('playerList', (players) => {
    // Clear the current list
    playersList.innerHTML = '';
  
    // Add each player to the list
    for (let id in players) {
      const player = players[id];
      const listItem = document.createElement('li');
      listItem.textContent = `${player.username}: ${player.score} points`;
      playersList.appendChild(listItem);
    }
  });
  
  // script.js

// ...existing code...

// Handle the timerUpdate event
socket.on('timerUpdate', (timeLeft) => {
  timeLeftSpan.textContent = timeLeft;
});

// Handle the gameOver event
socket.on('gameOver', () => {
  alert('Game over!');
  // Optionally, implement logic to reset the game
});
// script.js

// ...existing code...

// Handle clicks on the game image
gameImage.addEventListener('click', (event) => {
    // Get the click coordinates relative to the image
    const rect = gameImage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const y = ((event.clientY - rect.top) / rect.height) * 100;
  
    // Emit the imageClick event to the server
    socket.emit('imageClick', { x, y });
  });
// script.js

// ...existing code...

// Handle the characterFound event
socket.on('characterFound', ({ username, character, players }) => {
    alert(`${username} found ${character}!`);
  
    // Update the scoreboard
    playersList.innerHTML = '';
    for (let id in players) {
      const player = players[id];
      const listItem = document.createElement('li');
      listItem.textContent = `${player.username}: ${player.score} points`;
      playersList.appendChild(listItem);
    }
  });
  