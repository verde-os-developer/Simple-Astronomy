// groupId.js - Universal Object Clustered ID Tracker
function updateObjectGroupIds() {
    const particles = window.particles;
    let nextGroupId = 1;

    // Reset current IDs so groupings can dynamically update if planets split or merge
    for (let i = 0; i < particles.length; i++) {
        particles[i].groupId = null;
    }

    // Loop through every particle to discover clumps
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Skip if this particle was already grouped by a previous chain reaction
        if (p.groupId !== null) continue;

        // Found a new unassigned object! Start a group search
        let currentGroup = [];
        findConnectedObjectParticles(p, currentGroup);

        // Assign the new unique Group ID to every particle found in this clump
        currentGroup.forEach(part => {
            part.groupId = nextGroupId;
        });

        nextGroupId++;
    }
}

// Flood-fill helper to scan the map for physically connected structures
function findConnectedObjectParticles(startParticle, group) {
    let queue = [startParticle];
    startParticle.visited = true;
    group.push(startParticle);

    while (queue.length > 0) {
        let current = queue.shift();

        for (let i = 0; i < window.particles.length; i++) {
            let other = window.particles[i];

            // If it's not grouped yet, not visited yet, and isn't the same particle
            if (other.groupId === null && !other.visited) {
                let dx = other.x - current.x;
                let dy = other.y - current.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                // Check if they are touching physically (plus a tiny 1.5px buffer for stability)
                let touchDist = current.radius + other.radius + 1.5;

                if (dist <= touchDist) {
                    other.visited = true;
                    group.push(other);
                    queue.push(other);
                }
            }
        }
    }

    // Clean up our temporary visit tracking tags
    group.forEach(p => delete p.visited);
}

window.updateObjectGroupIds = updateObjectGroupIds;