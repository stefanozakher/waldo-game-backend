class Player {
    constructor(playerId, playerName, status = 'connected', socketId = null) {
        this.playerId = playerId;
        this.playerName = playerName;
        /**
         * Status can be:
         * - connected
         * - ready
         * - playing
         * - disconnected
         */
        this.status = status;
        this.socketId = socketId;
    }

    toJSON() {
        return {
            playerId: this.playerId,
            playerName: this.playerName,
            status: this.status,
            socketId: this.socketId
        };
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
} else {
    window.Player = Player;
}
