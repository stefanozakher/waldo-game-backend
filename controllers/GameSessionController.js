const GameSession = require('../shared/models/GameSession');
const gameSessions = require('../store/gameSessions');
const gameLevels = require('../store/gameLevels');

class GameSessionController {
    constructor() {
        console.log('Initializing GameSessionController');
    }

    // Getter
    isValidGameShortId(gameShortId) {
        return gameSessions[gameShortId] !== undefined;
    }
    getSession(gameShortId) {
        const session = gameSessions[gameShortId];
        if (!session) {
            console.warn(`Game session not found for ID: ${gameShortId}`);
            return null;
        }
        return session;
    }
    getChat(gameShortId) {
        let session = this.getSession(gameShortId);
        return (session) ? session.chat : null;
    }
    getPlayerList(gameShortId) {
        let session = this.getSession(gameShortId);
        return (session) ? session.playerlist : null;
    }

    storeGameSession(gameSession) {
        gameSessions[gameSession.shortId] = gameSession;
        console.log(`Game session stored with ID: ${gameSession.shortId}`);
    }

    createGame(data) {
        console.log('Creating new game session', data);

        const gameSession = new GameSession(data.seconds);
        const shortId = gameSession.shortId;

        this.storeGameSession(gameSession);

        if (data.levelsIds) {
            this.getSession(shortId).levels = gameLevels.filter(level => data.levelsIds.includes(level.id));
        } else {
            this.getSession(shortId).levels = gameLevels;
        }

        return this.getSession(shortId);
    }

    startGame(gameShortId, data) {
        if (!this.isValidGameShortId(gameShortId)) {
            console.log(`Invalid game short ID: ${gameShortId}`);
            return false;
        }

        console.log(`Starting game: ${gameShortId}`);

        const { startedAt } = data;
        const gameSession = this.getSession(gameShortId);

        if (gameSession && gameSession.status === 'waiting') {
            this.getSession(gameShortId).status = 'playing';
            this.getSession(gameShortId).startedAt = startedAt;

            // Update all players to playing status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('playing');

            this.storeGameSession(gameSession);
            this.startGameSessionTimer(gameShortId);

            return true;
        } else {
            console.log('Failed to start game');
        }
        return false;
    }

    endGame(gameShortId, data) {
        console.log(`Ending game: ${gameShortId}`);

        const { endedAt } = data;
        const gameSession = this.getSession(gameShortId);

        if (gameSession && gameSession.status !== 'completed') {
            gameSession.status = 'completed';
            gameSession.endedAt = endedAt;
            
            // Update all players to completed status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('completed');
            
            this.storeGameSession(gameSession);

            return true;
        } else {
            console.log('Failed to end game');
        }

        return false;
    }

    startGameSessionTimer(gameShortId){
        setTimeout(() => {
            this.endGame(gameShortId, { endedAt: Date.now() });
        }, this.getSession(gameShortId).playtimeInSeconds * 1000 + 1000);
    }
}

module.exports = GameSessionController;