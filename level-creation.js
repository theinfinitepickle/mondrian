import { levels, getLevelById } from './levels.js';

export function generateObstacles(seed, numObstacles = 0, obstacles, layer, gridSize, margin, numCells, currentLevel) {
    // Clear existing obstacles
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles.length = 0;

    let obstaclePositions = [];
    let targetScore = -1;

    if (currentLevel === 80) {
        // Create a simple seeded random number generator
        if (typeof seed !== 'string') {
            seed = Math.random().toString(36).substring(2, 15);
            numObstacles = 2;
        }
        let state = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + numObstacles;
        function rng() {
            state = (state * 1103515245 + 12345) & 0x7fffffff;
            return state / 0x7fffffff;
        }

        const occupiedCells = new Set();

        // Generate obstacle positions
        obstaclePositions = [];
        for (let i = 0; i < numObstacles; i++) {
            let x, y;
            do {
                x = Math.floor(rng() * numCells);
                y = Math.floor(rng() * numCells);
            } while (occupiedCells.has(`${x},${y}`));

            occupiedCells.add(`${x},${y}`);
            obstaclePositions.push({ x, y });
        }

        let targetScore = -1;
    } else {
        const level = getLevelById(currentLevel);
        if (level) {
            numCells = level.gridSize;
            obstaclePositions = level.obstacles.map(([x, y]) => ({ x, y }));
            numObstacles = obstaclePositions.length;
            targetScore = level.targetScore;
        } else {
            console.error(`Level ${currentLevel} not found`);
        }
    }

    // Create obstacles
    for (const { x, y } of obstaclePositions) {
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
