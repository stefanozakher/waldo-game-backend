const express = require('express');
const gameLevels = require('../store/gameLevels');

function createRouter(gameSessionController) {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.render('index', { 
            title: 'Home',
            page: 'pages/home',
            gameLevels: gameLevels
        });
    });

    router.get('/:gameShortId([A-Za-z0-9_-]{6})', (req, res) => {
        const gameShortId = req.params.gameShortId;
        const gameSession = gameSessionController.getSession(gameShortId);

        if (!gameSession) {
            return res.status(404).send('Game session not found');
        }

        const playerList = gameSessionController.getPlayerList(gameShortId);

        res.render('index', {
            title: `Game ${gameShortId}`,
            page: 'pages/game',
            gameShortId: gameShortId,
            gameSession: gameSession.toJSON(),
            players: playerList ? playerList.players : []
        });
    });

    return router;
}

module.exports = createRouter;
