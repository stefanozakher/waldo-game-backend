class ChatComponent {
    constructor(containerElement = null) {
        this.container = containerElement || document.getElementById('game-session-chat-messages');
        this.unsubscribe = new Set();
    }

    get gameSession() { return this._gameSession; }
    get chat() { return this._gameSession.chat; }
    get currentPlayer() { return this._gameSession.playerlist.currentPlayer; }

    // Initialize the component with a player list
    init(gameSession) {
        if (this._gameSession !== gameSession) {
            this.cleanup();
            this._gameSession = gameSession;
            this.setupSubscription();

            this.renderChat(this.chat.toJSON());
        }
    }

    setupSubscription() {
        // Subscribe to all changes in the player list
        this.unsubscribe.add(this.chat.subscribe('latestMessage', (latestMessage) => {
            console.log('ChatComponent: Received new message:', latestMessage.toJSON());
            this.renderNewMessage(latestMessage.toJSON());
        }));
    }

    // Clean up when destroying the component
    destroy() { this.cleanup(); }
    cleanup() {
        this._gameSession = null;
        this.unsubscribe.forEach((unsub) => unsub());
        this.unsubscribe.clear();
    }

    compileMessageHTML(message) {
        const messageJSON = message instanceof Message ? message.toJSON() : message;
        const template = Handlebars.compile(document.getElementById('template-chat-message').innerHTML);
        return template({
            ...messageJSON,
            isCurrentPlayer: messageJSON.playerId === this.currentPlayer.playerId
        });
    }

    renderNewMessage(message = null) {
        const gs = gameSession || this.gameSession;
        const msg = message || gs.chat.latestMessage.toJSON();
        // Add the new message to the chat
        this.container.innerHTML += this.compileMessageHTML(message);
        this.container.scrollTop = this.container.scrollHeight;
    }

    renderChat(chat = null) {
        const gs = gameSession || this.gameSession;
        const c = chat || gs.chat;
        // Replace the chat with the new chat
        this.container.innerHTML = "";

        // Render all messages in the chat
        c.messages.forEach((msg) => {
            this.container.innerHTML += this.compileMessageHTML(msg);
        });

        this.container.scrollTop = this.container.scrollHeight;
    }
}
