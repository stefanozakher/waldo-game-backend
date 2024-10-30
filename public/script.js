// script.js

document.getElementById('startBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/create-session');
    const data = await response.json();
    if (data.sessionId && data.link) {
      // Redirect the player to the new session's lobby
      window.location.href = data.link;
    } else {
      alert('Failed to create a new game session.');
    }
  } catch (error) {
    console.error('Error creating session:', error);
    alert('An error occurred while creating the game session.');
  }
});