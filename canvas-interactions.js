import { isInsideCanvas, isOverlapping, logMessage } from './canvas-utils.js';
import { gridSize, halfGridSize, margin, colors,updateRectanglesList } from './game-logic-multiplayer.js';

let isDrawing = false;
let startX, startY;
let rect, label;
let chosenColor;
let longPressTimeout;
const longPressDelay = 500;

const rectStrokeColor = "rgba(0, 0, 0, 1)";
const rectStrokeWidth = 4;
const rectOpacity = 0.7;

export function setupEventListeners(stage, layer) {
    stage.on("mousedown touchstart", (e) => handleMouseDown(e, stage, layer));
    stage.on("mousemove touchmove", (e) => handleMouseMove(e, stage, layer));
    stage.on("mouseup touchend", () => handleMouseUp(layer));
}

function handleMouseDown(e, stage, layer) {
    const pos = stage.getPointerPosition();

    if (!isInsideCanvas(pos.x, pos.y)) {
        return;
    }

    const clickedShape = layer.getIntersection(pos);

    if (clickedShape) {
        handleShapeClick(clickedShape, layer);
    } else {
        startDrawing(pos, layer);
    }
}

function handleShapeClick(clickedShape, layer) {
    let target;
    if (clickedShape.getClassName() === "Text") {
        target = clickedShape.attrs.rect;
    } else {
        target = clickedShape;
    }
    if (target.getClassName() === "Rect") {
        const currentColorIndex = colors.indexOf(target.fill());
        const nextColorIndex = (currentColorIndex + 1) % colors.length;
        target.fill(colors[nextColorIndex]);
        layer.draw();
        longPressTimeout = setTimeout(() => {
            target.destroy();
            target.attrs.label.destroy();
            layer.draw();
            updateRectanglesList();
        }, longPressDelay);
    }
}

function startDrawing(pos, layer) {
    isDrawing = true;
    startX = Math.floor((pos.x - margin) / gridSize) * gridSize + margin;
    startY = Math.floor((pos.y - margin) / gridSize) * gridSize + margin;
    const rects = layer.find("Rect");
    chosenColor = colors.reduce((leastUsedColor, color) => {
        const count = rects.filter(rect => rect.fill() === color).length;
        const leastCount = rects.filter(rect => rect.fill() === leastUsedColor).length;
        return count < leastCount ? color : leastUsedColor;
    }, colors[0]);
    rect = new Konva.Rect({
        center_x: startX + halfGridSize,
        center_y: startY + halfGridSize,
        x: startX,
        y: startY,
        width: gridSize,
        height: gridSize,
        fill: chosenColor,
        stroke: rectStrokeColor,
        strokeWidth: rectStrokeWidth,
        opacity: rectOpacity,
    });
    label = new Konva.Text({
        x: startX,
        y: startY,
        text: "1x1",
        fontSize: 20,
        fontFamily: "Calibri",
        fill: "black",
    });
    label.position({
        x: startX + gridSize / 2 - label.width() / 2,
        y: startY + gridSize / 2 - label.height() / 2,
    });
    layer.add(rect);
    layer.add(label);
    rect.attrs.label = label;
    label.attrs.rect = rect;
}

function handleMouseMove(e, stage, layer) {
    if (!isDrawing) return;
    const pos = stage.getPointerPosition();

    if (!isInsideCanvas(pos.x, pos.y)) {
        isDrawing = false;
        rect.destroy();
        label.destroy();
        layer.draw();
        return;
    }

    updateRectangleSize(pos);

    if (isOverlapping(rect, layer)) {
        rect.fill("rgba(0, 0, 0, 0.2)");
    } else {
        rect.fill(chosenColor);
    }

    layer.draw();
}

function updateRectangleSize(pos) {
    let endX, endY;

    if (pos.x < rect.attrs.center_x) {
        startX = Math.ceil((rect.attrs.center_x - margin) / gridSize) * gridSize + margin;
        endX = Math.floor((pos.x - margin) / gridSize) * gridSize + margin;
    } else {
        startX = Math.floor((rect.attrs.center_x - margin) / gridSize) * gridSize + margin;
        endX = Math.floor((pos.x - margin) / gridSize) * gridSize + margin + gridSize;
    }

    if (pos.y < rect.attrs.center_y) {
        startY = Math.ceil((rect.attrs.center_y - margin) / gridSize) * gridSize + margin;
        endY = Math.floor((pos.y - margin) / gridSize) * gridSize + margin;
    } else {
        startY = Math.floor((rect.attrs.center_y - margin) / gridSize) * gridSize + margin;
        endY = Math.floor((pos.y - margin) / gridSize) * gridSize + margin + gridSize;
    }

    let width = endX - startX;
    let height = endY - startY;

    rect.x(startX);
    rect.y(startY);
    rect.width(width);
    rect.height(height);

    const absWidth = Math.abs(width / gridSize);
    const absHeight = Math.abs(height / gridSize);

    label.text(`${absWidth}x${absHeight}`);
    label.position({
        x: (startX + endX) / 2 - label.width() / 2,
        y: (startY + endY) / 2 - label.height() / 2,
    });
}

function handleMouseUp(layer) {
    clearTimeout(longPressTimeout);
    if (!isDrawing) return;
    isDrawing = false;
    if (isOverlapping(rect, layer)) {
        rect.destroy();
        label.destroy();
    } else {
        const width = rect.width() / gridSize;
        const height = rect.height() / gridSize;
        logMessage(`Created rectangle: ${width}x${height} = ${width * height}`);
    }
    updateRectanglesList();
    layer.draw();
}
