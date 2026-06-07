// gravity.js
const G = 0.5; 

function calculatePhysics() {
    for (let i = 0; i < window.particles.length; i++) {
        let p1 = window.particles[i];
        if (p1.isExploded) continue; // Skip gravity if it's currently exploding!
        for (let j = i + 1; j < window.particles.length; j++) {
            let p2 = window.particles[j];
            if (p2.isExploded) continue; // Skip gravity if it's currently exploding!
            
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let distSq = dx * dx + dy * dy;
            let dist = Math.sqrt(distSq);

            if (dist < 0.1) continue; 

            let contactDist = p1.radius + p2.radius;
            
            // --- THE VACUUM COASTING FIX ---
            // If they are touching or overlapping, turn off gravity between them!
            // This stops internal forces from grinding your planet to a halt.
            if (dist <= contactDist) {
                continue; 
            }
            
            // Standard Newton gravity only applies through empty space
            let force = (G * p1.mass * p2.mass) / (distSq + 10);
            
            let nx = dx / dist;
            let ny = dy / dist;

            // Apply force
            p1.vx += (force * nx / p1.mass);
            p1.vy += (force * ny / p1.mass);
            p2.vx -= (force * nx / p2.mass);
            p2.vy -= (force * ny / p2.mass);
        }
    }
}
window.calculatePhysics = calculatePhysics;