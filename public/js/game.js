if (!socket) { const socket = io(); }

function startGame(button) {
    button.disabled = true;

    //let gameSession = clientGameSession.startGame();
    if (gameShortId) {
        const startedAt = Date.now();

        socket.emit('game.start', gameShortId, { startedAt: startedAt});

        gameSession.start(startedAt);

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
    
    socket.emit('player.status', gameShortId, gameSession.playerlist.currentPlayer.playerId, 'ready');
}

function copyGameLinkToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
}

document.addEventListener('DOMContentLoaded', function () {

    // Once all elements are loaded, join the game session to receive any updates from hereon.
    socket.emit('player.join', gameShortId, gameSession.playerlist.currentPlayer);

    // Initialize player list
    const playerListElement = document.getElementById('player-list');
    const playerListComponent = new PlayerListComponent(playerListElement);
    playerListComponent.init(gameSession.playerlist);

    // Initialize game board
    const gameBoardElement = document.getElementById('game-board');
    const gameBoardComponent = new GameBoardComponent(gameBoardElement);
    gameBoardComponent.init(gameSession);

    // Initialize timer
    const timerComponent = new TimerComponent();
    timerComponent.init(gameSession);

    /*socket.on('game.started', (data) => {
        console.log('[socket: game.started] Game sessoin started', gameShortId);
        gameSession.start(data.startedAt);
    });
    socket.on('game.completed', (data) => {
        console.log('[socket: game.completed] Game session completed', gameShortId);
        gameSession.complete(data.endedAt);
    });*/
    socket.on('game.updated', (data) => {
        const { property, newValue, oldValue } = data;
        console.log('[socket: game.session.updated] Received event from room:', gameShortId, data);
        Reflect.set(gameSession, property, newValue);
    });

    gameSession.subscribe('status',(newStatus) => {
        const gameSessionStatusElement = document.getElementById('game-session-status');
        gameSessionStatusElement.textContent = newStatus;
        gameSessionStatusElement.className = 'badge ' +
            (
                newStatus === 'waiting' ? 'bg-secondary' :
                newStatus === 'playing' ? 'bg-primary' :
                newStatus === 'completed' ? 'bg-success' : 'bg-info'
            );
    })

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
        console.log('[socket: playerlist.updated] New player list', newPlayerList);
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
});
