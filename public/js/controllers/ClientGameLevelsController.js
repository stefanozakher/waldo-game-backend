class ClientGameLevelsController {
    constructor(gameShortId, gameSession) {
        this.gameShortId = gameShortId;
        this.gameBoardZoom = null;
        this.levels = gameSession.levels; // Array of game levels
        this.currentLevelIndex = 0; // Track the current level

        this.initializeElements();
    }

    initializeElements() {
        document.addEventListener('DOMContentLoaded', () => {
            this.gameBoard = document.getElementById('gameBoard');
            this.setupDoubleClickEvent();
        });

        if (!this.gameBoard) {
            console.error('Failed to find game elements:', {
                container: !!this.gameBoard
            });
        }
    }

    loadCurrentLevel() {
        const level = this.levels[this.currentLevelIndex];
        console.log('Loading level:', level);
        this.updateLevelUI(level);

        var frame = document.getElementById('gameBoard');

        this.gameBoardZoom = WZoom.create('#gameBoard-image', {
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
        const gameBoardImage = document.getElementById('gameBoard-image');
        console.log('Setting up double-click event handler. Image element found:', !!gameBoardImage);

        if (gameBoardImage) {
            gameBoardImage.addEventListener('dblclick', (event) => {
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

                const currentLevel = this.levels[this.currentLevelIndex];

                if (currentLevel && currentLevel.targetArea) {
                    const { xMin, xMax, yMin, yMax } = currentLevel.targetArea;

                    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                        console.log('HIT! Click coordinates are within target area');
                        // Add your success logic here
                        this.loadNextLevel();
                    } else {
                        console.log('MISS! Click coordinates are outside target area');
                        // Add your miss logic here
                    }
                } else {
                    console.error('No target area defined for current level:', {
                        currentLevelIndex: this.currentLevelIndex,
                        hasLevel: !!currentLevel,
                        hasTargetArea: !!(currentLevel && currentLevel.targetArea)
                    });
                }
            });
            console.log('Double-click event handler successfully attached');
        } else {
            console.error('Failed to set up double-click event: Game board image not found');
        }
    }

    loadNextLevel() {
        if (this.currentLevelIndex < 0) {
            console.error('Invalid level index:', this.currentLevelIndex);
            return null;
        } else if (this.currentLevelIndex >= this.levels.length) {
            return null;
        }

        this.currentLevelIndex++;
        this.loadCurrentLevel();

        return true;
    }

    updateLevelUI(level) {
        try {
            const templateContent = document.getElementById('level-template').innerHTML;
            const template = Handlebars.compile(templateContent);

            this.gameBoard.innerHTML = template({
                ...level
            });

            this.setupDoubleClickEvent();
        } catch (error) {
            console.error('Error updating game board UI:', error);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientGameLevelsController;
}
