// Import Player model in Node.js environment
if (typeof require !== 'undefined' && typeof Player === 'undefined') {
    Player = require('./Player');
}

class PlayerList {
    constructor(gameShortId) {
        this._gameShortId = gameShortId;
        this._players = [];
        this._subscribers = new Set();
        
        // Create proxy for reactive updates
        this.state = new Proxy(this, {
            set: (target, property, value) => {
                target[property] = value;
                if (property === '_players') {
                    this._notifySubscribers();
                }
                return true;
            }
        });
    }

    // Subscribe to changes
    subscribe(callback) {
        this._subscribers.add(callback);
        // Initial call with current state
        callback(this.toJSON());
        
        // Return unsubscribe function
        return () => this._subscribers.delete(callback);
    }

    // Notify all subscribers of changes
    _notifySubscribers() {
        const data = this.toJSON();
        this._subscribers.forEach(callback => callback(data));
    }

    addPlayer(playerData) {
        const player = playerData instanceof Player ? 
            playerData : 
            new Player(playerData.playerId, playerData.playerName, playerData.status);

        const existingIndex = this._players.findIndex(p => p.playerId === player.playerId);
        if (existingIndex !== -1) {
            this._players[existingIndex] = player;
        } else {
            this._players.push(player);
        }
        
        this.state._players = [...this._players];
        return player;
    }

    findPlayer(findPlayer) {
        if (findPlayer.playerId) {
            return this._players.find(p => p.playerId === findPlayer.playerId);
        } else if (findPlayer.socketId) {
            return this._players.find(p => p.socketId === findPlayer.socketId);
        }
        return null;
    }

    removePlayer(findPlayer) {
        const player = this.findPlayer(findPlayer);
        if (player) {
            this.state._players = this._players.filter(p => p.playerId !== player.playerId);
        }
    }

    leavePlayer(findPlayer) {
        this.updatePlayerStatus(findPlayer, 'disconnected');
    }

    updatePlayerStatus(findPlayer, status) {
        const player = this.findPlayer(findPlayer);
        if (player) {
            player.status = status;
            this.state._players = [...this._players];
        }
    }

    updateAllPlayersStatus(status) {
        this._players.forEach(player => {
            player.status = status;
        });
        this.state._players = [...this._players];
    }

    getPlayers() {
        return [...this._players];
    }

    sync(players) {
        this.state._players = players.map(p => 
            new Player(p.playerId, p.playerName, p.status, p.socketId)
        );
    }

    toJSON() {
        return {
            gameShortId: this._gameShortId,
            players: this._players.map(p => p.toJSON())
        };
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerList;
} else {
    window.PlayerList = PlayerList;
} 