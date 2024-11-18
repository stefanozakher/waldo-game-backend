class ClientGameLevelsController {
    constructor(gameShortId, gameSession) {
        this.gameShortId = gameShortId;
        this.levels = gameSession.levels; // Array of game levels
        this.currentLevelIndex = 0; // Track the current level

        this.initializeElements();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        
        if (!this.gameBoard) {
            console.error('Failed to find game elements:', {
                container: !!this.gameBoard
            });
        } else {
            this.gameBoard.addEventListener('click', () => {
                console.log('Send button clicked');
                this.loadNextLevel();
            });
        }
    }

    loadCurrentLevel(){
        const level = this.levels[this.currentLevelIndex];
        console.log('Loading level:', level);
        this.updateLevelUI(level);
    }

    loadNextLevel() {
        if (this.currentLevelIndex < 0) {
            console.error('Invalid level index:', this.currentLevelIndex);
            return null;
        } else if (this.currentLevelIndex >= this.levels.length) {
            return null;
        }

        const level = this.levels[this.currentLevelIndex];
        console.log('Loading level:', level);

        // Here you would implement the logic to display the level
        // For example, updating the UI with level details
        this.updateLevelUI(level);

        this.currentLevelIndex++;

        return true;
    }

    updateLevelUI(level) {
        try {
            const templateContent = document.getElementById('level-template').innerHTML;
            const template = Handlebars.compile(templateContent);
            
            this.gameBoard.innerHTML = template({
                ...level
            });
        } catch (error) {
            console.error('Error updating game board UI:', error);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientGameLevelsController;
}
