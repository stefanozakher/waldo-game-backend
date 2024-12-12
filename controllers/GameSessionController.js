const Chat = require('../shared/models/Chat');
const PlayerList = require('../shared/models/PlayerList');
const GameSession = require('../models/GameSession');
const gameSessions = require('../store/gameSessions');
const gameLevels = require('../store/gameLevels');

class GameSessionController {
    constructor() {
        console.log('Initializing GameSessionController');
    }

    // Getter
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

    storeGameSession(gameShortId, gameSession) {
        gameSessions[gameShortId] = gameSession;
    }

    createGame(data, callback) {
        console.log('Creating new game session', data);

        // Create a new game session
        const gameSession = new GameSession(data.seconds);
        console.log('New game session created:', gameSession);

        gameSession.playerlist = new PlayerList(gameSession.short_id);

        if (data.levelsIds) {
            gameSession.levelsIds = data.levelsIds;
            gameSession.levels = gameLevels.filter(level => data.levelsIds.includes(level.id));
        } else {
            // Otherwise choose all levels
            gameSession.levelsIds = gameLevels.map(level => level.id);
            gameSession.levels = gameLevels;
        }

        // Initialize player list for this game session
        //this.players.initializeList(gameSession.short_id);
        console.log(`Player list initialized for game: ${gameSession.short_id}`);

        // Initialize chat for this game session
        gameSession.chat = new Chat(gameSession.short_id);
        console.log(`Chat initialized for game: ${gameSession.short_id}`);

        this.storeGameSession(gameSession.short_id, gameSession);
        console.log(`Game session stored with ID: ${gameSession.short_id}`);

        return gameSession;
    }

    startGame(gameShortId, data) {
        console.log(`Starting game: ${gameShortId}`);
        console.log('Start game data:', data);

        const { started_at } = data;
        const gameSession = this.getSession(gameShortId);

        if (gameSession && gameSession.status === 'waiting') {
            gameSession.status = 'playing';
            gameSession.started_at = started_at;
            console.log('Updated game session:', gameSession);
            
            // Update all players to playing status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('playing');

            this.storeGameSession(gameShortId, gameSession);
            this.startGameSessionTimer(gameShortId);

            return true;
        } else {
            console.log('Failed to start game');
        }
        return false;
    }

    endGame(gameShortId, data) {
        console.log(`Ending game: ${gameShortId}`);

        const { ended_at } = data;
        const gameSession = this.getSession(gameShortId);

        if (gameSession && gameSession.status !== 'completed') {
            gameSession.status = 'completed';
            gameSession.ended_at = ended_at;
            console.log('Updated game session:', gameSession);
            
            // Update all players to completed status
            this.getPlayerList(gameShortId).updateAllPlayersStatus('completed');
            
            this.storeGameSession(gameShortId, gameSession);

            return true;
        } else {
            console.log('Failed to end game');
        }

        return false;
    }

    startGameSessionTimer(gameShortId){
        setTimeout(() => {
            this.endGame(gameShortId, { ended_at: Date.now() });
        }, this.getSession(gameShortId).playtime_in_seconds * 1000 + 1000);
    }

    // Player events
    joinGame(gameShortId, data) {
        const { playerId, playerName, status } = data;
        const playerList = this.getPlayerList(gameShortId);
        console.log(`Join game request received for game: ${gameShortId} from player: ${playerId}`);

        if (playerList) {
            playerList.addPlayer(data);
            return true;
        }

        return null;
    }
    leaveGame(gameShortId, playerId) {
        if (this.getSession(gameShortId)) {
            this.getPlayerList(gameShortId).leavePlayer({playerId: playerId});
        }
    }
    setPlayerReady(gameShortId, playerId) {
        if (this.getSession(gameShortId)) {
            this.getPlayerList(gameShortId).updatePlayerStatus({playerId: playerId}, 'ready');
        }
    }
    updatePlayerStatus(gameShortId, playerId, status) {
        if (this.getSession(gameShortId)) {
            this.getPlayerList(gameShortId).updatePlayerStatus({playerId: playerId}, status);
        }
    }
}

module.exports = GameSessionController; 