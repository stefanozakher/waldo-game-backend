class PlayerListComponent {
    constructor(containerElement) {
        this.container = containerElement;
    }

    // Initialize the component with a player list
    init(playerList) {
        if (this._playerList !== playerList) {
            this.cleanup();
            this._playerList = playerList;
            this.setupSubscription();
        }
    }

    // Clean up when destroying the component
    destroy() {
        this.cleanup();
    }

    setupSubscription() {
        // Subscribe to all changes in the player list
        this.unsubscribe = this.playerList.subscribe('players', ({ newPlayerList }) => {
            this.render(newPlayerList);
        });

        // Initial render
        this.render(this.playerList.toJSON());
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    get playerList() {
        return this._playerList;
    }

    render(players = null) {
        // Compile and render the template
        const template = Handlebars.compile(document.getElementById('template-player-list').innerHTML);
        this.container.innerHTML = template({
            players: players || this.playerList.players,
            currentPlayerId: this.playerList.currentPlayer.playerId
        });
    }
}
