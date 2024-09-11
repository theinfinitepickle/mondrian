import { numCells, gridSize, margin, stageSize, updateGameArea } from './game-logic-multiplayer.js';

export function createStage(containerId) {
    const stage = new Konva.Stage({
        container: containerId,
        width: stageSize,
        height: stageSize,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Set the width of the status bar and game container to match the canvas width
    document.getElementById('game-container').style.width = `${stageSize}px`;

    return { stage, layer };
}

export function drawGrid(layer) {
    for (let i = 0; i <= numCells; i++) {
        layer.add(
            new Konva.Line({
                points: [
                    margin + i * gridSize,
                    margin,
                    margin + i * gridSize,
                    margin + numCells * gridSize,
                ],
                stroke: "lightgray",
                strokeWidth: 1,
            })
        );
        layer.add(
            new Konva.Line({
                points: [
                    margin,
                    margin + i * gridSize,
                    margin + numCells * gridSize,
                    margin + i * gridSize,
                ],
                stroke: "lightgray",
                strokeWidth: 1,
            })
        );
    }
}

export function updateGridSize(newNumCells) {
    updateGameArea(newNumCells);
}