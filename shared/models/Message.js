// Import dependencies in Node.js environment
if (typeof require !== 'undefined') {
    var ReactiveModel = require('./ReactiveModel');
}

// Check if Message already exists in global scope
if (typeof window !== 'undefined' && window.Message) {
    // If it exists, use the existing one
    module.exports = window.Message;
} else {
    class Message extends ReactiveModel {
        constructor({
            playerId = null,
            playerName = null,
            message = null,
            timestamp = Date.now()
        } = {}) {
            const initialState = {
                playerId: playerId,
                playerName: playerName,
                message: message,
                timestamp: timestamp
            };

            super(initialState);
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
            return { ...this.state };
        }

        static fromJSON(data) {
            return new Message(data);
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Message;
    } else if (typeof window !== 'undefined') {
        window.Message = Message;
    }
}
