// Define some game rules
const MISSED_HITS_TO_TRIGGER_PENALTY = 3;
const MISSED_HITS_TIME_THRESHOLD = 5000; // milliseconds
const MISSED_HIT_MESSAGE_DURATION = 1000; // milliseconds
const MISSED_HIT_MESSAGES = ['Missed!', 'Try again!', 'Not quite!', 'Still no!', 'Really? Try again!'];
const HIT_MESSAGE = 'You found him!';
const HIT_MESSAGE_DURATION = 1000; // milliseconds

// Penalty
var isPenaltyActive = false; // Whether the penalty is active
const PENALTY_TIME = 10000; // milliseconds
const PENALTY_MESSAGE = `Missed too many times! ${PENALTY_TIME / 1000} seconds wait.`;

class GameBoardComponent {
    constructor(containerGameBoard = null, containerGameLevel = null) {
        this._containerGameBoard = containerGameBoard || document.getElementById('game-board');
        this._containerGameLevel = containerGameLevel || document.getElementById('game-level');

        // Create initial HTML structure
        this.containerGameBoard.innerHTML = `
            <p>Nothing yet.</p>
        `;

        this.unsubscribe = new Set();
        this.registeredMissedHits = new Array();
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

            if (this.gameSession.status === 'playing')
                this.renderGameLevel();
        }
    }

    setupSubscription() {
        // Subscribe to gameSession changes
        this.unsubscribe.add(this.gameSession.subscribe('status', (newStatus) => {
            console.log('GameBoardComponent: New game session status: ', newStatus);
            this.renderGameBoard();

            if (newStatus === 'playing') {
                this.renderGameLevel();
            }
        }));
        this.unsubscribe.add(this.gameSession.subscribe('currentLevelId', (newLevelId) => {
            console.log('GameBoardComponent: New current level id: ', newLevelId);
            this.renderGameLevel();
        }));

        // Setup a hook to start the game, if the game session is still 'waiting'.
        this.unsubscribePlayers = this.gameSession.playerlist.subscribe('players', (newPlayers) => {
            // Only re-render the game board once all players are ready
            if (this.gameSession.playerlist.areAllPlayersReady() && this.gameSession.status === 'waiting') {
                console.log('GameBoardComponent: All players are ready and game session is waiting. Game can start.');
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

    setupGuessingWaldoEvent() {
        const gameBoardImage = document.getElementById('game-board-image');

        if (gameBoardImage) {
            // For desktop
            gameBoardImage.addEventListener('dblclick', (event) => this.guessWaldo(event));

            // For mobile devices
            let previousTouchEvent = '';
            let previousTouchEventTime = 0;
            let doubleTapEvent = false;
            gameBoardImage.addEventListener('touchmove', (event) => {
                previousTouchEvent = "";
                previousTouchEventTime = 0;
                doubleTapEvent = false;
            });
            gameBoardImage.addEventListener('touchcancel', (event) => {
                previousTouchEvent = "";
                previousTouchEventTime = 0;
                doubleTapEvent = false;
            });
            gameBoardImage.addEventListener('touchstart', (event) => {
                const now = new Date().getTime();
                if (previousTouchEvent === "touchend" && previousTouchEventTime > now - 300) {
                    doubleTapEvent = true;
                }
                previousTouchEvent = "touchstart";
                previousTouchEventTime = now;
            });
            gameBoardImage.addEventListener('touchend', (event) => {
                if (previousTouchEvent === "touchstart" && doubleTapEvent) {
                    // End of a double tap
                    this.guessWaldo(event.changedTouches[0]);
                }
                previousTouchEvent = "touchend";
                previousTouchEventTime = new Date().getTime();
                doubleTapEvent = false;
            }, { passive: false });
        }
    }

    guessWaldo(event) {
        if (isPenaltyActive) {
            return;
        }

        const timeOfClick = Date.now();
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
        const clickX = event.clientX;
        const clickY = event.clientY;
        const displayX = clickX - rect.left;
        const displayY = clickY - rect.top;

        // Convert to coordinates relative to original image dimensions
        const x = displayX * scaleX;
        const y = displayY * scaleY;

        const currentLevel = this.gameSession.getCurrentLevel();

        if (currentLevel && currentLevel.targetArea) {
            const { xMin, xMax, yMin, yMax } = currentLevel.targetArea;

            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                // Add your success logic here
                this.guessSuccess(event, timeOfClick);
            } else {
                // Add your miss logic here
                this.guessFailed(event, timeOfClick);
            }
        } else {
            console.error('No target area defined for current level:', {
                currentLevelIndex: this.currentLevelIndex,
                hasLevel: !!currentLevel,
                hasTargetArea: !!(currentLevel && currentLevel.targetArea)
            });
        }
    }

    guessSuccess(event, timeOfClick) {
        showClickMessage(event.clientX, event.clientY, HIT_MESSAGE, HIT_MESSAGE_DURATION);
        sendSystemMessage(new Message({
            message: `${this.gameSession.playerlist.currentPlayer.playerName} found him in level ${this.gameSession.getCurrentLevel().title}!`,
            timestamp: timeOfClick
        }));
        this.gameSession.nextLevel();
    }

    guessFailed(event, timeOfClick) {
        if (this.registeredMissedHits.length >= MISSED_HITS_TO_TRIGGER_PENALTY) {
            if ((timeOfClick - this.registeredMissedHits[0]) < MISSED_HITS_TIME_THRESHOLD) {
                // Activate penalty
                if (!isPenaltyActive) {
                    isPenaltyActive = true;
                    showClickMessage(event.clientX, event.clientY, PENALTY_MESSAGE, PENALTY_TIME);
                    setTimeout(() => {
                        isPenaltyActive = false;
                    }, PENALTY_TIME);
                }
            }
            this.registeredMissedHits.shift();
        } else {
            this.registeredMissedHits.push(timeOfClick);            
        }

        showClickMessage(event.clientX, event.clientY, MISSED_HIT_MESSAGES[Math.floor(Math.random() * MISSED_HIT_MESSAGES.length)], MISSED_HIT_MESSAGE_DURATION);
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
        this.setupGuessingWaldoEvent();
    }

    renderOverlayMessage(message) {
        const overlay = document.getElementById('overlay');

        if (!overlay) return;

        overlay.innerHTML = message;
        overlay.style.display = 'block';
        overlay.classList.remove('d-none'); // Reset animation
        overlay.classList.remove('fade-out'); // Reset animation

        overlay.addEventListener('animationend', (event) => {
            if (event.animationName === 'fadeOut') {
                console.log('Fade-out animation has completed.');
                // Perform additional logic here, e.g., hiding the element
                overlay.style.display = 'none';
            }
        });

        setTimeout(() => {
            overlay.classList.add('fade-out');
        }, 2000); // Adjust the delay as needed
    }
}
