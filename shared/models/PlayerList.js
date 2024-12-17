// Check if PlayerList already exists in global scope
if (typeof window !== 'undefined' && window.PlayerList) {
    // If it exists, use the existing one
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.PlayerList;
    }
} else {
    // Import dependencies in Node.js environment
    if (typeof require !== 'undefined') {
        var ReactiveModel = require('./ReactiveModel');
        var Player = require('./Player');
    }

    class PlayerList extends ReactiveModel {
        constructor(gameShortId) {
            super({
                gameShortId: gameShortId,
                players: [],
                currentPlayer: null
            });
            this._initializeCurrentPlayer();
        }

        _initializeCurrentPlayer() {
            // Only run on client side
            if (typeof window === 'undefined') return null;

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

            this.state.currentPlayer = new Player(waldoPlayer.playerId, waldoPlayer.playerName);

            return this.state.currentPlayer;
        }

        get currentPlayer() { return this.state.currentPlayer; }
        get players() { return [...this.state.players]; }

        set currentPlayer(player) { this.state.currentPlayer = player; }
        set players(players) { this.state.players = players; }

        addPlayer(playerData) {
            const player = playerData instanceof Player ? 
                playerData : 
                new Player(playerData.playerId, playerData.playerName, playerData.status);

            const existingIndex = this.state.players.findIndex(p => p.playerId === player.playerId);
            if (existingIndex !== -1) {
                const updatedPlayers = [...this.state.players];
                updatedPlayers[existingIndex] = player;
                this.state.players = updatedPlayers;
            } else {
                this.state.players = [...this.state.players, player];
            }

            return player;
        }

        findPlayer(findPlayer) {
            if (findPlayer.playerId) {
                return this.state.players.find(p => p.playerId === findPlayer.playerId);
            } else if (findPlayer.socketId) {
                return this.state.players.find(p => p.socketId === findPlayer.socketId);
            }
            return null;
        }

        removePlayer(findPlayer) {
            const player = this.findPlayer(findPlayer);
            if (player) {
                this.state.players = this.state.players.filter(p => p.playerId !== player.playerId);
            }
        }

        leavePlayer(findPlayer) {
            this.updatePlayerStatus(findPlayer, 'disconnected');
        }

        updatePlayerStatus(findPlayer, status) {
            const player = this.findPlayer(findPlayer);
            if (player) {
                player.status = status;
                this.state.players = [...this.state.players];
            }
            if (this.state.currentPlayer && this.state.currentPlayer.playerId === player.playerId) {
                this.state.currentPlayer.status = status;
            }
        }

        updateAllPlayersStatus(status) {
            const updatedPlayers = this.state.players.map(player => {
                player.status = status;
                return player;
            });
            this.state.players = updatedPlayers;
            if (this.state.currentPlayer) {
                this.state.currentPlayer.status = status;
            }
        }

        areAllPlayersReady() {
            return this.state.players.every(player => 
                player.status === 'ready' || player.status === 'disconnected'
            );
        }

        sync(players) {
            this.state.players = players.map(p => 
                new Player(p.playerId, p.playerName, p.status, p.socketId)
            );
        }

        toJSON() {
            return {
                gameShortId: this.state.gameShortId,
                players: this.state.players.map(player => player.toJSON()),
                currentPlayer: this.state.currentPlayer ? this.state.currentPlayer.toJSON() : null
            };
        }

        static fromJSON(json) {
            const playerList = new PlayerList(json.gameShortId);
            playerList.state.players = json.players.map(p => Player.fromJSON(p));
            playerList.state.currentPlayer = json.currentPlayer ? Player.fromJSON(json.currentPlayer) : playerList._initializeCurrentPlayer();
            return playerList;
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerList;
    } else {
        window.PlayerList = PlayerList;
    }
}
