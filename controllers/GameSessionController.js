const GameSession = require('../models/GameSession');
const PlayerListController = require('./PlayerListController');
const gameSessions = require('../store/gameSessions');

class GameSessionController {
    constructor(socket) {
        console.log('Initializing GameSessionController with socket:', socket.id);
        this.socket = socket;
        this.players = new PlayerListController(socket);
    }

    storeGameSession(gameShortId, gameSession) {
        console.log(`Storing game session - ID: ${gameShortId}`);
        console.log('Game session data:', gameSession);
        gameSessions[gameShortId] = gameSession;
        console.log('Current active game sessions:', Object.keys(gameSessions));
    }

    createGame(data, callback) {
        console.log('Creating new game session');
        console.log('Received data:', data);

        // Create a new game session
        const gameSession = new GameSession(data.seconds);
        console.log('New game session created:', gameSession);

        this.storeGameSession(gameSession.short_id, gameSession);
        console.log(`Game session stored with ID: ${gameSession.short_id}`);

        // Initialize player list for this game session
        this.players.initializeList(gameSession.short_id);
        console.log(`Player list initialized for game: ${gameSession.short_id}`);

        // Send response back to client
        console.log('Sending response to client:', { success: true, gameSession: gameSession });
        callback({ success: true, gameSession: gameSession });
    }

    checkGameStart(gameShortId) {
        console.log(`Checking game start conditions for game: ${gameShortId}`);
        
        const playerList = this.players.getPlayerList(gameShortId);
        const gameSession = gameSessions[gameShortId];

        console.log('Current player list:', playerList ? playerList.getPlayers() : 'No player list found');
        console.log('Current game session:', gameSession);

        if (playerList && gameSession) {
            const allPlayers = playerList.getPlayers();
            const allReady = allPlayers.length > 0 && 
                            allPlayers.every(player => player.status === 'ready');

            console.log('All players:', allPlayers);
            console.log('All players ready:', allReady);

            if (allReady) {
                console.log('All players ready, starting game');
                this.startGame(gameShortId);
            } else {
                console.log('Not all players are ready yet');
            }
        } else {
            console.log('Missing player list or game session');
        }
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

            console.log('Emitting gameStarted event to room:', gameShortId);
            this.socket.to(gameShortId).emit('gameStarted', {
                gameShortId: gameShortId,
                started_at: gameSession.started_at,
                players: playerList.getPlayers()
            });
        } else {
            console.log('Failed to start game - conditions not met');
            console.log('Game session exists:', !!gameSession);
            console.log('Player list exists:', !!playerList);
            console.log('Game status is waiting:', gameSession?.status === 'waiting');
        }

        this.storeGameSession(gameShortId, gameSession);

        this.startGameSessionTimer(gameShortId);
    }

    endGame(gameShortId, data) {
        console.log(`Ending game: ${gameShortId}`);

        const { ended_at } = data;
        const gameSession = gameSessions[gameShortId];
        const playerList = this.players.getPlayerList(gameShortId);

        if (gameSession && playerList) {
            gameSession.status = 'completed';
            gameSession.ended_at = ended_at;
            console.log('Updated game session:', gameSession);
            
            // Update all players to completed status
            playerList.getPlayers().forEach(player => {
                this.players.updatePlayerStatus(gameShortId, player.playerId, 'completed');
            });
            
            console.log('Emitting gameEnded event to room:', gameShortId);
            this.socket.to(gameShortId).emit('gameEnded', {
                gameShortId: gameShortId,
                ended_at: gameSession.ended_at,
                players: playerList.getPlayers()
            });
        } else {
            console.log('Failed to end game - missing game session or player list');
        }

        this.storeGameSession(gameShortId, gameSession);
    }

    getGameSession(gameShortId) {
        console.log(`Getting game session: ${gameShortId}`);
        const gameSession = gameSessions[gameShortId];
        console.log('Retrieved game session:', gameSession);
        return gameSession;
    }

    startGameSessionTimer(gameShortId){
        setTimeout(() => {
            this.endGame(gameShortId, { ended_at: Date.now() });
        }, gameSessions[gameShortId].playtime_in_seconds * 1000 + 1000);
    }
}

module.exports = GameSessionController; 