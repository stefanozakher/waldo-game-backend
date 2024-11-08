const express = require('express');
const router = express.Router();
const gameSessions = require('../store/gameSessions');
const gamePlayerLists = require('../store/gamePlayerLists');

router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home',
        page: 'pages/home'
    });
});

router.get('/:gameShortId', (req, res) => {
    const gameShortId = req.params.gameShortId;
    const gameSession = gameSessions[gameShortId];
    const playerList = gamePlayerLists[gameShortId];

    if (!gameSession) {
        return res.status(404).send('Game session not found');
    }

    res.render('index', {
        title: `Game ${gameShortId}`,
        page: 'pages/game',
        gameSession: gameSession,
        gameShortId: gameShortId,
        players: playerList ? playerList.getPlayers() : []
    });
});

module.exports = router;
