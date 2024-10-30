const socket = io();

// Function to get sessionId from URL
function getSessionId() {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts[2]; // Assuming the URL is /game/:sessionId
}

const sessionId = getSessionId();

if (!sessionId) {
  alert('No session ID found.');
  console.log('No session ID found in the URL. Redirecting to home page.');
  window.location.href = '/';
}

// Prompt the player for a username and avatar
let username;
while (!username) {
  username = prompt('Enter your nickname:').trim();
}
let avatarUrl = prompt('Enter your avatar URL (optional):').trim() || 'default-avatar.png';
console.log(`Player "${username}" is joining session ${sessionId} with avatar "${avatarUrl}"`);

// Emit event to join the lobby with sessionId
console.log(`Emitting joinSession event for session ${sessionId}`);
socket.emit('joinSession', { sessionId, username, avatarUrl });

// Player list management
const playerList = document.getElementById('playerList');
socket.on('updatePlayerList', (players) => {
  playerList.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.innerHTML = `
      <img src="${player.avatarUrl}" alt="Avatar" class="avatar mr-2">
      <span>
        ${player.username}
        ${player.isAdmin ? '<br><small class="admin-label">Admin</small>' : ''}
      </span>
    `;
    playerList.appendChild(li);
  });
  console.log(`Player list updated for session ${sessionId}:`, players);
});

// Chat functionality
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    console.log(`Sending chat message from "${username}" in session ${sessionId}: ${message}`);
    socket.emit('chatMessage', { sessionId, username, message });
    chatInput.value = '';
  }
});

// Listen for incoming chat messages
socket.on('chatMessage', ({ username, message }) => {
  console.log(`Received chat message from "${username}" in session ${sessionId}: ${message}`);
  const p = document.createElement('p');
  p.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatWindow.appendChild(p);
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// Listen for playerJoined event
socket.on('playerJoined', (player) => {
  console.log(`Player "${player.username}" has joined the lobby of session ${sessionId}`);
  const p = document.createElement('p');
  p.innerHTML = `<em>${player.username} has joined the lobby.</em>`;
  chatWindow.appendChild(p);
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// Listen for playerLeft event
socket.on('playerLeft', (player) => {
  console.log(`Player "${player.username}" has left the lobby of session ${sessionId}`);
  const p = document.createElement('p');
  p.innerHTML = `<em>${player.username} has left the lobby.</em>`;
  chatWindow.appendChild(p);
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// Listen for error messages
socket.on('errorMessage', (message) => {
  console.error(`Error in session ${sessionId}: ${message}`);
  alert(message);
  window.location.href = '/';
});

// Listen for admin assignment
socket.on('setAsAdmin', () => {
  console.log(`Socket ${socket.id} has been assigned as admin for session ${sessionId}`);
  isAdmin = true;
  enableGameSettings();
});

// Handle game settings form submission (only for admin)
const gameSettingsForm = document.getElementById('gameSettingsForm');
const timerInput = document.getElementById('timerInput');
const roundsInput = document.getElementById('roundsInput');
const startGameBtn = document.getElementById('startGameBtn');
const characterCheckboxes = [
  document.getElementById('waldoCheckbox'),
  document.getElementById('robberCheckbox'),
  document.getElementById('magicianCheckbox'),
  document.getElementById('sisterCheckbox'),
];

// Disable settings for non-admins by default
disableGameSettings();

let isAdmin = false;

// Game settings form submission
gameSettingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!isAdmin) {
    console.log(`Non-admin attempted to start the game in session ${sessionId}`);
    return;
  }

  const timer = parseInt(timerInput.value);
  const rounds = parseInt(roundsInput.value) || 1;
  const characters = [];

  characterCheckboxes.forEach(checkbox => {
    if (checkbox.checked) characters.push(checkbox.value);
  });

  console.log(`Admin "${username}" is starting the game in session ${sessionId} with settings:`, { timer, rounds, characters });

  // Emit event to start the game with settings
  socket.emit('startGame', { sessionId, settings: { timer, rounds, characters } });
});

// Redirect to game page when the game starts
socket.on('gameStarting', () => {
  console.log(`Game is starting for session ${sessionId}. Redirecting to game page.`);
  window.location.href = `/game.html?sessionId=${sessionId}`;
});

// Utility functions to enable/disable game settings
function disableGameSettings() {
  timerInput.disabled = true;
  roundsInput.disabled = true;
  characterCheckboxes.forEach(checkbox => checkbox.disabled = true);
  startGameBtn.disabled = true;
  console.log(`Game settings disabled for session ${sessionId}`);
}

function enableGameSettings() {
  timerInput.disabled = false;
  roundsInput.disabled = false;
  characterCheckboxes.forEach(checkbox => checkbox.disabled = false);
  startGameBtn.disabled = false;
  console.log(`Game settings enabled for session ${sessionId}`);
} 