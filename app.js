const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const createRouter = require('./routes/index');
const GameSessionController = require('./controllers/GameSessionController');
const Message = require('./shared/models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize GameSessionController
const gameSessionController = new GameSessionController();

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Use routes with injected controller
app.use('/', createRouter(gameSessionController));

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Then define the event listeners with the shared sync
    socket.on('player.join', (gameShortId, data) => {
        socket.join(gameShortId);
        if (gameSessionController.getPlayerList(gameShortId).addPlayer(data)) {
            console.log(`Player ${data.playerId} joined room:`, gameShortId);
        }
    });

    socket.on('player.leave', (gameShortId, playerId) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getPlayerList(gameShortId).leavePlayer({playerId: playerId});
        }
    });

    socket.on('playerReady', (gameShortId, playerId) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getPlayerList(gameShortId).updatePlayerStatus({playerId: playerId}, 'ready');
        }
    });
    socket.on('playerStatus', (gameShortId, playerId, status) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getPlayerList(gameShortId).updatePlayerStatus({playerId: playerId}, status);
        }
    });

    socket.on('disconnect', () => {
        console.log('disconnect', socket.id);
    });

    // /////////////////////////////////////////////////////
    // Game session events
    //
    // createGame
    socket.on('game.create', (data, callback) => {
        const gameSession = gameSessionController.createGame(data);
        const gameShortId = gameSession.shortId;

        // When the player list changes, emit the new state to all clients in the game
        gameSession.playerlist.subscribe('players', (newPlayerList, oldPlayerList) => {
            io.to(gameShortId).emit('playerlist.updated', newPlayerList);
        });
        gameSession.subscribe('status', (newStatus, oldStatus) => {
            console.log('GameSession.status changed to', newStatus);
            io.to(gameShortId).emit('game.updated.status', {status: newStatus});
        });
        gameSession.subscribe('startedAt', (newStartedAt, oldStartedAt) => {
            console.log('GameSession.startedAt changed to', newStartedAt);
            io.to(gameShortId).emit('game.updated.startedAt', {startedAt: newStartedAt});
        });
        gameSession.subscribe('endedAt', (newEndedAt, oldEndedAt) => {
            console.log('GameSession.endedAt changed to', newEndedAt);
            io.to(gameShortId).emit('game.updated.endedAt', {endedAt: newEndedAt});
        });

        gameSession.status = 'unknown';
        gameSession.startedAt = new Date();
        gameSession.endedAt = new Date();

        gameSessionController.storeGameSession(gameSession);

        // Sending response to client
        callback({ success: true, gameSession: gameSession });
    });
    // startGame
    socket.on('game.start', (gameShortId, data) => {
        console.log('[socket event] game.start: Received request for game:', gameShortId);
        if (gameSessionController.startGame(gameShortId, data)) {
            console.log('[socket event] game.started: Sending event to room:', gameShortId);
            socket.to(gameShortId).emit('game.started', {
                gameShortId: gameShortId,
                startedAt: gameSessionController.getSession(gameShortId).startedAt,
                players: gameSessionController.getPlayerList(gameShortId).players
            });
        }
    });
    // endGame
    socket.on('game.end', (gameShortId, data) => {
        if (gameSessionController.endGame(gameShortId, data)) {
            console.log('[socket event] game.ended: Sending event to room:', gameShortId);
            socket.to(gameShortId).emit('game.ended', {
                gameShortId: gameShortId,
                endedAt: gameSessionController.getSession(gameShortId).endedAt,
                players: gameSessionController.getPlayerList(gameShortId).players
            });
        }
    });

    socket.on('game.update.status', (gameShortId, status) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getSession(gameShortId).status = status;
        }
    });

    // /////////////////////////////////////////////////////    
    // Chat events
    //
    // loadChatMessages
    socket.on('loadChatMessages', (gameShortId, callback) => {
        callback(gameSessionController.getChat(gameShortId).getMessagesInChronologicalOrder());
    });
    // chatMessage
    socket.on('chatMessage', (gameShortId, messageData) => {
        const chat = gameSessionController.getChat(gameShortId);
        try {
            const newMessage = Message.fromJSON(messageData);
            chat.addMessageFromJSON(newMessage);
            socket.to(gameShortId).emit('chatMessage', newMessage.toJSON());
            socket.emit('chatMessage', newMessage.toJSON());
        } catch (error) {
            console.error('Error processing message:', error);
            console.error('Original message data:', messageData);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
