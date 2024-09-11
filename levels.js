export const levels = [
    {
        id: 1,
        gridSize: 4,
        obstacles: [],
        targetScore: 4
    },
    {
        id: 2,
        gridSize: 5,
        obstacles: [],
        targetScore: 4
    },
    {
        id: 3,
        gridSize: 7,
        obstacles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
        targetScore: 4
    },
    {
        id: 4,
        gridSize: 7,
        obstacles: [],
        targetScore: 5
    },
    {
        id: 5,
        gridSize: 7,
        obstacles: [[0, 0], [6, 5], [6, 6]],
        targetScore: 4
    },
    {
        id: 6,
        gridSize: 8,
        obstacles: [[4, 2]],
        targetScore: 6
    },
    {
        id: 7,
        gridSize: 8,
        obstacles: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
        targetScore: 4
    },
    {
        id: 8,
        gridSize: 8,
        obstacles: [[0, 7], [1, 7], [2, 7], [3, 7], [4, 7]],
        targetScore: 4
    },
    {
        id: 9,
        gridSize: 6,
        obstacles: [],
        targetScore: 5
    },
    {
        id: 80,
        gridSize: 8,
        obstacles: [],
        targetScore: -1
    }
];

export function getLevelById(id) {
    return levels.find(level => level.id === id);
}