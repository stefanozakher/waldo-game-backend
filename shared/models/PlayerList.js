// Import Player model in Node.js environment
if (typeof require !== 'undefined' && typeof Player === 'undefined') {
    Player = require('./Player');
}

class PlayerList {
    constructor(gameShortId) {
        this.gameShortId = gameShortId;
        this.players = [];
        this.events = typeof window === 'undefined' ? require('events') : null;
        this.eventEmitter = this.events ? new this.events.EventEmitter() : null;
    }

    addPlayer(playerData) {
        const player = playerData instanceof Player ? 
            playerData : 
            new Player(playerData.playerId, playerData.playerName, playerData.status);

        const existingIndex = this.players.findIndex(p => p.playerId === player.playerId);
        if (existingIndex !== -1) {
            this.players[existingIndex] = player;
        } else {
            this.players.push(player);
        }

        this.emitUpdate();
        return player;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.playerId !== playerId);
        this.emitUpdate();
    }

    leavePlayer(playerId) {
        this.updatePlayerStatus(playerId, 'disconnected');
    }

    updatePlayerStatus(playerId, status) {
        const player = this.players.find(p => p.playerId === playerId);
        if (player) {
            player.status = status;
            this.emitUpdate();
        }
    }
    updateAllPlayersStatus(status) {
        this.players.forEach(player => {
            player.status = status;
        });
        this.emitUpdate();
    }

    getPlayers() {
        return this.players;
    }

    sync(players) {
        this.players = players.map(p => new Player(p.playerId, p.playerName, p.status, p.socketId));
        this.emitUpdate();
    }

    // Event handling (server-side only)
    on(event, callback) {
        if (this.eventEmitter) {
            this.eventEmitter.on(event, callback);
        }
    }

    emitUpdate() {
        if (this.eventEmitter) {
            this.eventEmitter.emit('updated', this.toJSON());
        }
    }

    toJSON() {
        return {
            gameShortId: this.gameShortId,
            players: this.players.map(p => p.toJSON())
        };
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerList;
} else {
    window.PlayerList = PlayerList;
} 