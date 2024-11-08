const Player = require('../shared/models/Player');
const PlayerList = require('../shared/models/PlayerList');
const gamePlayerLists = require('../store/gamePlayerLists');

class PlayerListController {
    constructor(io) {
        this.io = io;
    }

    initializeList(gameShortId) {
        gamePlayerLists[gameShortId] = new PlayerList(gameShortId);
        
        // Set up listener for PlayerList updates
        gamePlayerLists[gameShortId].on('updated', (playerListData) => {
            this.io.in(gameShortId).emit('syncPlayerList', playerListData);
        });
    }

    joinGame(socket, data) {
        const { gameShortId, playerId, playerName, status } = data;
        console.log(`Join game request received for game: ${gameShortId} from player: ${playerId}`);
        
        const playerList = gamePlayerLists[gameShortId];
        if (!playerList) {
            console.log(`No player list found for game: ${gameShortId}`);
            return;
        }
        
        socket.join(gameShortId);
        
        // Add player to the list
        playerList.addPlayer({
            playerId,
            playerName,
            status,
            socketId: socket.id
        });
    }

    leaveGame(data) {
        const { gameShortId, playerId } = data;
        const playerList = gamePlayerLists[gameShortId];
        
        if (playerList) {
            playerList.removePlayer(playerId);
        }
    }

    setPlayerReady(data) {
        const { gameShortId, playerId } = data;
        const playerList = gamePlayerLists[gameShortId];
        
        if (playerList) {
            playerList.updatePlayerStatus(playerId, 'ready');
        }
    }

    disconnect(socket) {
        Object.values(gamePlayerLists).forEach(playerList => {
            const player = playerList.getPlayers().find(p => p.socketId === socket.id);
            if (player) {
                playerList.removePlayer(player.playerId);
            }
        });
    }

    getPlayerList(gameShortId) {
        return gamePlayerLists[gameShortId];
    }

    removeList(gameShortId) {
        delete gamePlayerLists[gameShortId];
    }

    updatePlayerStatus(gameShortId, playerId, status) {
        const playerList = gamePlayerLists[gameShortId];
        if (playerList) {
            playerList.updatePlayerStatus(playerId, status);
        }
    }
}

module.exports = PlayerListController; 