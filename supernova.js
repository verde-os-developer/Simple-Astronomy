// supernova.js - ID-Locked Stellar Lifecycles
function processStellarAging() {
    const now = Date.now();
    const particles = window.particles;

    // --- STEP 1: ASSIGN UNIQUE IDs TO NEW STAR CLUSTERS ---
    let nextStarId = 1;
    
    // Clear old IDs so we can re-map active systems cleanly
    for (let i = 0; i < particles.length; i++) {
        if (particles[i].type === 'star_material' && !particles[i].isExploded) {
            particles[i].starId = null;
        }
    }

    // Map out clusters and give each separate star a unique ID number
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (p.type === 'star_material' && !p.isExploded && !p.starId) {
            let starGroup = [];
            findConnectedStarParticles(p, starGroup);
            
            starGroup.forEach(starPart => {
                starPart.starId = nextStarId;
            });
            nextStarId++;
        }
    }

    // --- STEP 2: GROUP PHASES BY STAR ID ---
    // Gather all particles belonging to the same star IDs
    let starsMap = {};
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (p.type === 'star_material' && !p.isExploded && p.starId) {
            if (!starsMap[p.starId]) starsMap[p.starId] = [];
            starsMap[p.starId].push(p);
        }
    }

    // Process each star entity completely
    Object.keys(starsMap).forEach(id => {
        let starGroup = starsMap[id];
        
        // Use the oldest particle in the group to determine the star's age
        let oldestAge = 0;
        let existingColor = null;

        starGroup.forEach(p => {
            let age = (now - p.spawnTime) / 1000;
            if (age > oldestAge) oldestAge = age;
            if (p.starColorState) existingColor = p.starColorState;
        });

        // Handle 60-Second Color Shifts
        if (oldestAge >= 60 && oldestAge < 75) {
            const finalColor = existingColor || (Math.random() > 0.5 ? 'red' : 'blue');
            starGroup.forEach(p => {
                p.starColorState = finalColor;
            });
        }

        // Handle 75-Second TOTAL Detonation
        if (oldestAge >= 75) {
            starGroup.forEach(p => {
                p.isExploded = true;
                p.explosionTimer = now;

                // Elemental decay roll
                let roll = Math.random();
                if (roll < 0.15) p.type = 'nebula_dust';
                if (roll < 0.5) p.type = 'hydrogen';
                else if (roll < 0.8) p.type = 'helium';
                else p.type = 'oxygen';

                // Physical updates
                if (p.type === 'nebula_dust') { p.mass = 0.1; p.radius = 3; }
                if (p.type === 'hydrogen') { p.mass = 0.2; p.radius = 4; }
                else if (p.type === 'helium') { p.mass = 0.4; p.radius = 4; }
                else { p.mass = 1.4; p.radius = 5; }

                // Explode outward outward seamlessly
                let blastAngle = Math.random() * Math.PI * 2;
                let blastSpeed = 3.0 + Math.random() * 4.0; 
                p.vx = Math.cos(blastAngle) * blastSpeed;
                p.vy = Math.sin(blastAngle) * blastSpeed;
            });
        }
    });

    // --- STEP 3: THE 3-SECOND NEBULA FREEZE ---
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
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

// Flood-fill helper to map physics connections safely
function findConnectedStarParticles(startParticle, group) {
    let queue = [startParticle];
    startParticle.visited = true;
    group.push(startParticle);

    while (queue.length > 0) {
        let current = queue.shift();

        for (let i = 0; i < window.particles.length; i++) {
            let other = window.particles[i];
            if (other.type === 'star_material' && !other.isExploded && !other.starId && !other.visited) {
                let dx = other.x - current.x;
                let dy = other.y - current.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let touchDist = current.radius + other.radius + 3; // Slightly wider checking buffer

                if (dist <= touchDist) {
                    other.visited = true;
                    group.push(other);
                    queue.push(other);
                }
            }
        }
    }
    group.forEach(p => delete p.visited);
}

window.processStellarAging = processStellarAging;