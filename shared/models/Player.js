// Check if Player already exists in global scope
if (typeof window !== 'undefined' && window.Player) {
    // If it exists, use the existing one
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.Player;
    }
} else {
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
             * - lost
             * - won
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

        static fromJSON(json) {
            return new Player(
                json.playerId,
                json.playerName,
                json.status,
                json.socketId
            );
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Player;
    } else {
        window.Player = Player;
    }
}
