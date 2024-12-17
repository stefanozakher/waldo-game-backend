// Check if Chat already exists in global scope
if (typeof window !== 'undefined' && window.Chat) {
    // If it exists, use the existing one
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.Chat;
    }
} else {
    // Import dependencies in Node.js environment
    if (typeof require !== 'undefined') {
        var ReactiveModel = require('./ReactiveModel');
        var Message = require('./Message');
    }

    class Chat extends ReactiveModel {
        constructor(gameShortId) {
            super({
                gameShortId: gameShortId,
                messages: []
            });
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
            this.state.messages = [...this.state.messages, newMessage];
            this.emitUpdate(newMessage);
            return newMessage;
        }

        getMessagesInChronologicalOrder() {
            return [...this.state.messages].sort((a, b) => a.timestamp - b.timestamp);
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
                gameShortId: this.state.gameShortId,
                messages: this.state.messages.map(msg => msg.toJSON())
            };
        }

        static fromJSON(json) {
            const chat = new Chat(json.gameShortId);
            chat.state.messages = json.messages.map(msg => Message.fromJSON(msg));
            return chat;
        }
    }

    // Make it available to both Node.js and browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Chat;
    } else {
        window.Chat = Chat;
    }
} 