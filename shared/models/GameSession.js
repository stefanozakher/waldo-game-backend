// Import dependencies in Node.js environment
if (typeof require !== 'undefined') {
    var shortid = require('shortid');
    var ReactiveModel = require('./ReactiveModel');
    var PlayerList = require('./PlayerList');
    var Chat = require('./Chat');
}

// Configure shortid in Node.js environment
if (typeof shortid !== 'undefined') {
    shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_');
}

class GameSession extends ReactiveModel {
    constructor({
        shortId = null,
        playtimeInSeconds = 180,
        status = 'created',
        startedAt = null,
        endedAt = null,
        chat = null,
        playerlist = null,
        levels = {},
        levelsIds = [],
        currentLevelId = null
    } = {}) {
        // Generate shortId only if shortid is available (server-side) and not provided
        shortId = shortId || (typeof shortid !== 'undefined' ? shortid.generate().slice(0, 6) : null);

        // Initial state
        const initialState = {
            shortId: shortId,
            playtimeInSeconds: playtimeInSeconds,
            status: status,
            startedAt: startedAt,
            endedAt: endedAt,
            chat: chat ? (chat instanceof Chat ? chat : Chat.fromJSON(chat)) : new Chat(shortId),
            playerlist: playerlist ? (playerlist instanceof PlayerList ? playerlist : PlayerList.fromJSON(playerlist)) : new PlayerList(shortId),
            levels: levels,
            levelsIds: levelsIds,
            currentLevelId: currentLevelId
        };

        // Call the parent constructor with the initial state
        super(initialState);
    }

    // Getters
    get shortId() { return this.state.shortId; }
    get playtimeInSeconds() { return this.state.playtimeInSeconds; }
    get status() { return this.state.status; }
    get startedAt() { return this.state.startedAt; }
    get endedAt() { return this.state.endedAt; }
    get chat() { return this.state.chat; }
    get playerlist() { return this.state.playerlist; }
    get levels() { return this.state.levels; }
    get levelsIds() { return this.state.levelsIds; }
    get currentLevelId() { return this.state.currentLevelId; }

    // Setters
    set shortId(value) { this.state.shortId = value; }
    set status(value) {
        // Validate status
        const validStatuses = ['created', 'waiting', 'playing', 'completed', 'timeout'];
        if (!validStatuses.includes(value)) {
            throw new Error(`Invalid status: ${value}. Valid statuses are: ${validStatuses.join(', ')}`);
        }
        this.state.status = value;
    }
    set startedAt(value) { this.state.startedAt = value; }
    set endedAt(value) { this.state.endedAt = value; }
    set chat(value) { this.state.chat = value instanceof Chat ? value : Chat.fromJSON(value); }
    set playerlist(value) { this.state.playerlist = value instanceof PlayerList ? value : PlayerList.fromJSON(value); }
    set levels(value) { value.forEach((l) => this.addLevel(l)); }
    set currentLevelId(value) { this.state.currentLevelId = value; }

    // Methods to modify arrays
    addLevel(level) {
        this.state.levels = { 
            ...this.state.levels, 
            [level.id]: level 
        };
        this.state.levelsIds = [...this.state.levelsIds, level.id];
    }

    removeLevel(levelId) {
        const { [levelId]: removedLevel, ...remainingLevels } = this.state.levels;
        this.state.levels = remainingLevels;
        this.state.levelsIds = this.state.levelsIds.filter(id => id !== levelId);
    }

    start(startedAt) {
        if (this.status !== 'waiting') {
            console.log('Failed to start game session. Game session status', this.status);
            return false;
        }
        this.state.status = 'playing';
        this.state.startedAt = startedAt;
        this.state.currentLevelId = this.state.levelsIds[0];
        return true;
    }

    complete(endedAt) {
        if (this.status !== 'playing'){
            console.log('Failed to complete game session. Game session status', this.status);
            return false;
        }
        this.state.status = 'completed';
        this.state.endedAt = endedAt;
        return true;
    }

    timeout(endedAt){
        if (this.status !== 'playing') {
            console.log('Failed to timeout game session. Game session status', this.status);
            return false;
        }
        this.state.status = 'timeout';
        this.state.endedAt = endedAt;
        return true;
    }

    getCurrentLevel() {
        return this.state.levels[this.state.currentLevelId];
    }

    nextLevel() {
        const currentIndex = this.state.levelsIds.indexOf(this.state.currentLevelId);
        if (currentIndex < this.state.levelsIds.length - 1) {
            this.state.currentLevelId = this.state.levelsIds[currentIndex + 1];
        }
    }

    toJSON() {
        return {
            ...this.state,
            playerlist: this.state.playerlist ? this.state.playerlist.toJSON() : null,
            chat: this.state.chat ? this.state.chat.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new GameSession(json);
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameSession;
} else if (typeof window !== 'undefined') {
    window.GameSession = GameSession;
}
