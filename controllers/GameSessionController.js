const GameSession = require('../models/GameSession');
const PlayerListController = require('./PlayerListController');
const gameSessions = require('../store/gameSessions');

class GameSessionController {
    constructor(io) {
        this.io = io;
        this.players = new PlayerListController(io);
    }

    createGame(data, callback) {
        console.log(`Received createGame event with data: ${JSON.stringify(data)}`);

        // Create a new game session
        const gameSession = new GameSession(data.seconds);
        gameSessions[gameSession.short_id] = gameSession;

        // Initialize player list for this game session
        this.players.initializeList(gameSession.short_id);

        console.log(`Game session created: ${JSON.stringify(gameSession)}`);

        // Send response back to client
        callback({ success: true, gameSession: gameSession });
    }

    checkGameStart(gameShortId) {
        const playerList = this.players.getPlayerList(gameShortId);
        const gameSession = gameSessions[gameShortId];

        if (playerList && gameSession) {
            const allPlayers = playerList.getPlayers();
            const allReady = allPlayers.length > 0 && 
                            allPlayers.every(player => player.status === 'ready');

            if (allReady) {
                this.startGame(gameShortId);
            }
        }
    }

    startGame(gameShortId) {
        const gameSession = gameSessions[gameShortId];
        const playerList = this.players.getPlayerList(gameShortId);

        if (gameSession && playerList) {
            gameSession.status = 'playing';
            gameSession.started_at = Date.now();
            
            // Update all players to playing status
            playerList.getPlayers().forEach(player => {
                this.players.updatePlayerStatus(gameShortId, player.playerId, 'playing');
            });

            this.io.in(gameShortId).emit('gameStarted', {
                gameShortId: gameShortId,
                started_at: gameSession.started_at,
                players: playerList.getPlayers()
            });
        }
    }

    getGameSession(gameShortId) {
        return gameSessions[gameShortId];
    }
}

module.exports = GameSessionController; 