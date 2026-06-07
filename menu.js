// menu.js - HUD for Simple Astronomy

function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'game-hud';
    hud.style.position = 'absolute';
    hud.style.top = '60px'; // Below your UI bar
    hud.style.left = '10px';
    hud.style.background = 'rgba(0, 0, 0, 0.5)';
    hud.style.color = '#33ff33'; // Using your favorite Green
    hud.style.padding = '10px';
    hud.style.fontFamily = 'monospace';
    hud.style.pointerEvents = 'none'; // Click through the HUD
    document.body.appendChild(hud);
}

function updateHUD() {
    const hud = document.getElementById('game-hud');
    if (hud) {
        hud.innerHTML = `
            PARTICLES: ${window.particles.length}<br>
            ZOOM: ${window.camera.zoom.toFixed(2)}x<br>
            STATE: ${window.isPaused ? 'PAUSED' : 'RUNNING'}
        `;
    }
}

// Initialize and loop
createHUD();
setInterval(updateHUD, 200); // Update twice a second for performance