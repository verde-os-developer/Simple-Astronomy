// elementReaction.js - Material Condensation & Planetary Accretion
function handleElementReactions() {
    const particles = window.particles;
    
    // Arrays to track which particles need to be deleted or added
    let particlesToRemove = new Set();
    let newParticles = [];

    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        if (particlesToRemove.has(p1)) continue;

        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            if (particlesToRemove.has(p2)) continue;

            // Check if p1 and p2 are physically touching
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let touchDist = p1.radius + p2.radius;

            if (dist <= touchDist) {
                let type1 = p1.type;
                let type2 = p2.type;

                // --- RECIPE 1: 2 Nebula Dust = 1 Rock Particle ---
                if (type1 === 'nebula_dust' && type2 === 'nebula_dust') {
                    particlesToRemove.add(p1);
                    particlesToRemove.add(p2);
                    
                    // Spawn 1 Rock at the center point of the collision
                    let midX = (p1.x + p2.x) / 2;
                    let midY = (p1.y + p2.y) / 2;
                    let avgVx = (p1.vx + p2.vx) / 2;
                    let avgVy = (p1.vy + p2.vy) / 2;
                    
                    newParticles.push(new window.Particle(midX, midY, avgVx, avgVy, 'rock'));
                    break; 
                }

                // --- RECIPE 2: 1 Nebula Dust + 1 Gas (H, He, O) = 1 Gas Giant Material ---
                let isGas1 = ['hydrogen', 'helium', 'oxygen'].includes(type1);
                let isGas2 = ['hydrogen', 'helium', 'oxygen'].includes(type2);

                if ((type1 === 'nebula_dust' && isGas2) || (type2 === 'nebula_dust' && isGas1)) {
                    particlesToRemove.add(p1);
                    particlesToRemove.add(p2);

                    let midX = (p1.x + p2.x) / 2;
                    let midY = (p1.y + p2.y) / 2;
                    let avgVx = (p1.vx + p2.vx) / 2;
                    let avgVy = (p1.vy + p2.vy) / 2;

                    newParticles.push(new window.Particle(midX, midY, avgVx, avgVy, 'gas_giant_material'));
                    break;
                }
            }
        }
    }

    // Filter out the consumed particles
    window.particles = particles.filter(p => !particlesToRemove.has(p));

    // Add newborn reaction particles to the global simulation list
    newParticles.forEach(p => window.particles.push(p));

    // --- RECIPE 3: 20 Gas Giant Particles = 40 Star Material ---
    // We group touching Gas Giant Particles to see if they reach critical mass
    processCriticalIgnition();
}

function processCriticalIgnition() {
    const particles = window.particles;
    let visited = new Set();

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (p.type === 'gas_giant_material' && !visited.has(p)) {
            
            // Find all touching gas giant particles in this clump
            let clump = [];
            let queue = [p];
            visited.add(p);
            clump.push(p);

            while (queue.length > 0) {
                let current = queue.shift();
                for (let j = 0; j < particles.length; j++) {
                    let other = particles[j];
                    if (other.type === 'gas_giant_material' && !visited.has(other)) {
                        let dx = other.x - current.x;
                        let dy = other.y - current.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= current.radius + other.radius + 2) {
                            visited.add(other);
                            clump.push(other);
                            queue.push(other);
                        }
                    }
                }
            }

            // CRITICAL MASS TRIGGER: If clump has 20 or more particles, ignite into 40 Star Materials!
            if (clump.length >= 20) {
                // Remove the old gas giant particles
                window.particles = window.particles.filter(item => !clump.includes(item));

                // Find the center of the giant gas clump
                let centerX = 0, centerY = 0, avgVx = 0, avgVy = 0;
                clump.forEach(item => {
                    centerX += item.x; centerY += item.y;
                    avgVx += item.vx; avgVy += item.vy;
                });
                centerX /= clump.length; centerY /= clump.length;
                avgVx /= clump.length; avgVy /= clump.length;

                // Spawn 40 Star Material particles packed tightly at the ignition core
                for (let k = 0; k < 40; k++) {
                    let angle = Math.random() * Math.PI * 2;
                    let radiusOffset = Math.random() * 15; // Keeps them together as a tiny star seed
                    let rx = centerX + Math.cos(angle) * radiusOffset;
                    let ry = centerY + Math.sin(angle) * radiusOffset;

                    // Slight internal pressure outward so they form a nice ball
                    let pVx = avgVx + Math.cos(angle) * 0.2;
                    let pVy = avgVy + Math.sin(angle) * 0.2;

                    window.particles.push(new window.Particle(rx, ry, pVx, pVy, 'star_material'));
                }
            }
        }
    }
}

window.handleElementReactions = handleElementReactions;