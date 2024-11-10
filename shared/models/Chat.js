// Import Message model in Node.js environment
if (typeof require !== 'undefined' && typeof Message === 'undefined') {
    Message = require('./Message');
}

class Chat {
    constructor(gameShortId) {
        this.gameShortId = gameShortId;
        this.messages = [];
        this.events = typeof window === 'undefined' ? require('events') : null;
        this.eventEmitter = this.events ? new this.events.EventEmitter() : null;
    }

    addMessage(playerId, playerName, content, timestamp) {
        return this.addMessageFromJSON({
            playerId: playerId,
            playerName: playerName,
            content: content,
            timestamp: timestamp
        });
    }
    addMessageFromJSON(messageJSON) {
        const newMessage = Message.fromJSON(messageJSON);
        this.messages.push(newMessage);
        this.emitUpdate(newMessage);
        return newMessage;
    }

    getMessagesInChronologicalOrder() {
        return this.messages.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Event handling (server-side only)
    on(event, callback) {
        if (this.eventEmitter) {
            this.eventEmitter.on(event, callback);
        }
    }

    emitUpdate(message = null) {
        if (this.eventEmitter) {
            if (message instanceof Message) {
                this.eventEmitter.emit('updated', message.toJSON());
            } else {
                this.eventEmitter.emit('updated', this.toJSON());
            }
        }
    }

    toJSON() {
        return {
            gameShortId: this.gameShortId,
            messages: this.messages.map(msg => msg.toJSON())
        };
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chat;
} else {
    window.Chat = Chat;
} 