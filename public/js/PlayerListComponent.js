class PlayerListComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.unsubscribe = new Set();
    }

    get playerList() { return this._playerList; }

    // Initialize the component with a player list
    init(playerList) {
        if (this._playerList !== playerList) {
            this.cleanup();
            this._playerList = playerList;
            this.setupSubscription();

            this.render(this.playerList.toJSON());
        }
    }

    setupSubscription() {
        // Subscribe to all changes in the player list
        this.unsubscribe.add(this.playerList.subscribe('players', (newPlayerList) => {
            this.render(newPlayerList);
        }));
    }

    // Clean up when destroying the component
    destroy() { this.cleanup(); }
    cleanup() {
        this._playerList = null;
        this.unsubscribe.forEach((unsub) => unsub());
        this.unsubscribe.clear();
    }

    render(players = null) {
        console.log('PlayerListComponent: render', players || this.playerList.toJSON() );
        // Compile and render the template
        const template = Handlebars.compile(document.getElementById('template-player-list').innerHTML);
        this.container.innerHTML = template({
            players: players || this.playerList.toJSON(),
            currentPlayerId: this.playerList.currentPlayer.playerId
        });
    }
}
