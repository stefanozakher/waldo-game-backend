class ClientPlayerListController {
    constructor(io, gameShortId) {
        this.io = io;
        this.gameShortId = gameShortId;
        this.playerList = new PlayerList(gameShortId);

        let _player = this.initializePlayer();
        this.player = new Player(_player.playerId, _player.playerName);
        
        this.initializeSocketListeners();
        this.joinGame();

        console.log('Game page initialized for game:', gameShortId, 'with player ID:', this.player.playerId);
    }

    initializePlayer() {
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
        return waldoPlayer;
    }

    updatePlayerListUI(players) {
        const playersList = document.getElementById('playersList');
        const templateContent = document.getElementById('player-list-item').innerHTML;
        
        // Compile and render the template
        const template = Handlebars.compile(templateContent);
        playersList.innerHTML = template({
            players: players,
            currentPlayerId: this.player.playerId
        });
    }

    checkAllPlayersReady() {
        const players = this.playerList.getPlayers();
        if (players.length === 0) return false;
        return players.every(player => player.status === 'ready');
    }

    updateStartGameButton() {
        const startGameContainer = document.getElementById('startGameContainer');
        if (this.checkAllPlayersReady()) {
            console.log('All players ready, showing start button');
            startGameContainer.style.display = 'block';
        } else {
            console.log('Not all players ready, hiding start button');
            startGameContainer.style.display = 'none';
        }
    }

    initializeSocketListeners() {
        socket.on('syncPlayerList', (playerListData) => {
            console.log('Received player list update:', playerListData);
            this.playerList.sync(playerListData.players);
            this.updatePlayerListUI(this.playerList.getPlayers());
            this.updateStartGameButton();
        });
    }

    setPlayerReady(button) {
        console.log('Player ready button clicked');
        socket.emit('playerReady', {
            gameShortId: this.gameShortId,
            playerId: this.player.playerId
        });
        button.disabled = true;
        button.textContent = 'Ready!';
    }

    joinGame() {
        console.log('Attempting to join game room:', this.gameShortId, 'with player ID:', this.playerId);
        socket.emit('joinGame', {
            gameShortId: this.gameShortId,
            playerId: this.player.playerId,
            playerName: this.player.playerName,
            status: this.player.status
        });
    }

    leaveGame() {
        console.log('Leaving game room:', this.gameShortId, 'with player ID:', this.player.playerId);
        socket.emit('leaveGame', { gameShortId: this.gameShortId, playerId: this.player.playerId });
    }
}
