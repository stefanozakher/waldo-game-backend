if (!socket) { const socket = io(); }

const clientPlayerList = new ClientPlayerListController(socket, gameShortId);

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