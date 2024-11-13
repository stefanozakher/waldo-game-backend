class ClientGameSessionController {
    constructor(socket, gameShortId, gameSession) {
        this.socket = socket;
        this.gameShortId = gameShortId;
        this.gameSession = gameSession;

        //this.players = new ClientPlayerListController(socket, this);
        this.playerlist = new PlayerList(gameShortId);
        this.chat = new ClientChatController(socket, this);

        this.player = this.initializePlayer();
    }
    // Getters
    getSession() {
        return this.gameSession;
    }
    getGameShortId() {
        return this.gameShortId;
    }
    getPlayerList() {
        return this.playerlist;
    }
    getPlayers(){
        return this.getPlayerList().getPlayers();
    }
    getPlayer(){
        return this.player;
    }
    getChat() {
        return this.chat;
    }
    //
    initializePlayer() {
        // waldoPlayer = {
        //     playerId: "1obamrsom",
        //     playerName: "Player rsom"
        // };
        let waldoPlayer = JSON.parse(localStorage.getItem('waldoPlayer')) || null;
        if (!waldoPlayer) {
            let newPlayerId = Math.random().toString(36).substring(2, 11);
            waldoPlayer = {
                playerId: newPlayerId,
                playerName: `Player ${newPlayerId.slice(-4)}`
            };
            localStorage.setItem('waldoPlayer', JSON.stringify(waldoPlayer));
            console.log('Generated new player ID:', waldoPlayer.playerId);
        } else {
            console.log('Retrieved existing player ID:', waldoPlayer.playerId, 'and name:', waldoPlayer.playerName);
        }
        return new Player(waldoPlayer.playerId, waldoPlayer.playerName);;
    }
    // Methods
    startGame(started_at) {
        console.log('startGame', this.gameSession.status);
        if (this.getSession().status === 'waiting') {
            this.getSession().status = 'playing';
            this.getSession().started_at = started_at;
            this.startTimer();
        }
        this.updateGameUI();
        return this.gameSession;
    }
    endGame(ended_at) {
        console.log('endGame', this.gameSession.status);
        if (this.getSession().status !== 'completed') {
            this.getSession().status = 'completed';
            this.getSession().ended_at = ended_at;
        }
        this.updateGameUI();
        return this.gameSession;
    }
    updateGameUI() {
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = this.getSession().status;
        }
    }
    startTimer() {
        const timerElement = document.getElementById('gameSessionTimer');
        if (timerElement && this.getSession().started_at) {
            const endTime = this.getSession().started_at + this.getSession().playtime_in_seconds * 1000 + 1000;
            const timerInterval = window.setInterval(() => {
                const elapsed = Math.floor((endTime - Date.now()) / 1000);
                
                if (elapsed <= 0) {
                    clearInterval(timerInterval);
                    timerElement.textContent = '0:00';
                    this.endGame(Date.now());
                    return;
                }
                
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }
    }
    // Player methods
    setPlayerReady() {
        //this.socket.emit('playerReady', this.gameShortId, this.player.playerId);
        this.getPlayerList().updatePlayerStatus(this.getPlayer().playerId, 'ready');
    }
    setPlayerPlaying() {
        this.getPlayerList().updatePlayerStatus(this.getPlayer().playerId, 'playing');
    }
    joinGame() {
        this.getPlayerList().addPlayer(this.getPlayer());
    }
    leaveGame() {
        this.socket.emit('leaveGame', this.gameShortId, this.getPlayer().playerId);
        this.getPlayerList().leavePlayer(this.getPlayer().playerId);
    }
    areAllPlayersReady() {
        const players = this.getPlayers();
        if (players.length === 0) return false;
        // Check if all players are ready or disconnected
        return players.every(player => ( player.status === 'ready' || player.status === 'disconnected'));
    }
    //
    updatePlayerlistUI() {
        const playersList = document.getElementById('playerlist');
        const templateContent = document.getElementById('player-list-item').innerHTML;
        
        // Compile and render the template
        const template = Handlebars.compile(templateContent);
        playersList.innerHTML = template({
            players: this.getPlayers(),
            currentPlayerId: this.getPlayer().playerId,
            gameSession: this.getSession()
        });
        this.updateStartGameButton();
    }
    updateStartGameButton() {
        const startGameContainer = document.getElementById('startGameContainer');
        if (this.areAllPlayersReady()) {
            startGameContainer.style.display = 'block';
        } else {
            startGameContainer.style.display = 'none';
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientGameSessionController;
} 