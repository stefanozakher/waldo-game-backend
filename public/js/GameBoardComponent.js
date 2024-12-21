class GameBoardComponent {
    constructor(containerGameBoard, containerGameLevel) {
        this.containerGameBoard = containerGameBoard || document.getElementById('game-board');
        this.containerGameLevel = containerGameLevel || document.getElementById('game-level');

        // Create initial HTML structure
        this.containerGameBoard.innerHTML = `
            <p>Nothing yet.</p>
        `;
    }
    
    init(gameSession) {
        this.gameSession = gameSession;
        
        // Subscribe to gameSession changes
        this.unsubscribeStatus = gameSession.subscribe('status', (newStatus,oldStatus) => {
            /**
             * Example of a newGameSession:
             * {
             *   status: 'playing',
             *   startedAt: '2024-01-01T00:00:00Z',
             *   currentLevelId: '1234567890',
             *   levels: [ ... ],
             *   levelsIds: [ ... ],
             *   playerlist: { ... },
             *   chat: { ... }
             * }
             */
            this.renderGameBoard();
        });
        this.unsubscribePlayers = gameSession.playerlist.subscribe('players', (newGameSession,oldGameSession) => {
            // Only re-render the game board once all players are ready
            if (this.gameSession.playerlist.areAllPlayersReady()) {
                this.renderGameBoard();
                this.unsubscribePlayers();
            }
        });
        
        this.renderGameBoard();
    }
    
    destroy() {
        if (this.unsubscribeStatus) {
            this.unsubscribeStatus();
        }
        if (this.unsubscribePlayers) {
            this.unsubscribePlayers();
        }
    }
    
    renderGameBoard() {
        console.log('Rendering game board:', this.gameSession.toJSON());
        // Compile and render the template
        const template = Handlebars.compile(document.getElementById('template-game-board').innerHTML);
        this.containerGameBoard.innerHTML = template({
            gameSession: this.gameSession.toJSON(),
            players: this.gameSession.playerlist.players,
            currentPlayer: this.gameSession.playerlist.currentPlayer.toJSON(),
            currentPlayerId: this.gameSession.playerlist.currentPlayer.playerId,
            areAllPlayersReady: this.gameSession.playerlist.areAllPlayersReady()
        });
    }

    /**
     * Render the game level
     */

    setupGameBoardZoom() {
        const level = this.gameSession.getCurrentLevel();
        console.log('Loading level:', level);

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
                this.loadNextLevel();
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

    renderGameLevel(levelId = null){
        const levelIdToRender = levelId || this.gameSession.currentLevelId;
        const levelToRender = this.gameSession.levels[ levelIdToRender ];

        const template = Handlebars.compile(document.getElementById('template-game-level').innerHTML);
        this.containerGameLevel.innerHTML = template({
            gameSession: this.gameSession.toJSON(),
            currentLevel: levelToRender,
            currentLevelId: levelIdToRender
        });

        this.setupGameBoardZoom();
        this.setupDoubleClickEvent();
    }
}
