let numCells = 8; // Default to 4x4 grid
let gameArea = Math.min(Math.floor(window.innerWidth - 75), 500);
let gridSize = Math.round(gameArea / (numCells + 1));
let halfGridSize = Math.round(gridSize / 2);
const margin = 30;// Math.round(halfGridSize);
let stageSize = numCells * gridSize + 2 * margin;

// Define Konva rectangle properties
const rectOpacity = 0.7;
const rectStrokeWidth = 4;
const rectStrokeColor = "rgba(0, 0, 0, 1)";

let achievements = [];

let obstacles = []; // Global variable to store all obstacles
let numObstacles = 0; // Default to 0 obstacles

const colors = [
    "rgba(0, 0, 255, 0.7)",   // blue with opacity
    "rgba(255, 0, 0, 0.7)",   // red with opacity
    "rgba(255, 255, 0, 0.7)", // yellow with opacity
    "rgba(255, 255, 255, 0.7)" // white with opacity
];

let stage, layer;
let isDrawing = false;
let startX, startY;
let rect, label;
let chosenColor;
let longPressTimeout;
const longPressDelay = 500; // 500 milliseconds = 0.5 second

// Mupltiplayer variables
import { joinRoom, selfId } from "./trystero-nostr.min.js";
const users = new Map();
let room;
let currentRoomCode = null;

// let sendObstacles;
// let receiveObstacles;
let sendAchievements;
let receiveAchievements;


export function initGame(roomId) {
    // Clear existing stage if it exists
    if (stage) {
        stage.destroy();
    }

    // Recalculate stage size based on current numCells
    stageSize = numCells * gridSize + 2 * margin;

    stage = new Konva.Stage({
        container: "container",
        width: stageSize,
        height: stageSize,
    });

    layer = new Konva.Layer();
    stage.add(layer);

    // Set the width of the status bar and game container to match the canvas width
    document.getElementById('game-container').style.width = `${stageSize}px`;

    drawGrid();
    setupEventListeners();

    layer.draw();

    // generateObstacles(currentRoomCode, 0);
    initializeJoinRoom(roomId);
}

function reproduceAchievement(achievement) {
    // Extract data from the achievement
    const [achievementNumCells, achievementScore, solution, , , achievementNumObstacles] = achievement;

    // Set the number of cells and obstacles
    numCells = achievementNumCells;
    numObstacles = achievementNumObstacles;

    // Recalculate game area and grid size
    gameArea = Math.min(Math.floor(window.innerWidth - 50), 500);
    gridSize = Math.round(gameArea / (numCells + 1));
    halfGridSize = Math.round(gridSize / 2);
    stageSize = numCells * gridSize + 2 * margin;

    // Reinitialize the game with the new number of cells

    // Clear the current board using the existing functionality
    document.getElementById("clear-button").click();

    // Regenerate obstacles
    generateObstacles(currentRoomCode, numObstacles);

    // Reproduce each rectangle from the solution
    solution.forEach((rect) => {
        const newRect = new Konva.Rect({
            x: rect.x * gridSize + margin,
            y: rect.y * gridSize + margin,
            width: rect.width * gridSize,
            height: rect.height * gridSize,
            fill: rect.color,
            stroke: rectStrokeColor,
            strokeWidth: rectStrokeWidth,
            opacity: 1,
        });

        const label = new Konva.Text({
            x: 0,
            y: 0,
            text: `${Math.abs(rect.width)}x${Math.abs(rect.height)}`,
            fontSize: 20,
            fontFamily: "Calibri",
            fill: "black",
        });

        label.position({
            x: rect.x * gridSize + margin + rect.width * gridSize / 2 - label.width() / 2,
            y: rect.y * gridSize + margin + rect.height * gridSize / 2 - label.height() / 2,
        });

        layer.add(newRect);
        layer.add(label);
        newRect.attrs.label = label;
        label.attrs.rect = newRect;
    });

    // Redraw the layer
    layer.draw();

    // Update the rectangles list and achievements
    updateRectanglesList();

    logMessage(`Reproduced achievement: ${achievementNumCells}x${achievementNumCells} grid with score ${achievementScore} and ${numObstacles} obstacles`);
}

function drawGrid() {
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

function setupEventListeners() {
    stage.on("mousedown touchstart", handleMouseDown);
    stage.on("mousemove touchmove", handleMouseMove);
    stage.on("mouseup touchend", handleMouseUp);
}

function handleMouseDown(e) {
    const pos = stage.getPointerPosition();

    if (!isInsideCanvas(pos.x, pos.y)) {
        return; // Discard if outside the canvas
    }

    const clickedShape = layer.getIntersection(pos);

    if (clickedShape) {
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
    } else {
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
            opacity: 1,
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
}

function handleMouseMove(e) {
    if (!isDrawing) return;
    const pos = stage.getPointerPosition();

    if (!isInsideCanvas(pos.x, pos.y)) {
        isDrawing = false;
        rect.destroy();
        label.destroy();
        layer.draw();
        return;
    }

    let endX, endY;

    if (pos.x < rect.attrs.center_x) {
        // startX = rect.attrs.center_x + halfGridSize;
        startX = Math.ceil((rect.attrs.center_x - margin) / gridSize) * gridSize + margin;
        endX = Math.floor((pos.x - margin) / gridSize) * gridSize + margin;
    } else {
        startX = Math.floor((rect.attrs.center_x - margin) / gridSize) * gridSize + margin;
        endX = Math.floor((pos.x - margin) / gridSize) * gridSize + margin + gridSize;
    }

    if (pos.y < rect.attrs.center_y) {
        // startY = rect.attrs.center_y + halfGridSize;
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

    if (isOverlapping(rect)) {
        rect.fill("rgba(0, 0, 0, 0.2)");
    } else {
        rect.fill(chosenColor);
    }

    layer.draw();
}

function handleMouseUp() {
    clearTimeout(longPressTimeout);
    if (!isDrawing) return;
    isDrawing = false;
    if (isOverlapping(rect)) {
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

function isInsideCanvas(x, y) {
    return (
        x >= margin &&
        x <= stageSize - margin &&
        y >= margin &&
        y <= stageSize - margin
    );
}

function generateObstacles(seed, numObstacles = 0) {
    // Clear existing obstacles
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles = [];

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

    document.getElementById("clear-button").click();

    updateRectanglesList();
}

function rectanglesOverlap(r1, r2) {
    const overlap = !(
        r1.x >= r2.x + r2.width - 5 ||
        r1.x + r1.width - 5 <= r2.x ||
        r1.y >= r2.y + r2.height - 5 ||
        r1.y + r1.height - 5 <= r2.y
    );
    return overlap;
}

function isOverlapping(newRect) {
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

function updateRectanglesList() {
    const rects = layer.find("Rect");
    const areas = [];
    const dimensions = new Set();
    let duplicatesFound = false;
    const usedColors = new Set();

    rects.forEach((rect) => {
        const width = Math.abs(rect.width() / gridSize);
        const height = Math.abs(rect.height() / gridSize);
        const area = width * height;
        areas.push(area);
        if (dimensions.has([width, height].join("x"))) {
            logMessage("Error: Duplicate dimensions found.");
            duplicatesFound = true;
        } else {
            dimensions.add([width, height].join("x"));
            dimensions.add([height, width].join("x"));
        }
        usedColors.add(rect.fill());
    });

    const totalArea = areas.reduce((sum, area) => sum + area, 0) + obstacles.length;
    const boardArea = numCells * numCells;

    // const canvasStatusElement = document.getElementById("canvas-status");
    const duplicateStatusElement = document.getElementById("duplicate-status");
    const scoreStatusElement = document.getElementById("score-status");

    const canvasCovered = totalArea === boardArea;
    const noDuplicates = !duplicatesFound;
    const allColorsUsed = usedColors.size === colors.length;
    const singleColorUsed = usedColors.size === 1;
    const score = canvasCovered ? Math.max(...areas) - Math.min(...areas) : null;


    updateStatusText(
        duplicateStatusElement,
        noDuplicates ? "✓ No duplicates" : "✗ Duplicates found",
        noDuplicates ? "success" : "error"
    );
    updateStatusText(scoreStatusElement, score !== null ? `Score is ${score}` : "Score is ...");


    if (canvasCovered && noDuplicates) {
        const solution = rects.map(rect => {
            let x = (rect.x() - margin) / gridSize;
            let y = (rect.y() - margin) / gridSize;
            let width = rect.width() / gridSize;
            let height = rect.height() / gridSize;

            // Handle negative width
            if (width < 0) {
                x += width;
                width = Math.abs(width);
            }

            // Handle negative height
            if (height < 0) {
                y += height;
                height = Math.abs(height);
            }

            return {
                x,
                y,
                width,
                height,
                color: rect.fill()
            };
        });

        const timestamp = new Date().toUTCString();
        const achievement = [numCells, score, solution, timestamp, selfId, numObstacles];

        logMessage(achievements);
        if (!achievements.some(([, , sol]) => areSolutionsEqual(sol, solution))) {
            achievements.push(achievement);
            updateAchievementsList();
            // After updating the local achievements list, sync with Trystero
            if (room) {
                const [sendAchievements] = room.makeAction("achievements");
                sendAchievements(achievements);
            }
        }
    }

}

function areSolutionsEqual(sol1, sol2) {
    if (sol1.length !== sol2.length) return false;

    return sol1.every((dict, index) => {
        const keys1 = Object.keys(dict);
        const keys2 = Object.keys(sol2[index]);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => dict[key] === sol2[index][key]);
    });
}

function updateAchievementsList() {
    const tableBody = document.getElementById('detailed-log-table-body');

    // Clear existing rows
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    // Create a document fragment to hold the new rows
    const fragment = document.createDocumentFragment();

    // Sort achievements by timestamp (most recent first)

    const sortedAchievements = achievements
        .filter(([n, , , , , o]) => n === numCells && o === numObstacles) // Filter by current N and number of obstacles
        .sort((a, b) => {
            const scoreA = a[1];
            const scoreB = b[1];
            const timeA = new Date(a[3]);
            const timeB = new Date(b[3]);

            if (scoreA !== scoreB) {
                return scoreA - scoreB; // Sort by score (smallest first)
            } else {
                return timeA - timeB; // If scores are equal, sort by time (earliest first)
            }
        });

    // Update best score
    if (sortedAchievements.length > 0) {
        const bestScore = sortedAchievements[0][1];
        document.getElementById('best-score-status').textContent = `Best Score: ${bestScore}`;
    } else {
        document.getElementById('best-score-status').textContent = 'Best Score: N/A';
    }

    sortedAchievements.forEach(achievement => {
        const [n, score, solution, timestamp, playerId] = achievement;

        const row = document.createElement('tr');

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = `${score}`;
        row.appendChild(descriptionCell);

        const playerIdCell = document.createElement('td');
        const { icon, color } = getAvatarUrl(playerId);
        const playerIdShort = `<i class="fas ${icon}" style="color: ${color};" title="${playerId ? playerId.substring(0, 2) : '??'}"></i>`;
        playerIdCell.innerHTML = `${playerIdShort}`;
        row.appendChild(playerIdCell);

        const loadCell = document.createElement('td');
        const svg = createSVGPreview(n, solution, obstacles);
        svg.onclick = () => reproduceAchievement(achievement);
        loadCell.appendChild(svg);
        row.appendChild(loadCell);

        fragment.appendChild(row);
    });

    // Append the fragment to the table body
    tableBody.appendChild(fragment);
}
function createSVGPreview(gridSize, solution, obstacles) {
    const svgSize = 100; // Size of the SVG preview
    const cellSize = svgSize / gridSize;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgSize+4);
    svg.setAttribute("height", svgSize+4);
    svg.setAttribute("viewBox", `-2 -2 ${svgSize+4} ${svgSize+4}`);

    solution.forEach(rect => {
        const svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", rect.x * cellSize);
        svgRect.setAttribute("y", rect.y * cellSize);
        svgRect.setAttribute("width", rect.width * cellSize);
        svgRect.setAttribute("height", rect.height * cellSize);
        svgRect.setAttribute("fill", rect.color);
        svgRect.setAttribute("stroke", "black");
        svgRect.setAttribute("stroke-width", "2");
        svgRect.setAttribute("stroke-alignment", "center");
        svg.appendChild(svgRect);
    });

    obstacles.forEach(obstacle => {
        const svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle.setAttribute("cx", (obstacle.gridX + 0.5) * cellSize);
        svgCircle.setAttribute("cy", (obstacle.gridY + 0.5) * cellSize);
        svgCircle.setAttribute("r", cellSize / 4);
        svgCircle.setAttribute("fill", "black");
        svgCircle.setAttribute("stroke", "black");
        svgCircle.setAttribute("stroke-width", "0");
        svg.appendChild(svgCircle);
    });

    return svg;
}

function updateStatusText(element, text, addedClass) {
    element.textContent = text;
    element.classList.remove('success', 'error');
    if (addedClass) {
        element.classList.add(addedClass);
    }
}

function logMessage(message) {
    console.log(message);
}

// Obstacle selector functionality
const obstacleIcons = document.querySelectorAll('.obstacle-icon');
const defaultObstacleIcon = document.querySelector('.obstacle-icon[data-value="0"]');

// Set default selection to 0
defaultObstacleIcon.classList.add('selected');
numObstacles = 0;

obstacleIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        obstacleIcons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
        const selectedValue = parseInt(icon.getAttribute('data-value'));
        
        // Update numObstacles and regenerate obstacles
        numObstacles = selectedValue;
        generateObstacles(currentRoomCode, numObstacles);
        updateAchievementsList();
    });
});

// Clear button event listener
document.getElementById("clear-button").addEventListener("click", () => {
    layer.find("Rect").forEach((rect) => rect.destroy());
    layer.find("Text").forEach((text) => text.destroy());
    layer.draw();
    logMessage("Canvas cleared.");
    updateRectanglesList();
});

// Disable touch scrolling and refreshing
document.addEventListener(
    "touchmove",
    function (event) {
        event.preventDefault();
    },
    { passive: false }
);

// Prevent double-tap zoom
document.addEventListener("dblclick", function (event) {
    event.preventDefault();
});

function getAvatarUrl(seed) {
    const icons = ['fa-bug', 'fa-cat', 'fa-crow', 'fa-dog', 'fa-fish', 'fa-frog', 'fa-hippo', 'fa-kiwi-bird', 'fa-worm', 'fa-otter', 'fa-shrimp', 'fa-person'];
    const colors = ['#90EE90', '#FFB6C1', '#ADD8E6']; // light green, light red, light blue

    // Use a simple hash function to get a deterministic index
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    };

    const iconIndex = hashCode(seed) % icons.length;
    const colorIndex = hashCode(seed + 'color') % colors.length;

    const icon = icons[iconIndex];
    const color = colors[colorIndex];

    return { icon, color };
}

// Multiplayer routines

function updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = Array.from(users.keys()).map(userId => {
        const { icon, color } = getAvatarUrl(userId);
        return `<i class="fas ${icon}" style="color: ${color};" title="${userId ? userId.substring(0, 2) : '??'}"></i>`;
    }).join('');
}

function updateAchievements(newAchievements) {
    let updated = false;
    
    // Add new achievements
    for (const newAchievement of newAchievements) {
        if (!achievements.some(a => 
            JSON.stringify(a[2]) === JSON.stringify(newAchievement[2]) && 
            a[1] === newAchievement[1] && 
            a[4] === newAchievement[4]
        )) {
            achievements.push(newAchievement);
            updated = true;
        }
    }
    
    // Check for achievements that are not in newAchievements
    const missingAchievements = achievements.filter(a => 
        !newAchievements.some(na => 
            JSON.stringify(na[2]) === JSON.stringify(a[2]) && 
            na[1] === a[1] && 
            na[4] === a[4]
        )
    );
    
    if (missingAchievements.length > 0 || updated) {
        // Broadcast the merged array
        if (sendAchievements) {
            sendAchievements(achievements);
        }
    }
    
    updateAchievementsList();
}

function sendGameState() {
    if (sendAchievements) {
        sendAchievements(achievements);
    }
    // if (sendObstacles && obstacles.length > 0) {
    //     sendObstacles(obstacles.map(o => ({ x: o.x(), y: o.y() })));
    // }
}

function initializeJoinRoom(roomId) {
    currentRoomCode = roomId.join(',');

    const appId = `mondrian-${currentRoomCode}`;
    const config = { appId: appId };

    room = joinRoom(config, currentRoomCode);

    const { icon, color } = getAvatarUrl(selfId);
    const playerIdShort = `<i class="fas ${icon}" style="color: ${color};" title="${selfId ? selfId.substring(0, 2) : '??'}"></i>`;
    document.getElementById("myId").innerHTML = playerIdShort;
    document.getElementById("roomId").innerHTML = `
        ${roomId.map(animal => `<i class="icon fas fa-${animal}" data-animal="${animal}"></i>`).join('\n')}`;

    [sendAchievements, receiveAchievements] = room.makeAction("achievements");
    receiveAchievements(updateAchievements);

    // [sendObstacles, receiveObstacles] = room.makeAction("obstacles");
    // receiveObstacles(handleReceivedObstacles);

    room.onPeerJoin((userId) => {
        users.set(userId, true);
        updateUserList();
        sendGameState();
    });

    room.onPeerLeave((userId) => {
        users.delete(userId);
        updateUserList();
    });


    logMessage("Connected to room. Room code:", currentRoomCode);
}