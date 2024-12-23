// Import dependencies in Node.js environment
if (typeof require !== 'undefined') {
    var ReactiveModel = require('./ReactiveModel');
    var Message = require('./Message');
}

// Check if Chat already exists in global scope
if (typeof window !== 'undefined' && window.Chat) {
    // If it exists, use the existing one
    module.exports = window.Chat;
} else {
    // If it doesn't exist, define it
    class Chat extends ReactiveModel {
        constructor({ gameShortId = null, messages = [], latestMessage = null } = {}) {
            const initialState = {
                gameShortId: gameShortId,
                messages: messages.map(msg => msg instanceof Message ? msg : Message.fromJSON(msg)),
                latestMessage: latestMessage ? (latestMessage instanceof Message ? latestMessage : new Message(latestMessage)) : null
            };
            super(initialState);
        }

        addSystemMessage(messageText) {
            this.addMessage({
                playerId: null,
                playerName: null,
                message: messageText,
                timestamp: Date.now()
            });
        }

        addMessage(message) {
            const latestMessage = message instanceof Message ? message : new Message(message);
            this.state.latestMessage = latestMessage;
            this.state.messages = [...this.state.messages, latestMessage];
        }

        toJSON() {
            return {
                gameShortId: this.state.gameShortId,
                messages: this.state.messages.map(msg => msg.toJSON()),
                latestMessage: this.state.latestMessage ? this.state.latestMessage.toJSON() : null
            };
        }

        static fromJSON(json) {
            return new Chat(json);
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Chat;
    } else if (typeof window !== 'undefined') {
        window.Chat = Chat;
    }
}
