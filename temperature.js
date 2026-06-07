// temperature.js - Thermodynamic logic for Simple Astronomy
function updateTemperature(p, collisionSpeed, pressure) {
    // 1. Collision Speed: Impact heat
    let kineticHeat = collisionSpeed * 0.5;

    // 2. Continuous Pressure Heat: 
    // Tightly packed particles generate continuous heat from being squeezed by gravity
    let pressureHeat = pressure * 0.4; 

    p.temp += (kineticHeat + pressureHeat);

    // 3. SMART THERMAL INSULATION (The Core Fix):
    // If a particle has lots of neighbors (high pressure), it is insulated!
    // We adjust the cooling rate based on how trapped the particle is.
    let insulation = Math.min(0.99, pressure * 0.05); // More neighbors = higher insulation
    let coolingRate = 0.99 - insulation;             // Core cools much slower than surface
    
    // Ensure cooling rate doesn't accidentally turn into heating
    if (coolingRate > 0.995) coolingRate = 0.995;
    if (coolingRate < 0.90) coolingRate = 0.90; 

    p.temp *= coolingRate; 
    
    // Safety cap: Prevent thermal runaway
    if (p.temp > 100) p.temp = 100;
}
window.updateTemperature = updateTemperature;