class TimerComponent {
    constructor(containerTimer = null) {
        this._containerTimer = containerTimer || document.getElementById('game-session-timer');
        this._timerRunning = false;
        this.unsubscribe = new Set();
    }

    get gameSession() { return this._gameSession; }
    get containerTimer() {
        if (this._containerTimer === null) { 
            this._containerTimer = document.getElementById('game-session-timer');
        }
        return this._containerTimer;
    }
    get timerRunning() { return this._timerRunning; }

    init(gameSession) {
        if (this._gameSession !== gameSession) {
            this.cleanup();
            this._gameSession = gameSession;
            this.setupSubscription();

            if (this.gameSession.status === 'playing')
                this.startTimer();

            this.render(this.gameSession.playtimeInSeconds);
        }
    }

    setupSubscription() {
        // Subscribe to gameSession changes
        this.unsubscribe.add(this.gameSession.subscribe('startedAt', (newStartedAt) => {
            console.log('TimerComponent: starting timer at', newStartedAt);
            this.startTimer();
        }));
    }

    destroy() { this.cleanup(); }
    cleanup() {
        this._gameSession = null;
        this._timerRunning = false;
        this.unsubscribe.forEach((unsub) => unsub());
        this.unsubscribe.clear();
    }

    getTimerString(seconds){
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2,'0')}:${(seconds % 60).toString().padStart(2,'0')}`;
    }

    startTimer(){
        const gs = this.gameSession;
        const endTime = gs.startedAt + gs.playtimeInSeconds * 1000 + 1000;
        const timerInterval = window.setInterval(() => {
            const elapsedSeconds = Math.floor((endTime - Date.now()) / 1000);
            
            if (elapsedSeconds <= 0) {
                clearInterval(timerInterval);
                this.render(0);
                this._timerRunning = false;
                return;
            }
            
            this.render(elapsedSeconds);
        }, 1000);

        this._timerRunning = true;
    }

    render(seconds) {
        if (!this.containerTimer) return;

        switch (this.gameSession.status) {
            case 'created':
            case 'waiting':
            case 'playing':
                this.containerTimer.textContent = this.getTimerString( seconds );
                break;
            case 'completed':
            case 'timeout':
                this.containerTimer.textContent = '';
                break;
        }
        
    }
}
