const GameSession = require('../models/GameSession');
const Chat = require('../shared/models/Chat');
const PlayerListController = require('./PlayerListController');
const gameSessions = require('../store/gameSessions');

class GameSessionController {
    constructor(socket) {
        console.log('Initializing GameSessionController with socket:', socket.id);
        this.socket = socket;
        this.players = new PlayerListController(socket);
    }

    // Getter
    getGameSession(gameShortId) {
        return gameSessions[gameShortId];
    }

    storeGameSession(gameShortId, gameSession) {
        gameSessions[gameShortId] = gameSession;
    }

    createGame(data, callback) {
        console.log('Creating new game session', data);

        // Create a new game session
        const gameSession = new GameSession(data.seconds);
        console.log('New game session created:', gameSession);

        // Initialize player list for this game session
        this.players.initializeList(gameSession.short_id);
        console.log(`Player list initialized for game: ${gameSession.short_id}`);

        // Initialize chat for this game session
        gameSession.chat = new Chat(gameSession.short_id);
        console.log(`Chat initialized for game: ${gameSession.short_id}`);

        this.storeGameSession(gameSession.short_id, gameSession);
        console.log(`Game session stored with ID: ${gameSession.short_id}`);

        // Send response back to client
        console.log('Sending response to client:', { success: true, gameSession: gameSession });
        callback({ success: true, gameSession: gameSession });
    }

    startGame(gameShortId, data) {
        console.log(`Starting game: ${gameShortId}`);
        console.log('Start game data:', data);

        const { started_at } = data;
        const gameSession = gameSessions[gameShortId];
        const playerList = this.players.getPlayerList(gameShortId);

        console.log('Current game session:', gameSession);
        console.log('Current player list:', playerList ? playerList.getPlayers() : 'No player list found');

        if (gameSession && playerList && gameSession.status === 'waiting') {
            console.log('Game conditions met, updating game state');
            
            gameSession.status = 'playing';
            gameSession.started_at = started_at;
            console.log('Updated game session:', gameSession);
            
            // Update all players to playing status
            playerList.getPlayers().forEach(player => {
                console.log(`Updating player status to playing: ${player.playerId}`);
                this.players.updatePlayerStatus(gameShortId, player.playerId, 'playing');
            });

            this.storeGameSession(gameShortId, gameSession);
            this.startGameSessionTimer(gameShortId);

            return true;
        } else {
            console.log('Failed to start game - conditions not met');
            console.log('Game session exists:', !!gameSession);
            console.log('Player list exists:', !!playerList);
            console.log('Game status is waiting:', gameSession?.status === 'waiting');
        }
        return false;
    }

    endGame(gameShortId, data) {
        console.log(`Ending game: ${gameShortId}`);

        const { ended_at } = data;
        const gameSession = gameSessions[gameShortId];
        const playerList = this.players.getPlayerList(gameShortId);

        if (gameSession && playerList && gameSession.status !== 'completed') {
            gameSession.status = 'completed';
            gameSession.ended_at = ended_at;
            console.log('Updated game session:', gameSession);
            
            // Update all players to completed status
            playerList.getPlayers().forEach(player => {
                this.players.updatePlayerStatus(gameShortId, player.playerId, 'completed');
            });
            
            this.storeGameSession(gameShortId, gameSession);

            return true;
        } else {
            console.log('Failed to end game - missing game session or player list');
        }

        return false;
    }

    startGameSessionTimer(gameShortId){
        setTimeout(() => {
            this.endGame(gameShortId, { ended_at: Date.now() });
        }, gameSessions[gameShortId].playtime_in_seconds * 1000 + 1000);
    }
}

module.exports = GameSessionController; 