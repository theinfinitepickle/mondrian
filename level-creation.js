import { gridSize, margin, numCells } from './game-logic-multiplayer.js';

export function generateObstacles(seed, numObstacles = 0, obstacles, layer) {
    // Clear existing obstacles
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles.length = 0;

    // Create a simple seeded random number generator
    let state = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + numObstacles;
    function rng() {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    }

    const occupiedCells = new Set();

    for (let i = 0; i < numObstacles; i++) {
        let x, y;
        do {
            x = Math.floor(rng() * numCells);
            y = Math.floor(rng() * numCells);
        } while (occupiedCells.has(`${x},${y}`));

        occupiedCells.add(`${x},${y}`);

        const obstacle = new Konva.Circle({
            x: x * gridSize + margin + gridSize / 2,
            y: y * gridSize + margin + gridSize / 2,
            radius: gridSize / 4,
            fill: 'gray',
            stroke: 'black',
            strokeWidth: 2,
        });

        // Store x and y in integer units representing the position on the grid
        obstacle.gridX = x;
        obstacle.gridY = y;

        obstacles.push(obstacle);
        layer.add(obstacle);
    }

    layer.draw();

    return obstacles;
}

// You might want to export other level-related functions here as well
