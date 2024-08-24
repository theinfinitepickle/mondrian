let numCells = 8; // Default to 4x4 grid
let gameArea = Math.min(Math.floor(window.innerWidth - 75), 500);
let gridSize = Math.round(gameArea / (numCells + 1));
let halfGridSize = Math.round(gridSize / 2);
const margin = 30;// Math.round(halfGridSize);
let stageSize = numCells * gridSize + 2 * margin;

let achievements = [];

let obstacles = []; // Global variable to store all obstacles

const colors = ["blue", "red", "yellow", "white"];

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

let sendObstacles;
let receiveObstacles;
let sendAchievements;
let receiveAchievements;


function initGame() {
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
}

// Save achievements to Local Storage
function saveAchievements() {
    //   localStorage.setItem('achievements', JSON.stringify(achievements));
}

// document.getElementById('reset-achievements-link').addEventListener('click', function(event) {
//   event.preventDefault(); // Prevent the default link behavior

//   if (confirm('Are you sure you want to reset your achievements?')) {
//     localStorage.removeItem('achievements'); // Remove achievements from Local Storage
//     alert('Achievements have been reset.');

//     // Optionally reload the page or update the UI
//     achievements = [];
//     loadAchievements(); // Reload the achievements (which should now be empty)
//     updateAchievementsList(); // Update the UI to reflect the reset
//     document.getElementById("clear-button").click();
//   }
// });

function reproduceAchievement(achievement) {
    // Extract data from the achievement
    const [achievementNumCells, achievementScore, solution] = achievement;

    // Set the number of cells
    numCells = achievementNumCells;

    // Recalculate game area and grid size
    gameArea = Math.min(Math.floor(window.innerWidth - 50), 500);
    gridSize = Math.round(gameArea / (numCells + 1));
    halfGridSize = Math.round(gridSize / 2);
    stageSize = numCells * gridSize + 2 * margin;

    // Reinitialize the game with the new number of cells
    // initGame();

    // Clear the current board using the existing functionality
    document.getElementById("clear-button").click();

    // Reproduce each rectangle from the solution
    solution.forEach((rect) => {
        const newRect = new Konva.Rect({
            x: rect.x * gridSize + margin,
            y: rect.y * gridSize + margin,
            width: rect.width * gridSize,
            height: rect.height * gridSize,
            fill: rect.color,
            stroke: "black",
            strokeWidth: 4,
            opacity: 0.7,
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

    console.log(`Reproduced achievement: ${achievementNumCells}x${achievementNumCells} grid with score ${achievementScore}`);
}

// Load achievements from Local Storage
function loadAchievements() {
    //   const storedAchievements = localStorage.getItem('achievements');
    //   if (storedAchievements) {
    //     achievements = JSON.parse(storedAchievements);
    //   }
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
    document.getElementById('generate-obstacles-button').addEventListener('click', generateObstacles);
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
            stroke: "black",
            strokeWidth: 4,
            opacity: 0.7,
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
        rect.fill("black");
        rect.opacity(0.2);
    } else {
        rect.fill(chosenColor);
        rect.opacity(0.7);
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

function generateObstacles() {
    // Clear existing obstacles
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles = [];

    const numObstacles = 3; // 10% of cells will be obstacles
    const occupiedCells = new Set();

    for (let i = 0; i < numObstacles; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * numCells);
            y = Math.floor(Math.random() * numCells);
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

        obstacles.push(obstacle);
        layer.add(obstacle);
    }

    layer.draw();
    updateRectanglesList();

    // Send obstacles to other players if in a room
    if (room && sendObstacles) {
        sendObstacles(obstacles.map(o => ({ x: o.x(), y: o.y() })));
    }
}


function rectanglesOverlap(r1, r2) {
    const overlap = !(
        r1.x >= r2.x + r2.width - 5 ||
        r1.x + r1.width - 5 <= r2.x ||
        r1.y >= r2.y + r2.height - 5 ||
        r1.y + r1.height - 5 <= r2.y
    );
    console.log(r1, r2, overlap);
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

    const canvasStatusElement = document.getElementById("canvas-status");
    const duplicateStatusElement = document.getElementById("duplicate-status");
    const scoreStatusElement = document.getElementById("score-status");

    const canvasCovered = totalArea === boardArea;
    const noDuplicates = !duplicatesFound;
    const allColorsUsed = usedColors.size === colors.length;
    const singleColorUsed = usedColors.size === 1;
    const score = canvasCovered ? Math.max(...areas) - Math.min(...areas) : null;

    updateStatusText(
        canvasStatusElement,
        canvasCovered ? "✓ Canvas covered" : "✗ Canvas is not covered",
        canvasCovered ? "success" : "error"
    );
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

        const timestamp = new Date().toISOString();
        const achievement = [numCells, score, solution, timestamp, selfId];

        if (!achievements.some(([, , sol]) => areSolutionsEqual(sol, solution))) {
            achievements.push(achievement);
            updateAchievementsList();
            saveAchievements();
            // After updating the local achievements list, sync with Trystero
            if (room) {
                const [sendAchievements] = room.makeAction("achievements");
                sendAchievements(achievements);
            }
        }
    }

    console.log("Achievements:", achievements);
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
        .filter(([n]) => n === numCells) // Filter by current N
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


    sortedAchievements.forEach(achievement => {
        const [n, score, solution, timestamp, playerId] = achievement;

        const row = document.createElement('tr');

        // const achievementCell = document.createElement('td');
        // achievementCell.textContent = `${n}`;
        // row.appendChild(achievementCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = `${score}`;
        row.appendChild(descriptionCell);

        const playerIdCell = document.createElement('td');
        const playerIdShort = `<img src="${getAvatarUrl(playerId)}" alt="${playerId ? playerId.substring(0, 2) : '??'}">`
        playerIdCell.innerHTML = `${playerIdShort}`;
        row.appendChild(playerIdCell);

        // const dateCell = document.createElement('td');
        // dateCell.textContent = new Date(timestamp).toLocaleString();
        // row.appendChild(dateCell);

        const loadCell = document.createElement('td');
        const svg = createSVGPreview(n, solution);
        svg.onclick = () => reproduceAchievement(achievement);
        loadCell.appendChild(svg);
        row.appendChild(loadCell);

        console.log(row);

        fragment.appendChild(row);



    });

    // Append the fragment to the table body
    tableBody.appendChild(fragment);
}

function createSVGPreview(gridSize, solution) {
    const svgSize = 100; // Size of the SVG preview
    const cellSize = svgSize / gridSize;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgSize);
    svg.setAttribute("height", svgSize);
    svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

    solution.forEach(rect => {
        const svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", rect.x * cellSize);
        svgRect.setAttribute("y", rect.y * cellSize);
        svgRect.setAttribute("width", rect.width * cellSize);
        svgRect.setAttribute("height", rect.height * cellSize);
        svgRect.setAttribute("fill", rect.color);
        svgRect.setAttribute("stroke", "black");
        svgRect.setAttribute("stroke-width", "5");
        svg.appendChild(svgRect);
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

// Setup event listeners for grid size selection
document.querySelectorAll('input[name="grid-size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        numCells = parseInt(e.target.value);
        gridSize = Math.round(gameArea / (numCells + 1));
        console.log(numCells, gridSize);
        initGame();
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

// Initialize the game
initGame();
// Call this function when the app initializes
loadAchievements();
updateAchievementsList();

function getAvatarUrl(seed) {
    const baseUrl = 'https://api.dicebear.com/9.x/icons/svg';
    const icons = 'alarm,bell,egg,flower2,snow2,umbrella';
    const radius = 25;

    const url = new URL(baseUrl);
    url.searchParams.append('icon', icons);
    url.searchParams.append('radius', radius);
    url.searchParams.append('size', 32);
    url.searchParams.append('seed', seed);

    console.log(seed);
    return url.toString();
}

// Multiplayer routines

function updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = Array.from(users.keys()).map(userId => `<li><img src="${getAvatarUrl(userId)}" alt="${userId ? userId.substring(0, 2) : '??'}"></li>`).join('');
}

function updateAchievements(newAchievements) {
    console.log("newAchievements");
    console.log(newAchievements);
    achievements = newAchievements;
    updateAchievementsList();
}


function generateRoomCode() {
    const parts = [
        Math.random().toString(36).substr(2, 3),
        Math.random().toString(36).substr(2, 2),
        Math.random().toString(36).substr(2, 2)
    ];
    return parts.join('-').toUpperCase();
}


function sendGameState() {
    if (sendAchievements) {
        sendAchievements(achievements);
    }
    if (sendObstacles && obstacles.length > 0) {
        sendObstacles(obstacles.map(o => ({ x: o.x(), y: o.y() })));
    }
}

function initializeNewRoom() {
    currentRoomCode = generateRoomCode();
    const appId = `mondrian-${currentRoomCode}`;
    const config = { appId: appId };

    room = joinRoom(config, currentRoomCode);

    document.getElementById("myId").innerHTML = `<img src="${getAvatarUrl(selfId)}" alt="${selfId ? selfId.substring(0, 2) : '??'}">`;
    document.getElementById("roomId").textContent = currentRoomCode;

    [sendAchievements, receiveAchievements] = room.makeAction("achievements");
    receiveAchievements(updateAchievements);

    [sendObstacles, receiveObstacles] = room.makeAction("obstacles");
    receiveObstacles(handleReceivedObstacles);

    room.onPeerJoin((userId) => {
        users.set(userId, true);
        updateUserList();
        sendGameState();
    });

    room.onPeerLeave((userId) => {
        users.delete(userId);
        updateUserList();
    });

    console.log("Connected to new room. Room code:", currentRoomCode);
}

function initializeJoinRoom(roomCode) {
    currentRoomCode = roomCode;
    const appId = `mondrian-${currentRoomCode}`;
    const config = { appId: appId };

    room = joinRoom(config, currentRoomCode);

    document.getElementById("myId").innerHTML = `<img src="${getAvatarUrl(selfId)}" alt="${selfId ? selfId.substring(0, 2) : '??'}">`;
    document.getElementById("roomId").textContent = currentRoomCode;

    [sendAchievements, receiveAchievements] = room.makeAction("achievements");
    receiveAchievements(updateAchievements);

    [sendObstacles, receiveObstacles] = room.makeAction("obstacles");
    receiveObstacles(handleReceivedObstacles);

    room.onPeerJoin((userId) => {
        users.set(userId, true);
        updateUserList();
        sendGameState();
    });

    room.onPeerLeave((userId) => {
        users.delete(userId);
        updateUserList();
    });

    console.log("Connected to room. Room code:", currentRoomCode);
}


function handleReceivedObstacles(receivedObstacles) {
    // Clear existing obstacles
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles = [];

    // Create new obstacles based on received data
    receivedObstacles.forEach(obs => {
        const obstacle = new Konva.Circle({
            x: obs.x,
            y: obs.y,
            radius: gridSize / 4,
            fill: 'gray',
            stroke: 'black',
            strokeWidth: 2,
        });

        obstacles.push(obstacle);
        layer.add(obstacle);
    });

    layer.draw();
    updateRectanglesList();
}


document.getElementById("new-room").addEventListener("click", initializeNewRoom);

document.getElementById("join-room").addEventListener("click", () => {
    document.getElementById("join-room-dialog").showModal();
});

document.getElementById("connect-to-room").addEventListener("click", () => {
    const roomCode = document.getElementById("room-code").value.toUpperCase();
    if (roomCode) {
        initializeJoinRoom(roomCode);
        document.getElementById("join-room-dialog").close();
    } else {
        alert("Please enter a valid room code.");
    }
});

