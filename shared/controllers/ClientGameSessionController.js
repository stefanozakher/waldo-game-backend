class ClientGameSessionController {
    constructor(socket, gameShortId, gameSession) {
        this.socket = socket;
        this.gameShortId = gameShortId;
        this.gameSession = gameSession;

        this.chat = new ClientChatController(socket, this);
    }
    // Getters
    getSession() {
        return this.gameSession;
    }
    getGameShortId() {
        return this.gameShortId;
    }
    getChat() {
        return this.chat;
    }
    // Methods
    startGame(startedAt) {
        console.log('startGame', this.getSession().status);
        if (this.getSession().status === 'waiting') {
            this.getSession().status = 'playing';
            this.getSession().startedAt = startedAt;
            this.startTimer();
        }
        return this.gameSession;
    }
    endGame(endedAt) {
        console.log('endGame', this.getSession().status);
        if (this.getSession().status !== 'completed') {
            this.getSession().status = 'completed';
            this.getSession().endedAt = endedAt;
        }
        return this.gameSession;
    }
    startTimer() {
        const timerElement = document.getElementById('gameSessionTimer');
        if (timerElement && this.getSession().startedAt) {
            const endTime = this.getSession().startedAt + this.getSession().playtimeInSeconds * 1000 + 1000;
            const timerInterval = window.setInterval(() => {
                const elapsed = Math.floor((endTime - Date.now()) / 1000);
                
                if (elapsed <= 0) {
                    clearInterval(timerInterval);
                    timerElement.textContent = '0:00';
                    this.endGame(Date.now());
                    return;
                }
                
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientGameSessionController;
} 