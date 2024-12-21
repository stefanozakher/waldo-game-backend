if (!socket) { const socket = io(); }

var clientGameSession = null;
var clientGameLevels = null;

function startGame(button) {
    button.disabled = true;

    //let gameSession = clientGameSession.startGame();
    if (gameShortId) {
        socket.emit('game.start', gameShortId, { startedAt: Date.now() });

        button.textContent = 'Game started!';
    } else {
        button.disabled = false;
        button.textContent = 'Start Game';
    }
}

function setPlayerReady(button) {
    button.disabled = true;
    button.textContent = 'Ready!';

    gameSession.playerlist.currentPlayer.status = 'ready';
    
    socket.emit('playerReady', gameShortId, gameSession.playerlist.currentPlayer.playerId);
}

function copyGameLinkToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
}

document.addEventListener('DOMContentLoaded', function () {

    // Initialize player list
    const playerListElement = document.getElementById('player-list');
    const playerListComponent = new PlayerListComponent(playerListElement);
    playerListComponent.init(gameSession.playerlist);

    // Initialize game board
    const gameBoardElement = document.getElementById('game-board');
    const gameBoardComponent = new GameBoardComponent(gameBoardElement);
    gameBoardComponent.init(gameSession);

    clientGameSession = new ClientGameSessionController(socket, gameShortId, gameSession);

    socket.on('game.started', (data) => {
        console.log('[socket event] game.started: Received event from room:', gameShortId);
        clientGameSession.startGame(data.startedAt);

        gameSession.startGameSession(data.startedAt);
    });
    socket.on('game.ended', (data) => {
        console.log('[socket: game.ended] Received event from room:', gameShortId);
        clientGameSession.endGame(data.endedAt);

        gameSession.endGameSession(data.endedAt);
    });
    socket.on('game.session.updated', (data) => {
        const { property, newValue, oldValue } = data;
        console.log('[socket: game.session.updated] Received event from room:', gameShortId, data);
        gameSession[property] = newValue;
        // gameSession.status = data.status;
    });

    // Chat
    // socket.on('chatMessage', (data) => {
    //     console.log('Received chat message:', data);
    //     clientGameSession.getChat().addMessage(data);
    // });
    // socket.emit('loadChatMessages', gameShortId, (messages) => {
    //     console.log('Received chat messages:', messages);
    //     clientGameSession.getChat().loadMessages(messages);
    // });

    socket.on('playerlist.updated', (newPlayerList) => {
        console.log('[socket event] playerlist.updated: Received event from room:', gameShortId);
        gameSession.playerlist.sync(newPlayerList);
    });

    window.addEventListener('beforeunload', () => {
        socket.emit('player.leave', gameShortId, gameSession.playerlist.currentPlayer.playerId);
        socket.disconnect();
    });

    // Handle late joiners
    // if (clientGameSession.getSession().status === 'playing') {
    //     clientGameSession.setPlayerPlaying();
    //     clientGameSession.joinGame();
    //     clientGameSession.updateGameUI();
    //     clientGameSession.startTimer();

    //     // Send player status to server
    //     socket.emit('playerStatus', gameShortId, clientGameSession.getPlayer().playerId, 'playing');
    // }

    // Once all elements are loaded, join the game.
    socket.emit('player.join', gameShortId, gameSession.playerlist.currentPlayer);
    socket.emit('game.update.status', gameShortId, 'waiting');
});
