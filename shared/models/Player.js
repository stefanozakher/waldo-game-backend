class Player {
    constructor(playerId, playerName, status = 'connected', socketId = null) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.status = status;
    }

    toJSON() {
        return {
            playerId: this.playerId,
            playerName: this.playerName,
            status: this.status
        };
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
} else {
    window.Player = Player;
}
