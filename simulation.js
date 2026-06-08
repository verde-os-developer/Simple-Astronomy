const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.particles = [];
window.isPaused = true;
window.placingEnabled = false;
window.isDrawing = false;
window.orbitalDecayEnabled = false; // Turned off by default
window.orbitalDecayFactor = 0.9993; // The precise atmospheric drag resistance rate

class Particle {
    constructor(x, y, vx, vy, type = 'rock') {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.type = type;
        this.temp = 0;
        this.neighbors = 0;
        this.groupId = null; // Instantiated clean grouping ID parameter

        // --- AGING & SUPERNOVA TRACKERS ---
        this.spawnTime = Date.now(); // Tracks exactly when this particle was born
        this.starColorState = null;   // Tracks if it turns 'red' or 'blue' during old age
        this.isExploded = false;     // Tracks if it is in the 3-second post-explosion phase
        this.explosionTimer = 0;     // Counts down the 3 seconds of spreading

        // --- NEW COSMIC MATERIAL TYPES ---
        if (type === 'core') {
            this.mass = 50;
            this.radius = 12;
            this.isCore = true;
        } else if (type === 'water') {
            this.mass = 0.8;   // Slightly lighter than rock, flows smoothly
            this.radius = 4;
            this.isCore = false;
        } else if (type === 'ice') {
            this.mass = 0.7;   // Frozen water expands slightly
            this.radius = 4.5;
            this.isCore = false;
        } else if (type === 'plant') {
            this.mass = 1.2;   // Organic matter anchored to structures
            this.radius = 4.5;
            this.isCore = false;
        } else if (type === 'hydrogen') {
            this.mass = 0.2;   // Super light gas
            this.radius = 4;
            this.isCore = false;
        } else if (type === 'helium') {
            this.mass = 0.4;   // Light noble gas
            this.radius = 4;
            this.isCore = false;
        } else if (type === 'oxygen') {
            this.mass = 1.4;   // Heavier reactive gas
            this.radius = 5;
            this.isCore = false;
        } else if (type === 'star_material') {
            this.mass = 5.0;   // Ultra-dense stellar matter
            this.radius = 6;
            this.isCore = false;
        } else if (type === 'nebula_dust') {
            this.mass = 0.1;   // Extremely light space dust
            this.radius = 3;
            this.isCore = false;
        } else if (type === 'gas_giant_material') {
            this.mass = 2.5;   // Thick, compressed planetary atmosphere
            this.radius = 5;
            this.isCore = false;
        } else { // Default 'rock'
            this.mass = 1.0;
            this.radius = 5;
            this.isCore = false;
        }
    }

    updateTemp() {
        this.temp *= 0.995; 
    }

    draw(context) {
        let intensity = Math.min(this.temp * 2.5, 255);
        
        // Custom Cosmic Color Profiles
        if (this.type === 'core') {
            this.color = '#ff9900';
        } else if (this.type === 'water') {
            // Beautiful fluid deep sea blue that brightens slightly when heated
            this.color = `rgb(${40 + intensity * 0.2}, ${100 + intensity * 0.4}, ${255})`;
        } else if (this.type === 'ice') {
            // Cold, frosty cyan-white crystalline sheen
            this.color = `rgb(${200 + intensity * 0.2}, ${240}, ${255})`;
        } else if (this.type === 'plant') {
            // Rich biological chlorophyll green 
            this.color = `rgb(${60}, ${180 + intensity * 0.3}, ${70})`;
        } else if (this.type === 'hydrogen') {
            this.color = `rgb(${180 + intensity * 0.3}, ${140}, ${255})`;
        } else if (this.type === 'helium') {
            this.color = `rgb(${255}, ${160 + intensity * 0.3}, ${120})`;
        } else if (this.type === 'nebula_dust') {
            this.color = `rgb(${80 + intensity * 0.2}, ${220}, ${140})`; // Emerald space mist
        } else if (this.type === 'gas_giant_material') {
            this.color = `rgb(${220}, ${160}, ${90 + intensity * 0.3})`; // Striped gas giant beige
        } else if (this.type === 'oxygen') {
            this.color = `rgb(${130 + intensity}, ${200}, ${255})`;
        } else if (this.type === 'star_material') {
            let age = (Date.now() - this.spawnTime) / 1000;

            if (age >= 60) {
                if (!this.starColorState) {
                    this.starColorState = Math.random() > 0.5 ? 'red' : 'blue';
                }

                if (this.starColorState === 'red') {
                    this.color = `rgb(${255}, ${50 + intensity * 0.2}, ${50})`;
                } else {
                    this.color = `rgb(${80}, ${150 + intensity * 0.3}, ${255})`;
                }
            } else {
                this.color = `rgb(${255}, ${220 + intensity}, ${100 + intensity * 0.5})`;
            }
        } else { 
            this.color = `rgb(${100 + intensity}, ${100 - intensity}, ${100 - intensity})`;
        }

        let screenX = (this.x - window.camera.x) * window.camera.zoom + canvas.width / 2;
        let screenY = (this.y - window.camera.y) * window.camera.zoom + canvas.height / 2;
        let screenRadius = this.radius * window.camera.zoom;

        context.beginPath();
        context.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
    }
}
window.Particle = Particle;

// --- SPAWNING LOGIC ---
function spawnParticlePlanet(cx, cy, total) {
    for (let i = 0; i < total; i++) {
        let angle = Math.random() * Math.PI * 2;
        let offset = Math.random() * 8; 
        window.particles.push(new Particle(cx + Math.cos(angle) * offset, cy + Math.sin(angle) * offset, 0, 0, 'rock'));
    }
}

function spawnEntity(x, y, type) {
    if (type === 'asteroid') {
        window.particles.push(new Particle(x, y, 0, 0, 'rock'));
    } else if (type === 'planet') {
        spawnParticlePlanet(x, y, 15);
    } else if (type === 'core') {
        window.particles.push(new Particle(x, y, 0, 0, 'core'));
    } else if (['hydrogen', 'helium', 'oxygen', 'star_material', 'nebula_dust', 'gas_giant_material', 'water', 'ice', 'plant'].includes(type)) {
        window.particles.push(new Particle(x, y, 0, 0, type));
    }
}

function spawnBrush(x, y) {
    let type = document.getElementById('object-select').value;
    let mode = document.getElementById('brush-select').value;
    if (mode === 'singular') spawnEntity(x, y, type);
    else if (mode === 'square') {
        for(let i = -1; i <= 1; i++) for(let j = -1; j <= 1; j++) spawnEntity(x + i * 20, y + j * 20, type);
    } else if (mode === 'circle') {
        for(let i = 0; i < 8; i++) {
            let angle = (i / 8) * Math.PI * 2;
            spawnEntity(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30, type);
        }
    } else if (mode === 'random') {
        for(let i = 0; i < 5; i++) spawnEntity(x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50, type);
    }
}

// --- INTERFACE CONTROL ---
function enablePlacement() {
    window.placingEnabled = true;
    document.getElementById('cancel-spawn-btn').style.display = 'block';
    console.log("Placement mode enabled");
}

function exitPlacementMode() {
    window.placingEnabled = false;
    window.isDrawing = false;
    document.getElementById('cancel-spawn-btn').style.display = 'none';
}

function togglePause() {
    window.isPaused = !window.isPaused;
    document.getElementById('pause-btn').innerText = window.isPaused ? 'Resume' : 'Pause';
}

function toggleSettingsMenu() {
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleOrbitalDecay(isEnabled) {
    window.orbitalDecayEnabled = isEnabled;
    console.log("Orbital decay system status:", window.orbitalDecayEnabled);
}

// Mount declarations safely globally
window.toggleSettingsMenu = toggleSettingsMenu;
window.toggleOrbitalDecay = toggleOrbitalDecay;

function processStellarAging() {
    let now = Date.now();

    for (let i = 0; i < window.particles.length; i++) {
        let p = window.particles[i];

        if (p.type === 'star_material' && !p.isExploded) {
            let ageInSeconds = (now - p.spawnTime) / 1000;

            if (ageInSeconds >= 75) {
                p.isExploded = true;
                p.explosionTimer = now;

                let roll = Math.random();
                if (roll < 0.5) p.type = 'hydrogen';
                else if (roll < 0.8) p.type = 'helium';
                else p.type = 'oxygen';

                if (p.type === 'hydrogen') { p.mass = 0.2; p.radius = 4; }
                else if (p.type === 'helium') { p.mass = 0.4; p.radius = 4; }
                else { p.mass = 1.4; p.radius = 5; }

                let blastAngle = Math.random() * Math.PI * 2;
                let blastSpeed = 3.0 + Math.random() * 4.0;
                p.vx = Math.cos(blastAngle) * blastSpeed;
                p.vy = Math.sin(blastAngle) * blastSpeed;
            }
        }

        if (p.isExploded) {
            let timeExploding = (now - p.explosionTimer) / 1000;

            if (timeExploding >= 3.0) {
                p.vx = 0;
                p.vy = 0;
                p.isExploded = false;
            }
        }
    }
}
window.processStellarAging = processStellarAging;

// --- MOUSE & ANIMATION ---
canvas.addEventListener('mousedown', () => window.isDrawing = true);
window.addEventListener('mouseup', () => window.isDrawing = false);
canvas.addEventListener('mousemove', (e) => {
    if (!window.placingEnabled || !window.isDrawing) return;
    let spawnX = (e.clientX - canvas.width / 2) / window.camera.zoom + window.camera.x;
    let spawnY = (e.clientY - canvas.height / 2) / window.camera.zoom + window.camera.y;
    if (Math.random() > 0.8) spawnBrush(spawnX, spawnY);
});

// INITIALIZE INTERFACE HOOKS OUTSIDE THE ANIMATE TICK LOOP LOOP
if (typeof window.initSpaceObjectsMenu === 'function') {
    window.initSpaceObjectsMenu();
}

function animate() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!window.isPaused) {
        if (typeof window.updateObjectGroupIds === 'function') window.updateObjectGroupIds();
        if (typeof processStellarAging === 'function') processStellarAging();
        if (typeof window.handleElementReactions === 'function') window.handleElementReactions();

        if (typeof calculatePhysics === 'function') calculatePhysics(16.6);
        if (typeof handleCollisions === 'function') handleCollisions();
        
        // Apply the finalized velocities to update positions cleanly
     window.particles.forEach(p => {
         // --- NEW ORBITS UPDATE FEATURE: OPTIONAL SPACE DRAG DECAY ---
         if (window.orbitalDecayEnabled && p.type !== 'core') {
             // Core elements remain anchor focal points, other bodies experience drag friction
             p.vx *= window.orbitalDecayFactor;
             p.vy *= window.orbitalDecayFactor;
         }

         p.x += p.vx; 
         p.y += p.vy;
     });
    }

    // LAYER 1: Always draw particles first
    window.particles.forEach(p => {
        p.draw(ctx);
    });
    
    // LAYER 2: Draw HUD overlays/arrows last so they render clearly on top of clusters
    if (typeof window.drawSpaceObjectsMenu === 'function') {
        window.drawSpaceObjectsMenu(ctx);
    }
    
    requestAnimationFrame(animate);
}
animate();