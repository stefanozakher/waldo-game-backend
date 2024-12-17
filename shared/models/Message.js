// Check if Message already exists in global scope
if (typeof window !== 'undefined' && window.Message) {
    // If it exists, use the existing one
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.Message;
    }
} else {
    // Import dependencies in Node.js environment
    if (typeof require !== 'undefined') {
        var ReactiveModel = require('./ReactiveModel');
    }

    class Message extends ReactiveModel {
        constructor(playerId, playerName, message, timestamp = Date.now()) {
            super({
                playerId: playerId,
                playerName: playerName,
                message: message,
                timestamp: timestamp
            });
        }

        // Getters
        get playerId() { return this.state.playerId; }
        get playerName() { return this.state.playerName; }
        get message() { return this.state.message; }
        get timestamp() { return this.state.timestamp; }

        // Setters
        set message(value) {
            this.state.message = value;
        }

        toJSON() {
            return {
                playerId: this.state.playerId,
                playerName: this.state.playerName,
                message: this.state.message,
                timestamp: this.state.timestamp
            };
        }

        static fromJSON(data) {
            return new Message(
                data.playerId, 
                data.playerName, 
                data.message, 
                data.timestamp
            );
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Message;
    } else {
        window.Message = Message;
    }
} 