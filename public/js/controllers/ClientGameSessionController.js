class ClientGameSessionController {
    constructor(socket, gameShortId, gameSession) {
        this.socket = socket;
        this.gameShortId = gameShortId;
        this.gameSession = gameSession;

        this.players = new ClientPlayerListController(socket, this);
    }

    // Getters
    getGameSession() {
        return this.gameSession;
    }
    getGameShortId() {
        return this.gameShortId;
    }
    getPlayerListController() {
        return this.players;
    }

    // Methods
    startGame(started_at) {
        console.log('startGame', this.gameSession.status);
        if (this.gameSession.status === 'waiting') {
            this.gameSession.status = 'playing';
            this.gameSession.started_at = started_at;
            this.startTimer();
        }
        this.updateGameUI();
    }

    endGame(ended_at) {
        console.log('endGame', this.gameSession.status);
        if (this.gameSession.status !== 'completed') {
            this.gameSession.status = 'completed';
            this.gameSession.ended_at = ended_at;
        }
        this.updateGameUI();
    }

    updateGameUI() {
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = this.gameSession.status;
        }
    }

    startTimer() {
        const timerElement = document.getElementById('gameSessionTimer');
        if (timerElement && this.gameSession.started_at) {
            const endTime = this.gameSession.started_at + this.gameSession.playtime_in_seconds * 1000 + 1000;
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