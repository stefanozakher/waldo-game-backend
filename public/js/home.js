const getSelectedLevelsIds = () => {
    const levelsIds = [];
    const checkboxes = document.querySelectorAll('input[name="selectedLevels[]"]:checked');

    checkboxes.forEach(checkbox => {
        levelsIds.push(checkbox.value);
    });

    return levelsIds;
};
document.getElementById('gameForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const seconds = document.getElementById('seconds').value;
    const levelsIds = getSelectedLevelsIds();

    socket.emit('createGame', { seconds: seconds, levelsIds: levelsIds }, (response) => {
        if (response.success) {
            window.location.href = `/${response.gameSession.short_id}`;
        } else {
            alert('Failed to create game session');
        }
    });
});