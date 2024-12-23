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
    button.textContent = '... waiting for others';

    gameSession.playerlist.currentPlayer.status = 'ready';
    socket.emit('player.status', gameShortId, gameSession.playerlist.currentPlayer.playerId, 'ready');
}

function copyGameLinkToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
}

function sendMessage(){
    const messageText = document.getElementById('chat-message-text').value;

    if (messageText.length < 1) return;

    const message = new Message({
        playerId: gameSession.playerlist.currentPlayer.playerId,
        playerName: gameSession.playerlist.currentPlayer.playerName,
        message: document.getElementById('chat-message-text').value,
        timestamp: Date.now()
    });

    gameSession.chat.addMessage(message);
    
    socket.emit('chat.message', gameShortId, message.toJSON());
    
    document.getElementById('chat-message-text').value = '';
}

document.addEventListener('DOMContentLoaded', function () {

    // Once all elements are loaded, join the game session to receive any updates from hereon.
    socket.emit('player.join', gameShortId, gameSession.playerlist.currentPlayer);

    

    // Initialize game board
    const gameBoardElement = document.getElementById('game-board');
    const gameBoardComponent = new GameBoardComponent(gameBoardElement);
    gameBoardComponent.init(gameSession);

    // Initialize player list
    const playerListElement = document.getElementById('player-list');
    const playerListComponent = new PlayerListComponent(playerListElement);
    playerListComponent.init(gameSession.playerlist);

    // Initialize chat
    const chatComponent = new ChatComponent();
    chatComponent.init(gameSession);

    // Initialize timer
    const timerComponent = new TimerComponent();
    timerComponent.init(gameSession);

    socket.on('game.updated', (data) => {
        const { property, newValue, oldValue } = data;
        console.log('[socket: game.updated] Game session updated', gameShortId, data);
        Reflect.set(gameSession, property, newValue);
    });

    /********************************************
     * Render the game session status
     */
    const renderGameSessionStatus = (status) => {
        const gameSessionStatusElement = document.getElementById('game-session-status');
        gameSessionStatusElement.textContent = status;
        gameSessionStatusElement.className = 'badge ' +
            (
                status === 'waiting' ? 'bg-secondary' :
                status === 'playing' ? 'bg-primary' :
                status === 'completed' ? 'bg-success' :
                status === 'timeout' ? 'bg-warning' : 'bg-info' );
    };
    renderGameSessionStatus(gameSession.status);

    gameSession.subscribe('status',(newStatus) => {
        renderGameSessionStatus(newStatus)
    });

    // Chat
    socket.on('chat.message', (data) => {
        console.log('Received chat message:', data);
    //     clientGameSession.getChat().addMessage(data);
    });
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

    if (gameSession.status === 'playing')
        socket.emit('player.status', gameShortId, gameSession.playerlist.currentPlayer.playerId, 'playing');
});
