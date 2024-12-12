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
    socket.on('joinGame', (gameShortId, data) => {
        socket.join(gameShortId);
        if (gameSessionController.joinGame(gameShortId, data)) {
            console.log(`Socket ${socket.id} joined room:`, gameShortId);
        }
    });

    socket.on('leaveGame', (gameShortId, playerId) => {
        gameSessionController.leaveGame(gameShortId, playerId);
    });

    socket.on('playerReady', (gameShortId, playerId) => {
        gameSessionController.setPlayerReady(gameShortId, playerId);
    });
    socket.on('playerStatus', (gameShortId, playerId, status) => {
        gameSessionController.updatePlayerStatus(gameShortId, playerId,status);
    });

    socket.on('disconnect', () => {
        console.log('disconnect', socket.id);
    });

    // /////////////////////////////////////////////////////
    // Game session events
    //
    // createGame
    socket.on('createGame', (data, callback) => {
        const gameSession = gameSessionController.createGame(data);

        // When the player list changes, emit the new state to all clients in the game
        const unsubscribe = gameSessionController.getPlayerList(gameSession.short_id).subscribe((state) => {
            console.log('Players updated:', state);
            io.to(gameSession.short_id).emit('syncPlayerList', state);
        });

        // Send response back to client
        console.log('Sending response to client:', { success: true, gameSession: gameSession });
        callback({ success: true, gameSession: gameSession });
    });
    // startGame
    socket.on('startGame', (gameShortId, data) => {
        console.log('Start game request received for game:', gameShortId);
        if (gameSessionController.startGame(gameShortId, data)) {
            console.log('Emitting gameStarted event to room:', gameShortId);
            socket.to(gameShortId).emit('gameStarted', {
                gameShortId: gameShortId,
                started_at: gameSessionController.getSession(gameShortId).started_at,
                players: gameSessionController.getPlayerList(gameShortId).getPlayers()
            });
        }
    });
    // endGame
    socket.on('endGame', (gameShortId, data) => {
        if (gameSessionController.endGame(gameShortId, data)) {
            console.log('Emitting gameEnded event to room:', gameShortId);
            socket.to(gameShortId).emit('gameEnded', {
                gameShortId: gameShortId,
                ended_at: gameSessionController.getSession(gameShortId).ended_at,
                players: gameSessionController.getPlayerList(gameShortId).getPlayers()
            });
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
