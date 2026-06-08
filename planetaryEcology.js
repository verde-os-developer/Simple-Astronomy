// planetaryEcology.js - Biological & Thermodynamic Matter Transitions
function processPlanetaryEcology() {
    const particles = window.particles;

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // 1. THERMODYNAMICS: Water turning to Ice
        if (p.type === 'water') {
            // If water drops below a freezing threshold, it turns to solid ice
            if (p.temp < -5) {
                p.type = 'ice';
                p.mass = 0.7;
                p.radius = 4.5;
                // Absorb immediate momentum so it freezes securely in place
                p.vx *= 0.2;
                p.vy *= 0.2;
            }
        }

        // 2. THERMODYNAMICS: Ice melting back to Water
        else if (p.type === 'ice') {
            // If ice gets warmed up near a sun core, it goes fluid again
            if (p.temp > 5) {
                p.type = 'water';
                p.mass = 0.8;
                p.radius = 4;
            }
        }

        // 3. ECOLOGY: Plant life burn up conditions
        else if (p.type === 'plant') {
            // If it gets too hot (near stars/explosions) or way too cold, plants die off
            if (p.temp > 95 || p.temp < -40) {
                p.type = 'nebula_dust'; // Reverts to basic carbon star mist
                p.mass = 0.1;
                p.radius = 3;
            }
        }
    }
}

window.processPlanetaryEcology = processPlanetaryEcology;