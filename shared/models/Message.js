class Message {
    constructor(playerId, playerName, message, timestamp = Date.now()) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.message = message;
        this.timestamp = timestamp;
    }
    static fromJSON(data) {
        return new Message(data.playerId, data.playerName, data.message, data.timestamp);
    }

    toJSON() {
        return {
            playerId: this.playerId,
            playerName: this.playerName,
            message: this.message,
            timestamp: this.timestamp
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Message;
} 