const socket = io();

// Function to get sessionId from URL
function getSessionId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('sessionId');
}

const sessionId = getSessionId();

if (!sessionId) {
    alert('No session ID found.');
    window.location.href = '/';
}

// Elements
const timerElement = document.getElementById('timer');
const playersList = document.getElementById('playersList');
const gameImage = document.getElementById('gameImage');
const playAgainBtn = document.getElementById('playAgainBtn');

let isAdmin = false;
let gameStartTime = null;
let gameDuration = 300; // 5 minutes in seconds
let timerInterval = null;

// Join game session
console.log(`Joining game session: ${sessionId}`);
socket.emit('joinGame', { sessionId });

// Listen for game start
socket.on('gameStarting', ({ startTime, duration }) => {
    console.log('Game starting!');
    gameStartTime = startTime || Date.now();
    gameDuration = duration || 300;
    startTimer();
});

// Start the timer
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - gameStartTime) / 1000);
        const remainingSeconds = Math.max(0, gameDuration - elapsedSeconds);

        // Update timer display
        timerElement.textContent = `Time Remaining: ${remainingSeconds}s`;

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            socket.emit('timeUp', { sessionId });
        }
    }, 1000);
}

// Handle players list
socket.on('updatePlayerList', (players) => {
    if (!playersList) return;
    
    playersList.innerHTML = '';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <img src="${player.avatarUrl || '/images/default-avatar.png'}" 
                 alt="${player.username}" 
                 class="avatar">
            <div>
                <div>${player.username}</div>
                <div>Score: ${player.score || 0}</div>
            </div>
        `;
        playersList.appendChild(playerDiv);
    });
});

// Game image click handling
if (gameImage) {
    gameImage.addEventListener('click', (event) => {
        const rect = gameImage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        console.log(`Click at: ${x.toFixed(2)}%, ${y.toFixed(2)}%`);
        socket.emit('imageClick', {
            sessionId,
            x,
            y
        });
    });
}

// Handle character found
socket.on('characterFound', ({ username, character }) => {
    alert(`${username} found ${character}!`);
});

// Handle game over
socket.on('gameOver', (results) => {
    clearInterval(timerInterval);
    
    if (results) {
        const resultsMessage = results.map(player => 
            `${player.username}: ${player.score} points`
        ).join('\n');
        alert(`Game Over!\n\nFinal Scores:\n${resultsMessage}`);
    } else {
        alert('Game Over!');
    }
    
    if (playAgainBtn && isAdmin) {
        playAgainBtn.style.display = 'block';
    }
});

// Play Again Button
if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
        if (isAdmin) {
            socket.emit('playAgain', { sessionId });
            playAgainBtn.style.display = 'none';
        }
    });
}

// Set admin status
socket.on('setAsAdmin', () => {
    isAdmin = true;
    console.log('You are now the admin');
});