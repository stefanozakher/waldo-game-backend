class ClientPlayerListController {
    constructor(socket, gameShortId) {
        this.socket = socket;
        this.gameShortId = gameShortId;
        this.playerList = new PlayerList(gameShortId);

        let _player = this.initializePlayer();
        this.player = new Player(_player.playerId, _player.playerName);
        
        this.initializeSocketListeners();
        this.joinGame();

        console.log('ClientPlayerListController initialized for game:', this.gameShortId, 'with player ID:', this.player.playerId);
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
            startGameContainer.style.display = 'block';
        } else {
            startGameContainer.style.display = 'none';
        }
    }

    initializeSocketListeners() {
        this.socket.on('syncPlayerList', (playerListData) => {
            console.log('Received player list update:', playerListData);
            this.playerList.sync(playerListData.players);
            this.updatePlayerListUI(this.playerList.getPlayers());
            this.updateStartGameButton();
        });
    }

    setPlayerReady(button) {
        this.socket.emit('playerReady', {
            gameShortId: this.gameShortId,
            playerId: this.player.playerId
        });
        button.disabled = true;
        button.textContent = 'Ready!';

        this.playerList.updatePlayerStatus(this.player.playerId, 'ready');
    }

    joinGame() {
        this.socket.emit('joinGame', {
            gameShortId: this.gameShortId,
            playerId: this.player.playerId,
            playerName: this.player.playerName,
            status: this.player.status
        });

        this.playerList.addPlayer(this.player);
    }

    leaveGame() {
        this.socket.emit('leaveGame', {
            gameShortId: this.gameShortId,
            playerId: this.player.playerId
        });

        this.playerList.leavePlayer(this.player.playerId);
    }
}
