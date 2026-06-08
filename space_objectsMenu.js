// space_objectsMenu.js - Camera-Aware Selection & Vector Throwing
window.selectedGroupId = null;
window.isDraggingVelocity = false;
window.dragStartPoint = { x: 0, y: 0 };
window.dragEndPoint = { x: 0, y: 0 };

function initSpaceObjectsMenu() {
    const canvas = document.getElementById('spaceCanvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // --- FIX 1: TRANSLATE MOUSE CLICK TO TRUE WORLD COORDINATES ---
        let worldMouseX = (mouseX - canvas.width / 2) / window.camera.zoom + window.camera.x;
        let worldMouseY = (mouseY - canvas.height / 2) / window.camera.zoom + window.camera.y;

        // If an object is already selected, check if we are initiating a drag throw from its center
        if (window.selectedGroupId !== null) {
            let center = getGroupCenter(window.selectedGroupId);
            if (center) {
                // Calculate distance in world coordinates, adjusted for zoom scaling
                let dx = worldMouseX - center.x;
                let dy = worldMouseY - center.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                // Clicked near the center of the selection? Start pulling the arrow!
                if (dist < (center.maxRadius + 15)) { 
                    window.isDraggingVelocity = true;
                    window.dragStartPoint = { x: center.x, y: center.y };
                    window.dragEndPoint = { x: mouseX, y: mouseY }; // Store arrow end in screen space for smooth rendering
                    return;
                }
            }
        }

        // Otherwise, look for a world particle directly under the converted cursor
        let clickedParticle = null;
        for (let i = 0; i < window.particles.length; i++) {
            let p = window.particles[i];
            let dx = worldMouseX - p.x;
            let dy = worldMouseY - p.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Give a generous 5-pixel click padding so tiny particles are easy to select
            if (dist <= p.radius + 5) {
                clickedParticle = p;
                break;
            }
        }

        if (clickedParticle && clickedParticle.groupId !== null) {
            window.selectedGroupId = clickedParticle.groupId;
        } else {
            // Clicked empty deep space? Wipe selection
            window.selectedGroupId = null;
            window.isDraggingVelocity = false;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!window.isDraggingVelocity) return;
        
        const rect = canvas.getBoundingClientRect();
        window.dragEndPoint.x = e.clientX - rect.left;
        window.dragEndPoint.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseup', () => {
        // Only launch if we were actively pulling a velocity arrow
        if (window.isDraggingVelocity && window.selectedGroupId !== null) {
            let center = getGroupCenter(window.selectedGroupId);
            
            if (center) {
                // 1. Calculate screen coordinates for the center of the mass clump
                let screenX = (center.x - window.camera.x) * window.camera.zoom + canvas.width / 2;
                let screenY = (center.y - window.camera.y) * window.camera.zoom + canvas.height / 2;

                // 2. Find the distance vector between the center and where your mouse let go
                let dx = window.dragEndPoint.x - screenX;
                let dy = window.dragEndPoint.y - screenY;

                // 3. Scale down the drag force so the planet doesn't instantly fly out of the galaxy
                // Adjust 0.05 higher if you want faster throws, or lower for tiny subtle pushes
                let launchVelocityX = dx * 0.05; 
                let launchVelocityY = dy * 0.05;

                // 4. Inject the new momentum into every particle belonging to this specific cluster!
                for (let i = 0; i < window.particles.length; i++) {
                    let p = window.particles[i];
                    if (p.groupId === window.selectedGroupId) {
                        p.vx += launchVelocityX;
                        p.vy += launchVelocityY;
                    }
                }
            }
        }

        // Reset our dragging trackers cleanly for the next selection push
        window.isDraggingVelocity = false;
    });
}

function drawSpaceObjectsMenu(ctx) {
    if (window.selectedGroupId === null) return;

    let center = getGroupCenter(window.selectedGroupId);
    if (!center) return;

    const canvas = document.getElementById('spaceCanvas');

    let screenX = (center.x - window.camera.x) * window.camera.zoom + canvas.width / 2;
    let screenY = (center.y - window.camera.y) * window.camera.zoom + canvas.height / 2;
    let screenRadius = center.maxRadius * window.camera.zoom;

    // 1. Target Tracking Ring (Dashed UI circle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(screenX, screenY, Math.max(screenRadius + 8, 15), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 2. Visual White Velocity Vector Arrow & Orbit Prediction
    if (window.isDraggingVelocity) {
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2.5;

        // Line drawn from center to mouse position
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(window.dragEndPoint.x, window.dragEndPoint.y);
        ctx.stroke();

        // Arrow head vector triangle
        let angle = Math.atan2(window.dragEndPoint.y - screenY, window.dragEndPoint.x - screenX);
        let headLength = 12;

        ctx.beginPath();
        ctx.moveTo(window.dragEndPoint.x, window.dragEndPoint.y);
        ctx.lineTo(window.dragEndPoint.x - headLength * Math.cos(angle - Math.PI / 6), window.dragEndPoint.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(window.dragEndPoint.x - headLength * Math.cos(angle + Math.PI / 6), window.dragEndPoint.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // --- NEW ORBITS UPDATE: FAINT DOT PATH PREDICTION ---
        // 1. Figure out the immediate launch speed we are aiming with
        let dx = window.dragEndPoint.x - screenX;
        let dy = window.dragEndPoint.y - screenY;
        let launchVx = dx * 0.05;
        let launchVy = dy * 0.05;

        // Find the average current velocity of the selected group to add to our launch speed
        let currentVx = 0, currentVy = 0, matchCount = 0;
        window.particles.forEach(p => {
            if (p.groupId === window.selectedGroupId) {
                currentVx += p.vx;
                currentVy += p.vy;
                matchCount++;
            }
        });
        if (matchCount > 0) {
            currentVx /= matchCount;
            currentVy /= matchCount;
        }

        // 2. Set up dummy simulation steps starting from our group's center
        let simX = center.x;
        let simY = center.y;
        let simVx = currentVx + launchVx;
        let simVy = currentVy + launchVy;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 5]); // Clean dotted styling
        ctx.beginPath();

        // Convert starting world position to screen space
        let startScreenX = (simX - window.camera.x) * window.camera.zoom + canvas.width / 2;
        let startScreenY = (simY - window.camera.y) * window.camera.zoom + canvas.height / 2;
        ctx.moveTo(startScreenX, startScreenY);

        // Step forward 120 frames into the future to map the trajectory
        for (let step = 0; step < 120; step++) {
            // Apply gravity from heavy cores or other bodies in the world
            window.particles.forEach(other => {
                if (other.groupId !== window.selectedGroupId) {
                    let pDx = other.x - simX;
                    let pDy = other.y - simY;
                    let distSq = pDx * pDx + pDy * pDy + 100; // Add soft padding to avoid crazy math dividing by zero
                    let dist = Math.sqrt(distSq);

                    if (dist > 5) {
                        // Standard gravitational pull logic matching your engine
                        let force = (0.1 * other.mass) / distSq; 
                        simVx += (pDx / dist) * force;
                        simVy += (pDy / dist) * force;
                    }
                }
            });

            // If you turned on orbital decay in settings, include the drag friction factor!
            if (window.orbitalDecayEnabled) {
                simVx *= window.orbitalDecayFactor;
                simVy *= window.orbitalDecayFactor;
            }

            // Step position forward
            simX += simVx;
            simY += simVy;

            // Map this future world coordinate back to your screen pixels
            let dotScreenX = (simX - window.camera.x) * window.camera.zoom + canvas.width / 2;
            let dotScreenY = (simY - window.camera.y) * window.camera.zoom + canvas.height / 2;
            ctx.lineTo(dotScreenX, dotScreenY);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset style back to solid lines
    }
}

function getGroupCenter(groupId) {
    const particles = window.particles;
    let count = 0;
    let sumX = 0, sumY = 0;
    let groupElements = [];

    for (let i = 0; i < particles.length; i++) {
        if (particles[i].groupId === groupId) {
            sumX += particles[i].x;
            sumY += particles[i].y;
            groupElements.push(particles[i]);
            count++;
        }
    }

    if (count === 0) return null;

    let centerX = sumX / count;
    let centerY = sumY / count;

    let maxRadius = 0;
    groupElements.forEach(p => {
        let dx = p.x - centerX;
        let dy = p.y - centerY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxRadius) maxRadius = dist;
    });

    return { x: centerX, y: centerY, maxRadius: maxRadius };
}

window.initSpaceObjectsMenu = initSpaceObjectsMenu;
window.drawSpaceObjectsMenu = drawSpaceObjectsMenu;