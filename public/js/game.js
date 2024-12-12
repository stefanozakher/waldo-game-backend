if (!socket) { const socket = io(); }

var clientGameSession = null;
var clientGameLevels = null;

function startGame() {
    let gameSession = clientGameSession.startGame(Date.now());
    if (gameSession) {
        socket.emit('startGame', gameShortId, { started_at: gameSession.started_at });
        clientGameLevels.loadCurrentLevel();
    }
}

function setPlayerReady(button) {
    clientGameSession.setPlayerReady(button);

    button.disabled = true;
    button.textContent = 'Ready!';

    socket.emit('playerReady', gameShortId, clientGameSession.getPlayer().playerId);
}

function copyGameLinkToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
}

document.addEventListener('DOMContentLoaded', function () {

    clientGameSession = new ClientGameSessionController(socket, gameShortId, gameSession);
    clientGameLevels = new ClientGameLevelsController(gameShortId, gameSession);

    socket.on('gameStarted', (data) => { if (data.gameShortId === gameShortId) clientGameSession.startGame(data.started_at); });
    socket.on('gameEnded', (data) => { if (data.gameShortId === gameShortId) clientGameSession.endGame(data.ended_at); });

    // Chat
    socket.on('chatMessage', (data) => { console.log('Received chat message:', data); clientGameSession.getChat().addMessage(data); });
    socket.emit('loadChatMessages', gameShortId, (messages) => {
        console.log('Received chat messages:', messages);
        clientGameSession.getChat().loadMessages(messages);
    });

    socket.emit('joinGame', gameShortId, clientGameSession.getPlayer().toJSON());
    socket.on('syncPlayerList', (state) => {
        console.log('Received player list update:', state);
        clientGameSession.getPlayerList().sync(state.players);
    });

    // Handle late joiners
    if (clientGameSession.getSession().status === 'playing') {
        clientGameSession.setPlayerPlaying();
        clientGameSession.joinGame();
        clientGameSession.updateGameUI();
        clientGameSession.startTimer();

        // Send player status to server
        socket.emit('playerStatus', gameShortId, clientGameSession.getPlayer().playerId, 'playing');

        // Load current level
        clientGameLevels.loadCurrentLevel();
    }
});

// window.addEventListener('beforeunload', () => {
//     clientGameSession.getPlayerList().leaveGame();
//     socket.disconnect();
// });

// document.addEventListener('visibilitychange', () => {
//     if (document.hidden) {
//         clientPlayerList.leaveGame();
//         socket.disconnect();
//     }
// });
