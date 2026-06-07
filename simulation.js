const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.particles = [];
window.isPaused = true;
window.placingEnabled = false;
window.isDrawing = false;

class Particle {
    constructor(x, y, vx, vy, type = 'rock') {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.type = type;
        this.temp = 0;
        this.neighbors = 0;

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
        } else if (this.type === 'hydrogen') {
            // Light lavender/violet glow typical of energized hydrogen gas
            this.color = `rgb(${180 + intensity * 0.3}, ${140}, ${255})`;
        } else if (this.type === 'helium') {
            // Warm orange-pink glow characteristic of helium discharge
            this.color = `rgb(${255}, ${160 + intensity * 0.3}, ${120})`;
        } else if (this.type === 'nebula_dust') {
            this.color = `rgb(${80 + intensity * 0.2}, ${220}, ${140})`; // Emerald space mist
        } else if (this.type === 'gas_giant_material') {
            this.color = `rgb(${220}, ${160}, ${90 + intensity * 0.3})`; // Striped gas giant beige
        } else if (this.type === 'oxygen') {
            // Pale cool sky blue / soft red-tinted glow when excited
            this.color = `rgb(${130 + intensity}, ${200}, ${255})`;
        } else if (this.type === 'star_material') {
            let age = (Date.now() - this.spawnTime) / 1000; // Get age in seconds

            if (age >= 60) {
                // If it hasn't picked an aging color variant yet, pick one permanently
                if (!this.starColorState) {
                    this.starColorState = Math.random() > 0.5 ? 'red' : 'blue';
                }

                if (this.starColorState === 'red') {
                    // Blazing older Red Supergiant glow
                    this.color = `rgb(${255}, ${50 + intensity * 0.2}, ${50})`;
                } else {
                    // Hot, energetic older Blue Hypergiant glow
                    this.color = `rgb(${80}, ${150 + intensity * 0.3}, ${255})`;
                }
            } else {
                // Your beautiful classic newborn star color
                this.color = `rgb(${255}, ${220 + intensity}, ${100 + intensity * 0.5})`;
            }
        } else { 
            // Classic rock profile
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
        window.particles.push(new Particle(cx + Math.cos(angle) * offset, cy + Math.sin(angle) * offset, 0, 0, 1.0));
    }
}

function spawnEntity(x, y, type) {
    if (type === 'asteroid') {
        window.particles.push(new Particle(x, y, 0, 0, 'rock'));
    } else if (type === 'planet') {
        spawnParticlePlanet(x, y, 15);
    } else if (type === 'core') {
        window.particles.push(new Particle(x, y, 0, 0, 'core'));
    } else if (['hydrogen', 'helium', 'oxygen', 'star_material', 'nebula_dust', 'gas_giant_material'].includes(type)) {
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

function processStellarAging() {
    let now = Date.now();

    for (let i = 0; i < window.particles.length; i++) {
        let p = window.particles[i];

        // Handle active star material aging pipelines
        if (p.type === 'star_material' && !p.isExploded) {
            let ageInSeconds = (now - p.spawnTime) / 1000;

            // 75 seconds total (60s normal + 15s colored phase) = SUPERNOVA!
            if (ageInSeconds >= 75) {
                p.isExploded = true;
                p.explosionTimer = now;

                // Roll a random gas type for the post-supernova element decay
                let roll = Math.random();
                if (roll < 0.5) p.type = 'hydrogen';       // 50% Hydrogen
                else if (roll < 0.8) p.type = 'helium';    // 30% Helium
                else p.type = 'oxygen';                     // 20% Oxygen

                // Re-adjust physical attributes back to the new gas element properties
                if (p.type === 'hydrogen') { p.mass = 0.2; p.radius = 4; }
                else if (p.type === 'helium') { p.mass = 0.4; p.radius = 4; }
                else { p.mass = 1.4; p.radius = 5; }

                // Give it an intense explosive outward blast vector
                let blastAngle = Math.random() * Math.PI * 2;
                let blastSpeed = 3.0 + Math.random() * 4.0; // High velocity explosion
                p.vx = Math.cos(blastAngle) * blastSpeed;
                p.vy = Math.sin(blastAngle) * blastSpeed;
            }
        }

        // Handle the 3-second post-explosion blast phase
        if (p.isExploded) {
            let timeExploding = (now - p.explosionTimer) / 1000;

            if (timeExploding >= 3.0) {
                // 3 seconds are up! Freeze the particle in space so it stops spreading
                p.vx = 0;
                p.vy = 0;
                p.isExploded = false; // Turn off tracker so standard gravity takes back over
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

function animate() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Only update physics, aging, and positions when NOT paused
    if (!window.isPaused) {
        // Runs the lifecycle tracker from supernova.js
        if (typeof processStellarAging === 'function') processStellarAging();
        if (typeof window.handleElementReactions === 'function') window.handleElementReactions(); // Added right here!

        // Runs your universal forces and crystal lattice collisions
        if (typeof calculatePhysics === 'function') calculatePhysics(16.6);
        if (typeof handleCollisions === 'function') handleCollisions();
        
        // Apply the finalized velocities to update positions cleanly
        window.particles.forEach(p => {
            p.x += p.vx; 
            p.y += p.vy;
        });
    }

    // Always draw your elements so they stay visible when paused
    window.particles.forEach(p => {
        p.draw(ctx);
    });
    
    requestAnimationFrame(animate);
}
animate();