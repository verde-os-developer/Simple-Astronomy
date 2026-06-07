// collisions.js - STRICTLY NO BOUNCE
// collisions.js
function handleCollisions() {
    const particles = window.particles;
    
    // PASS 1: Reset and calculate neighbors (Pressure)
    for (let i = 0; i < particles.length; i++) {
        particles[i].neighbors = 0; 
    }
    
    // Track pairs touching for fusion inspection
    let touchingMap = Array.from({ length: particles.length }, () => []);

    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let distSq = dx * dx + dy * dy;
            let targetDist = p1.radius + p2.radius;
            
            if (distSq < (targetDist * targetDist)) {
                p1.neighbors++;
                p2.neighbors++;
                touchingMap[i].push(j);
                touchingMap[j].push(i);
            }
        }
    }

    // --- NUCLEAR STELLAR FUSION PASS ---
    // If a cluster has high neighbor count (pressure), check for the star recipe:
    // Requires: 7 Hydrogen, 2 Helium, 1 Oxygen
    let particlesToRemove = new Set();
    let fusionSpawns = [];

    for (let i = 0; i < particles.length; i++) {
        if (particlesToRemove.has(i)) continue;
        let p = particles[i];

        // Fusion triggers when particles are tightly packed under pressure
        if (p.neighbors >= 6) {
            let clusterIndices = [i, ...touchingMap[i]].filter(idx => !particlesToRemove.has(idx));
            
            let hydrogens = clusterIndices.filter(idx => particles[idx].type === 'hydrogen');
            let heliums = clusterIndices.filter(idx => particles[idx].type === 'helium');
            let oxygens = clusterIndices.filter(idx => particles[idx].type === 'oxygen');

            if (hydrogens.length >= 7 && heliums.length >= 2 && oxygens.length >= 1) {
                // Collect the exact ingredients
                let usedH = hydrogens.slice(0, 7);
                let usedHe = heliums.slice(0, 2);
                let usedO = oxygens.slice(0, 1);
                
                let combinedIngredients = [...usedH, ...usedHe, ...usedO];
                
                // Calculate average position and explosive outward scatter velocity
                let avgX = 0, avgY = 0;
                combinedIngredients.forEach(idx => {
                    avgX += particles[idx].x;
                    avgY += particles[idx].y;
                    particlesToRemove.add(idx);
                });
                avgX /= 10;
                avgY /= 10;

                // Queue up the 40 new Star Material particles erupting outwards!
                for (let k = 0; k < 40; k++) {
                    let angle = (k / 40) * Math.PI * 2;
                    let speed = 1.5 + Math.random() * 2.0; // Explosion velocity blast
                    let vx = Math.cos(angle) * speed;
                    let vy = Math.sin(angle) * speed;
                    
                    let starPart = new Particle(avgX + Math.cos(angle) * 5, avgY + Math.sin(angle) * 5, vx, vy, 'star_material');
                    starPart.temp = 80; // Starts blistering hot!
                    fusionSpawns.push(starPart);
                }
            }
        }
    }

    // Filter out the consumed atoms and inject the new Star Material
    if (particlesToRemove.size > 0) {
        window.particles = particles.filter((_, idx) => !particlesToRemove.has(idx));
        window.particles.push(...fusionSpawns);
    }

    // PASS 2: Resolve positions, friction, and apply smart temperature
    for (let i = 0; i < window.particles.length; i++) {
        let p1 = window.particles[i];
        for (let j = i + 1; j < window.particles.length; j++) {
            let p2 = window.particles[j];
            
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let distSq = dx * dx + dy * dy;
            let targetDist = p1.radius + p2.radius;
            
            if (distSq < (targetDist * targetDist) && distSq > 0) {
                let dist = Math.sqrt(distSq);
                let overlap = targetDist - dist;
                let nx = dx / dist;
                let ny = dy / dist;

                p1.x -= nx * overlap * 0.5;
                p1.y -= ny * overlap * 0.5;
                p2.x += nx * overlap * 0.5;
                p2.y += ny * overlap * 0.5;

                let rvx = p2.vx - p1.vx;
                let rvy = p2.vy - p1.vy;
                
                let tx = -ny;
                let ty = nx;
                let tangentVelocity = rvx * tx + rvy * ty;

                if (Math.abs(tangentVelocity) < 0.8) {
                    p1.vx += tx * tangentVelocity * 0.5;
                    p1.vy += ty * tangentVelocity * 0.5;
                    p2.vx -= tx * tangentVelocity * 0.5;
                    p2.vy -= ty * tangentVelocity * 0.5;
                } else {
                    let frictionImpulse = tangentVelocity * 0.2;
                    p1.vx += tx * frictionImpulse;
                    p1.vy += ty * frictionImpulse;
                    p2.vx -= tx * frictionImpulse;
                    p2.vy -= ty * frictionImpulse;
                }

                let normalVelocity = rvx * nx + rvy * ny;
                if (normalVelocity < 0) {
                    updateTemperature(p1, Math.abs(normalVelocity), p1.neighbors);
                    updateTemperature(p2, Math.abs(normalVelocity), p2.neighbors);

                    p1.vx += nx * normalVelocity * 0.5;
                    p1.vy += ny * normalVelocity * 0.5;
                    p2.vx -= nx * normalVelocity * 0.5;
                    p2.vy -= ny * normalVelocity * 0.5;
                }
            }
        }
    }
}
window.handleCollisions = handleCollisions;