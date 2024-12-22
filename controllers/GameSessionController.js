const GameSession = require('../shared/models/GameSession');
const gameSessions = require('../store/gameSessions');
const gameLevels = require('../store/gameLevels');

class GameSessionController {
    constructor() {
        console.log('Initialising GameSessionController');
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
    }

    create(data) {
        console.log('Creating new game session', data);

        const gameSession = new GameSession({ playtimeInSeconds: data.seconds });
        const shortId = gameSession.shortId;

        this.storeGameSession(gameSession);

        if (data.levelsIds) {
            this.getSession(shortId).levels = gameLevels.filter(level => data.levelsIds.includes(level.id));
        } else {
            this.getSession(shortId).levels = gameLevels;
        }

        return this.getSession(shortId);
    }

    start(gameShortId, data) {
        if (!this.isValidGameShortId(gameShortId)) {
            console.log(`Invalid game short ID: ${gameShortId}`);
            return false;
        }

        console.log(`Starting game: ${gameShortId}`);

        const { startedAt } = data;
        const gameSession = this.getSession(gameShortId);

        // Can only start a game session that is 'waiting' to be started
        if (gameSession.start(startedAt)) {
            // Update all players to playing status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('playing');

            this.startTimer(gameShortId);

            return true;
        }

        return false;
    }

    complete(gameShortId, data) {
        if (!this.isValidGameShortId(gameShortId)) {
            console.log(`Invalid game short ID: ${gameShortId}`);
            return false;
        }
        console.log(`Ending game: ${gameShortId}`);

        const { endedAt } = data;
        const gameSession = this.getSession(gameShortId);

        // Can only complete a game session that is 'playing'
        if (gameSession.complete(endedAt)) {
            // Update all players to completed status
            // this.getPlayerList(gameShortId).updateAllPlayersStatus('completed');
            return true;
        }

        return false;
    }

    timeout(gameShortId,data){
        if (!this.isValidGameShortId(gameShortId)) {
            console.log(`Invalid game short ID: ${gameShortId}`);
            return false;
        }
        console.log(`Timing out game session: ${gameShortId}`);

        const { endedAt } = data;
        const gameSession = this.getSession(gameShortId);

        if (gameSession.timeout(endedAt)) {  
            // Update all players to lost status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('lost');
            return true;
        }
        return false;
    }

    startTimer(gameShortId){
        setTimeout(() => {
            // When the timeout hits, the game session times out.
            this.timeout(gameShortId, { endedAt: Date.now() });
        // Set the timeout to playtimeInSeconds + 1 second grace.
        }, this.getSession(gameShortId).playtimeInSeconds * 1000 + 1000);
    }
}

module.exports = GameSessionController;