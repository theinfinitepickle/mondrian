import { margin, stageSize, gridSize, obstacles } from './game-logic-multiplayer.js';

export function isInsideCanvas(x, y) {
    return (
        x >= margin &&
        x <= stageSize - margin &&
        y >= margin &&
        y <= stageSize - margin
    );
}

function rectanglesOverlap(r1, r2) {
    return !(
        r1.x >= r2.x + r2.width - 5 ||
        r1.x + r1.width - 5 <= r2.x ||
        r1.y >= r2.y + r2.height - 5 ||
        r1.y + r1.height - 5 <= r2.y
    );
}

export function isOverlapping(newRect, layer) {
    const rects = layer.find("Rect").filter((r) => r !== newRect);
    for (let rect of rects) {
        if (rectanglesOverlap(newRect.getClientRect(), rect.getClientRect())) {
            return true;
        }
    }

    for (let obstacle of obstacles) {
        const obstacleRect = {
            x: obstacle.x() - gridSize / 2,
            y: obstacle.y() - gridSize / 2,
            width: gridSize,
            height: gridSize
        };
        if (rectanglesOverlap(newRect.getClientRect(), obstacleRect)) {
            return true;
        }
    }

    return false;
}

export function updateStatusText(element, text, addedClass) {
    element.textContent = text;
    element.classList.remove('success', 'error');
    if (addedClass) {
        element.classList.add(addedClass);
    }
}

export function logMessage(message) {
    console.log(message);
}