class ClientGameSessionController {
    constructor(socket, gameShortId, gameSession) {
        this.socket = socket;
        this.gameShortId = gameShortId;
        this.gameSession = gameSession;
        
        this.initializeSocketHandlers();
    }

    initializeSocketHandlers() {
        this.socket.on('gameStarted', (data) => { if (data.gameShortId === this.gameShortId) this.startGame(data.started_at); });
        this.socket.on('gameEnded', (data) => { if (data.gameShortId === this.gameShortId) this.endGame(data.ended_at, false); });
        //this.socket.on('characterFound', (data) => this.characterFound(data));
    }

    startGame(started_at) {
        console.log('startGame', this.gameSession.status);
        if (this.gameSession.status === 'waiting') {
            this.gameSession.status = 'playing';
            this.gameSession.started_at = started_at;
            this.updateGameUI();

            document.getElementById('startGameContainer').style.display = 'none';

            this.startTimer();
        }
    }

    endGame(ended_at, emit = true) {
        console.log('endGame', this.gameSession.status);
        if (this.gameSession.status !== 'completed') {
            this.gameSession.status = 'completed';
            this.gameSession.ended_at = ended_at;
            this.updateGameUI();

            if (emit) {
                this.socket.emit('endGame', this.gameShortId, {
                    ended_at: this.gameSession.ended_at
                });
            }
        }
    }

    characterFound(data) {
        const { character, foundBy } = data;
        this.gameSession.foundCharacters.push({ character, foundBy });
        this.updateGameUI();
    }

    updateGameUI() {
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = this.gameSession.status;
        }

        // Update found characters list
        const foundList = document.getElementById('foundCharacters');
        if (foundList) {
            foundList.innerHTML = this.gameSession.foundCharacters
                .map(found => `<li>${found.character} found by ${found.foundBy}</li>`)
                .join('');
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
                    this.endGame(Date.now(), true);
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