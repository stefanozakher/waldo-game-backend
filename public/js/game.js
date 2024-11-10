if (!socket) { const socket = io(); }

const clientGameSession = new ClientGameSessionController(socket, gameShortId, gameSession);

socket.on('gameStarted', (data) => { if (data.gameShortId === gameShortId) clientGameSession.startGame(data.started_at); });
socket.on('gameEnded', (data) => { if (data.gameShortId === gameShortId) clientGameSession.endGame(data.ended_at); });

// Chat
socket.on('chatMessage', (data) => { console.log('Received chat message:', data); clientGameSession.getChatController().addMessage(data); });

socket.emit('loadChatMessages', gameShortId, (messages) => {
    console.log('Received chat messages:', messages);
    clientGameSession.chat.loadMessages(messages);
});

function startGame() {
    let startTime = Date.now();
    socket.emit('startGame', gameShortId, { started_at: startTime });
    clientGameSession.startGame(startTime);
}

function setPlayerReady(playerId) {
    clientGameSession.getPlayerListController().setPlayerReady(playerId);
}

function copyGameLinkToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
}

// Handle late joiners
if (clientGameSession.gameSession.status === 'playing') {
    clientGameSession.getPlayerListController().setPlayerPlaying();
    clientGameSession.getPlayerListController().joinGame();
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