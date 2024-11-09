const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const indexRouter = require('./routes/index');
const GameSessionController = require('./controllers/GameSessionController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve shared models
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Use routes
app.use('/', indexRouter);

// Initialize GameSessionController
const gameSessionController = new GameSessionController(io);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Game session events
    socket.on('createGame', (data, callback) => gameSessionController.createGame(data, callback));
    socket.on('startGame', (gameShortId, data) => gameSessionController.startGame(gameShortId, data));
    socket.on('endGame', (gameShortId, data) => gameSessionController.endGame(gameShortId, data));
    // Player events
    socket.on('joinGame', (data) => gameSessionController.players.joinGame(socket, data));
    socket.on('leaveGame', (data) => gameSessionController.players.leaveGame(data));
    socket.on('playerReady', (data) => gameSessionController.players.setPlayerReady(data));
    socket.on('disconnect', () => gameSessionController.players.disconnect(socket));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
