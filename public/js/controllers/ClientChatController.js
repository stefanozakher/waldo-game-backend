class ClientChatController {
    constructor(socket, gameSessionController) {
        this.socket = socket;
        this.gameSessionController = gameSessionController;
        this.gameShortId = gameSessionController.getGameShortId();
        this.chat = new Chat(this.gameShortId);
        
        this.initializeElements();
    }

    initializeElements() {
        this.chatContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        
        if (!this.chatContainer || !this.messageInput || !this.sendButton) {
            console.error('Failed to find chat elements:', {
                container: !!this.chatContainer,
                input: !!this.messageInput,
                button: !!this.sendButton
            });
        } else {
            this.sendButton.addEventListener('click', () => {
                console.log('Send button clicked');
                this.sendMessage();
            });
            
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in message input');
                    this.sendMessage();
                }
            });
        }
    }

    sendMessage() {
        let message = this.messageInput.value.trim();
        console.log('Attempting to send message:', message);

        if (message) {
            let playerId = this.gameSessionController.players.getPlayer().playerId;
            let playerName = this.gameSessionController.players.getPlayer().playerName;

            socket.emit('chatMessage', this.gameShortId, (new Message(playerId, playerName, message)).toJSON() );
            this.messageInput.value = '';
        }
    }

    addMessage(message) {
        this.chat.addMessageFromJSON(message);
        this.appendMessageToChatUI(message);
    }

    loadMessages(messages) {
        messages.forEach(message => this.addMessage(message));
    }

    appendMessageToChatUI(message) {
        try {
            const templateContent = document.getElementById('message-template').innerHTML;
            const template = Handlebars.compile(templateContent);
            
            this.chatContainer.innerHTML += template({
                ...message,
                currentPlayerId: this.gameSessionController.players.getPlayer().playerId
            });
            
            // Auto scroll to bottom
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        } catch (error) {
            console.error('Error updating chat UI:', error);
        }
    }

    // reloadChatUI() {
    //     try {
    //         const templateContent = document.getElementById('message-template').innerHTML;
    //         const template = Handlebars.compile(templateContent);
            
    //         this.chatContainer.innerHTML = this.messages
    //             .map(msg => template({
    //                 ...msg,
    //                 currentPlayerId: this.gameSessionController.players.getPlayer().playerId
    //             }))
    //             .join('');
            
    //         // Auto scroll to bottom
    //         this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    //     } catch (error) {
    //         console.error('Error updating chat UI:', error);
    //     }
    // }
} 