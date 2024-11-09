if (!socket) { const socket = io(); }

const clientPlayerList = new ClientPlayerListController(socket, gameShortId);
const clientGameSession = new ClientGameSessionController(socket, gameShortId, gameSession);

function startGame() {
    let startTime = Date.now();
    socket.emit('startGame', gameShortId, { started_at: startTime });

    clientGameSession.startGame(startTime);

    document.getElementById('startGameContainer').style.display = 'none';
}

window.addEventListener('beforeunload', () => {
    clientPlayerList.leaveGame();
    socket.disconnect();
});

// document.addEventListener('visibilitychange', () => {
//     if (document.hidden) {
//         clientPlayerList.leaveGame();
//         socket.disconnect();
//     }
// });