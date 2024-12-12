class ClientGameLevelsController {
    constructor(gameShortId, gameSession) {
        this.gameShortId = gameShortId;
        this.gameBoard = null;
        this.gameBoardZoom = null;
        this.levels = gameSession.levels; // Array of game levels
        this.currentLevelIndex = 0; // Track the current level

        this.initializeElements();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');

        if (this.gameBoard) {
            this.setupDoubleClickEvent();
        }
    }

    setupDoubleClickEvent() {
        const gameBoardImage = document.getElementById('gameBoardImage');

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
        const gameBoardImage = document.getElementById('gameBoardImage');
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

    loadCurrentLevel() {
        const level = this.levels[this.currentLevelIndex];
        console.log('Loading level:', level);
        this.updateLevelUI(level);

        var frame = document.getElementById('gameBoard');

        this.gameBoardZoom = WZoom.create('#gameBoardImage', {
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
