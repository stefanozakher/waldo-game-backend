if (!socket) { const socket = io(); }

const clientGameSession = new ClientGameSessionController(socket, gameShortId, gameSession);

socket.on('gameStarted', (data) => { if (data.gameShortId === gameShortId) clientGameSession.startGame(data.started_at); });
socket.on('gameEnded', (data) => { if (data.gameShortId === gameShortId) clientGameSession.endGame(data.ended_at); });

function startGame() {
    let startTime = Date.now();
    socket.emit('startGame', gameShortId, { started_at: startTime });
    clientGameSession.startGame(startTime);
}

function setPlayerReady(playerId) {
    clientGameSession.getPlayerListController().setPlayerReady(playerId);
}

// Handle late joiners
if (clientGameSession.gameSession.status === 'playing') {
    clientGameSession.updateGameUI();
    clientGameSession.startTimer();
}

window.addEventListener('beforeunload', () => {
    clientGameSession.getPlayerListController().leaveGame();
    socket.disconnect();
});

// document.addEventListener('visibilitychange', () => {
//     if (document.hidden) {
//         clientPlayerList.leaveGame();
//         socket.disconnect();
//     }
// });