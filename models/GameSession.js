const shortid = require('shortid');

class GameSession {
    constructor(playtime_in_seconds) {
        this.short_id = shortid.generate();
        this.playtime_in_seconds = playtime_in_seconds;
        this.status = 'waiting';
        this.started_at = null;
        this.ended_at = null;
    }
}

module.exports = GameSession;
