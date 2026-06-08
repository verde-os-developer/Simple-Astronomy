// camera.js

// Global camera object accessible by other scripts
window.camera = {
    x: 0,
    y: 0,
    zoom: 1,
    isDragging: false,
    startX: 0,
    startY: 0
};

// Set up all camera listeners once the window and canvas are ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('spaceCanvas');
    if (!canvas) return;

    // 1. Zooming with the mouse wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent the web page from jumping/scrolling
        
        let zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        let newZoom = window.camera.zoom * zoomFactor;
        
        // Safety bounds so you don't zoom into infinity or flip upside down
        if (newZoom > 0.05 && newZoom < 20) {
            window.camera.zoom = newZoom;
        }
    }, { passive: false });

    // 2. Start dragging to pan
    canvas.addEventListener('mousedown', (e) => {
        // Triggers camera pan only if using:
        // - Middle Click (Scroll Wheel Click) OR Right Click OR holding Shift Key
        // This ensures normal Left Clicks still work for spawning particles perfectly!
        if (e.button === 1 || e.button === 2 || e.shiftKey) {
            window.camera.isDragging = true;
            window.camera.startX = e.clientX;
            window.camera.startY = e.clientY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    // 3. Moving the mouse while dragging
    window.addEventListener('mousemove', (e) => {
        if (!window.camera.isDragging) return;

        let dx = e.clientX - window.camera.startX;
        let dy = e.clientY - window.camera.startY;

        // Shift camera center relative to current zoom scale
        window.camera.x -= dx / window.camera.zoom;
        window.camera.y -= dy / window.camera.zoom;

        window.camera.startX = e.clientX;
        window.camera.startY = e.clientY;
    });

    // 4. Stop dragging
    window.addEventListener('mouseup', (e) => {
        if (window.camera.isDragging) {
            window.camera.isDragging = false;
            canvas.style.cursor = 'default';
        }
    });

    // Prevent the standard right-click context menu from popping up when dragging
    canvas.addEventListener('contextmenu', e => e.preventDefault());
});