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
    // console.log('New client connected:', socket.id);

    // Then define the event listeners with the shared sync
    socket.on('player.join', (gameShortId, data) => {
        socket.join(gameShortId);
        if (gameSessionController.isValidGameShortId(gameShortId) && gameSessionController.getPlayerList(gameShortId).addPlayer(data)) {
            console.log(`Player ${data.playerId} joined room:`, gameShortId);

            // Once the first player joined, the game session status changes to 'waiting'
            if (gameSessionController.getSession(gameShortId).status === 'created')
                gameSessionController.getSession(gameShortId).status = 'waiting';
        }
    });

    socket.on('player.leave', (gameShortId, playerId) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getPlayerList(gameShortId).leavePlayer({playerId: playerId});
        }
    });
    socket.on('player.status', (gameShortId, playerId, status) => {
        if (gameSessionController.isValidGameShortId(gameShortId)) {
            gameSessionController.getPlayerList(gameShortId).updatePlayerStatus({playerId: playerId}, status);
        }
    });

    socket.on('disconnect', () => {
        // console.log('disconnect', socket.id);
    });

    // /////////////////////////////////////////////////////
    // Game session events
    //
    // createGame
    socket.on('game.create', (data, callback) => {
        const gameSession = gameSessionController.create(data);
        const gameShortId = gameSession.shortId;

        /**
         * Subscribe to game session changes
         */
        // When the game session changes, emit the new state to all clients in the game
        gameSession.subscribe(['status','startedAt','endedAt','currentLevelId'], (property, newValue, oldValue) => {
            console.log('Game session updated', property,'from', oldValue,'to', newValue);
            io.to(gameShortId).emit('game.updated', {
                property: property,
                newValue: newValue,
                oldValue: oldValue
            });
        });

        /**
         * Subscribe to player list changes
         */
        // When the player list changes, emit the new state to all clients in the game
        gameSession.playerlist.subscribe('players', (newPlayerList) => {
            io.to(gameShortId).emit('playerlist.updated', newPlayerList);
        });

        /**
         * Subscribe to chat changes
         */
        gameSession.chat.subscribe('latestMessage', (latestMessage) => {
            io.to(gameShortId).emit('chat.message', latestMessage.toJSON());
        });

        // gameSessionController.storeGameSession(gameSession);

        // Sending response to client
        callback({ success: true, gameSession: gameSession });
    });
    // Starting a game session
    socket.on('game.start', (gameShortId, data) => {
        console.log('[socket: game.start] Start game session', gameShortId);
        if (gameSessionController.start(gameShortId, data)) {
            console.log('Game session started',data.startedAt);
        }
    });
    // Completing a game session
    /* socket.on('game.complete', (gameShortId, data) => {
        console.log('[socket: game.ended] Complete game session:', gameShortId);
        if (gameSessionController.complete(gameShortId, data)) {
            socket.to(gameShortId).emit('game.completed', {
                gameShortId: gameShortId,
                endedAt: gameSessionController.getSession(gameShortId).endedAt,
                players: gameSessionController.getPlayerList(gameShortId).players
            });
        }
    });*/

    socket.on('game.status', (gameShortId, status) => {
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
    socket.on('chat.message', (gameShortId, messageData) => {
        console.log('Received chat message:', messageData);
        const chat = gameSessionController.getChat(gameShortId);
        try {
            const newMessage = Message.fromJSON(messageData);
            chat.addMessage(newMessage);
            //socket.to(gameShortId).emit('chat.message', newMessage.toJSON());
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
