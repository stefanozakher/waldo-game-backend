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
    constructor(playtimeInSeconds) {
        // Generate shortId only if shortid is available (server-side)
        const shortId = typeof shortid !== 'undefined' ? shortid.generate().slice(0, 6) : null;
        super({
            shortId: shortId,
            playtimeInSeconds: playtimeInSeconds,
            /**
             * Game session status
             * - created: game session is created
             * - waiting: waiting for players to join
             * - playing: game is in progress
             * - completed: game is completed
             */
            status: 'created',
            startedAt: null,
            endedAt: null,
            chat: new Chat(shortId),
            playerlist: new PlayerList(shortId),
            levels: {},
            levelsIds: [],
            currentLevelId: null
        });
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
    set shortId(value) {
        this.state = {
            ...this.state,
            shortId: value
        };
    }

    set status(value) {
        this.state = {
            ...this.state,
            status: value
        };
        // console.log('Is Proxy?:', Proxy.isProxy?.(this.state));
        // console.log('Status observers:', this.observers?.status || 'No observers');
        // this.notifyObservers('status', value, this.state.status);
    }

    set startedAt(value) {
        this.state = {
            ...this.state,
            startedAt: value
        };
    }

    set endedAt(value) {
        this.state = {
            ...this.state,
            endedAt: value
        };
    }

    set chat(value) {
        this.state = {
            ...this.state,
            chat: value instanceof Chat ? value : Chat.fromJSON(value)
        };
    }

    set playerlist(value) {
        this.state = {
            ...this.state,
            playerlist: value instanceof PlayerList ? value : PlayerList.fromJSON(value)
        };
    }

    set levels(value) {
        value.forEach((l) => this.addLevel(l));
    }

    set currentLevelId(value) {
        this.state = {
            ...this.state,
            currentLevelId: value
        };
    }

    // Methods to modify arrays
    addLevel(level) {
        this.state = {
            ...this.state,
            levels: { 
                ...this.state.levels, 
                [level.id]: level 
            },
            levelsIds: [...this.state.levelsIds, level.id]
        };
    }

    removeLevel(levelId) {
        const { [levelId]: removedLevel, ...remainingLevels } = this.state.levels;
        this.state = {
            ...this.state,
            levels: remainingLevels,
            levelsIds: this.state.levelsIds.filter(id => id !== levelId)
        };
    }

    startGameSession(startedAt) {
        this.state = {
            ...this.state,
            status: 'playing',
            startedAt: startedAt,
            currentLevelId: this.state.levelsIds[0]
        };
    }

    endGameSession(endedAt) {
        this.state = {
            ...this.state,
            status: 'completed',
            endedAt: endedAt
        };
    }

    getCurrentLevel() {
        return this.state.levels[this.state.currentLevelId];
    }

    toJSON() {
        return {
            ...this.state,
            playerlist: this.state.playerlist ? this.state.playerlist.toJSON() : null,
            chat: this.state.chat ? this.state.chat.toJSON() : null
        };
    }

    static fromJSON(json) {
        const gameSession = new GameSession(json.playtimeInSeconds);
        gameSession._state = {
            ...json,
            playerlist: json.playerlist ? PlayerList.fromJSON(json.playerlist) : new PlayerList(json.shortId),
            chat: json.chat ? Chat.fromJSON(json.chat) : new Chat(json.shortId)
        };
        return gameSession;
    }
}

// Make it available to both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameSession;
} else if (typeof window !== 'undefined') {
    window.GameSession = GameSession;
}
