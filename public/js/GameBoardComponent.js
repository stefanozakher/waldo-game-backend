class GameBoardComponent {
    constructor(containerGameBoard = null, containerGameLevel = null) {
        this._containerGameBoard = containerGameBoard || document.getElementById('game-board');
        this._containerGameLevel = containerGameLevel || document.getElementById('game-level');

        // Create initial HTML structure
        this.containerGameBoard.innerHTML = `
            <p>Nothing yet.</p>
        `;

        this.unsubscribe = new Set();
    }

    get gameSession() { return this._gameSession; }
    get containerGameBoard() {
        if (this._containerGameBoard === null) { 
            this._containerGameBoard = document.getElementById('game-board');
        }
        return this._containerGameBoard;
    }
    get containerGameLevel() {
        if (this._containerGameLevel === null) {
            this._containerGameLevel = document.getElementById('game-level');
        }
        return this._containerGameLevel;
    }
    
    init(gameSession) {
        if (this._gameSession !== gameSession) {
            this.cleanup();
            this._gameSession = gameSession;
            this.setupSubscription();

            this.renderGameBoard();
        }
    }

    setupSubscription() {
        // Subscribe to gameSession changes
        this.unsubscribe.add(this.gameSession.subscribe('status', (newStatus) => {
            console.log('GameBoardComponent: received update on game session status. New value:', newStatus);
            this.renderGameBoard();

            if (newStatus === 'playing') {
                this.renderGameLevel();
            }
        }));
        this.unsubscribe.add(this.gameSession.subscribe('currentLevelId', (newLevelId) => {
            console.log('GameBoardComponent: received update on current level. New value:', newLevelId);
            this.renderGameLevel();
        }));
        this.unsubscribePlayers = this.gameSession.playerlist.subscribe('players', (newPlayers) => {
            console.log('GameBoardComponent: checking if all players are ready. New players:', newPlayers);
            // Only re-render the game board once all players are ready
            if (this.gameSession.playerlist.areAllPlayersReady()) {
                this.renderGameBoard();
                this.unsubscribePlayers();
            }
        });
    }

    destroy() { this.cleanup(); }
    cleanup() {
        this._gameSession = null;
        this.unsubscribe.forEach((unsub) => unsub());
        this.unsubscribe.clear();
        if (this.unsubscribePlayers) {
            this.unsubscribePlayers();
            this.unsubscribePlayers = null;
        }
    }

    /**
     * Render the game board
     */
    
    renderGameBoard(gameSession) {
        const gs = gameSession || this.gameSession;
        console.log('GameBoardComponent: render', gs.toJSON());
        // Compile and render the template
        const template = Handlebars.compile(document.getElementById('template-game-board').innerHTML);
        this.containerGameBoard.innerHTML = template({
            gameSession: gs.toJSON(),
            players: gs.playerlist.players,
            currentPlayer: gs.playerlist.currentPlayer.toJSON(),
            currentPlayerId: gs.playerlist.currentPlayer.playerId,
            areAllPlayersReady: gs.playerlist.areAllPlayersReady()
        });
    }

    /**
     * Render the game level
     */

    setupGameBoardZoom() {
        const level = this.gameSession.getCurrentLevel();
        console.log('Loading level:', level);

        var frame = this.containerGameLevel;

        this.gameBoardZoom = WZoom.create('#game-board-image', {
            maxScale: 4,
            onGrab: function () {
                frame.style.cursor = 'grabbing';
            },
            onDrop: function () {
                frame.style.cursor = 'grab';
            },
            zoomOnClick: false,
            zoomOnDoubleClick: false
        });

        window.addEventListener('resize', () => {
            if (this.gameBoardZoom) this.gameBoardZoom.prepare();
        });
    }

    setupDoubleClickEvent() {
        const gameBoardImage = document.getElementById('game-board-image');

        if (gameBoardImage) {
            // For desktop
            gameBoardImage.addEventListener('dblclick', (event) => this.handleImageClick(event));

            // For mobile devices
            let lastTap = 0;
            gameBoardImage.addEventListener('touchend', (event) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 500 && tapLength > 0) {
                    // Convert touch event to equivalent mouse event coordinates
                    const touch = event.changedTouches[0];
                    this.handleImageClick(touch);
                    event.preventDefault(); // Prevent zoom/double-tap gestures
                }
                lastTap = currentTime;
            });
        }
    }

    handleImageClick(event) {
        const gameBoardImage = document.getElementById('game-board-image');
        const rect = gameBoardImage.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        const naturalWidth = gameBoardImage.naturalWidth;
        const naturalHeight = gameBoardImage.naturalHeight;

        // Calculate scaling factors
        const scaleX = naturalWidth / displayWidth;
        const scaleY = naturalHeight / displayHeight;

        // Get click coordinates relative to displayed image
        const displayX = event.clientX - rect.left;
        const displayY = event.clientY - rect.top;

        // Convert to coordinates relative to original image dimensions
        const x = displayX * scaleX;
        const y = displayY * scaleY;

        const currentLevel = this.gameSession.getCurrentLevel();

        if (currentLevel && currentLevel.targetArea) {
            const { xMin, xMax, yMin, yMax } = currentLevel.targetArea;

            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                // Add your success logic here
                this.gameSession.nextLevel();
            } else {
                // Add your miss logic here
            }
        } else {
            console.error('No target area defined for current level:', {
                currentLevelIndex: this.currentLevelIndex,
                hasLevel: !!currentLevel,
                hasTargetArea: !!(currentLevel && currentLevel.targetArea)
            });
        }
    }

    renderGameLevel(gameSession){
        const gs = gameSession || this.gameSession;
        const levelIdToRender = gs.currentLevelId || gs.levelsIds[0];
        const levelToRender = gs.levels[ levelIdToRender ];

        console.log('GameBoardComponent: render level', gs.toJSON(), levelToRender);

        const template = Handlebars.compile(document.getElementById('template-game-level').innerHTML);
        this.containerGameLevel.innerHTML = template({
            gameSession: gs.toJSON(),
            currentLevel: levelToRender,
            currentLevelId: levelIdToRender
        });

        this.setupGameBoardZoom();
        this.setupDoubleClickEvent();
    }
}
