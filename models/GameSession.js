const shortid = require('shortid');

// Configure shortid
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_');
// shortid.length(6);  // Set length to 6

class GameSession {
    constructor(playtime_in_seconds) {
        this.short_id = shortid.generate().slice(0, 6);
        this.playtime_in_seconds = playtime_in_seconds;
        this.status = 'waiting';
        this.started_at = null;
        this.ended_at = null;
        this.chat = null;
        this.playerlist = null;
        this.levels = [];
        this.levelsIds = [];
    }
}

module.exports = GameSession;
