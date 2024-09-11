import { createStage, drawGrid, updateGridSize } from './grid-creation.js';
import { createSVGPreview } from './svg-preview.js';
import { isInsideCanvas, isOverlapping, updateStatusText, logMessage } from './canvas-utils.js';
import { areSolutionsEqual, calculateTimeDifference } from './achievement-utils.js';
import { getAvatarUrl, updateUserList } from './user-utils.js';
import { setupEventListeners } from './canvas-interactions.js';
import { levels, getLevelById } from './levels.js';

export let obstacles = [];
export let numObstacles = 0;

export let currentLevel = 80;

export const margin = 30;
export let numCells = 8;
export let gameArea = Math.min(Math.floor(window.innerWidth - 75), 500);
export let gridSize = Math.round(gameArea / (numCells + 1));
export let halfGridSize = Math.round(gridSize / 2);
export let stageSize = numCells * gridSize + 2 * margin;

export function updateGameArea(newNumCells) {
    numCells = newNumCells;
    gameArea = Math.min(Math.floor(window.innerWidth - 75), 500);
    gridSize = Math.round(gameArea / (numCells + 1));
    halfGridSize = Math.round(gridSize / 2);
    stageSize = numCells * gridSize + 2 * margin;
}

let achievements = [];

export const colors = [
    "rgba(0, 0, 255, 0.7)",   // blue with opacity
    "rgba(255, 0, 0, 0.7)",   // red with opacity
    "rgba(255, 255, 0, 0.7)", // yellow with opacity
    "rgba(255, 255, 255, 0.7)" // white with opacity
];

const rectStrokeColor = "rgba(0, 0, 0, 1)";
const rectStrokeWidth = 4;
const rectOpacity = 0.7;

let stage, layer;

// Mupltiplayer variables
import { joinRoom, selfId } from "./trystero-nostr.min.js";
import { generateObstacles } from './level-creation.js';
const users = new Map();
let room;
let currentRoomCode = null;
    
// let sendObstacles;
// let receiveObstacles;
let sendAchievements;
let receiveAchievements;

let regime;


export function initGame(roomId) {
    if (roomId) {
        regime = "multiplayer";
    } else {
        regime = "solo";
    }
    // Clear existing stage if it exists
    if (stage) {
        stage.destroy();
    }

    const { stage: newStage, layer: newLayer } = createStage("container");
    stage = newStage;
    layer = newLayer;

    drawGrid(layer);
    setupEventListeners(stage, layer);

    layer.draw();
    if (regime === "multiplayer") {
        // Obstacle selector functionality
        const obstacleIcons = document.querySelectorAll('.obstacle-icon');
        const defaultObstacleIcon = document.querySelector('.obstacle-icon[data-value="0"]');
        
        // Set default selection to 0
        defaultObstacleIcon.classList.add('selected');
        numObstacles = 0;

        initializeJoinRoom(roomId);
        obstacleIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                obstacleIcons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                const selectedValue = parseInt(icon.getAttribute('data-value'));
                
                // Update numObstacles and regenerate obstacles
                numObstacles = selectedValue;
                logMessage(numObstacles);
                obstacles = generateObstacles(currentRoomCode, numObstacles, obstacles, layer, gridSize, margin, numCells, currentLevel);
                logMessage(obstacles);
                
                // Clear the canvas and update the rectangles list
                document.getElementById("clear-button").click();
                updateRectanglesList();
                updateAchievementsList();
            });
        });
    } else if (regime === "solo") {
        // Add click events for playing videos and selecting levels
        const levelIcons = document.querySelectorAll('.level-icon');
        levelIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                // Remove 'selected' class from all icons
                levelIcons.forEach(i => i.classList.remove('selected'));
                // Add 'selected' class to the clicked icon
                icon.classList.add('selected');

                const value = icon.getAttribute('data-value');
                if (value.startsWith('video')) {
                    // Play video function (to be implemented)
                    playVideo(value);
                } else {
                    // Update currentLevel and generate level
                    currentLevel = parseInt(value);
                    const level = getLevelById(currentLevel);
                    numCells = level.gridSize;
                    gridSize = Math.round(gameArea / (numCells + 1));
                    halfGridSize = Math.round(gridSize / 2);
                    stageSize = numCells * gridSize + 2 * margin;
                    // Redraw the game field to match numCells
                    stage.width(stageSize);
                    stage.height(stageSize);
                    layer.removeChildren();
                    drawGrid(layer);
                    obstacles = generateObstacles(currentRoomCode, numObstacles, obstacles, layer, gridSize, margin, numCells, currentLevel);
                    generateLevel(currentLevel);
                    updateRectanglesList();
                    updateAchievementsList();

                    if (regime === "solo") {
                            document.getElementById('target-score-status').textContent = `Target Score: ${level.targetScore}`;

                    }
                }
            });
        });

        // Select level 1 by default
        const defaultLevelIcon = document.querySelector('.level-icon[data-value="1"]');
        if (defaultLevelIcon) {
            defaultLevelIcon.classList.add('selected');
            generateLevel(1);
        }
    }
}

// Placeholder functions for video playback and level generation
function playVideo(videoId) {
    console.log(`Playing video: ${videoId}`);
    // Implement video playback logic here
}

function generateLevel(levelNumber) {
    console.log(`Generating level: ${levelNumber}`);
    // Implement level generation logic here
}

function reproduceAchievement(achievement) {
    // Extract data from the achievement
    const [achievementNumCells, achievementScore, solution, , , achievementNumObstacles] = achievement;

    // Set the number of cells and obstacles
    updateGridSize(achievementNumCells);
    numObstacles = achievementNumObstacles;

    // Reinitialize the game with the new number of cells
    initGame(currentRoomCode.split(','));

    // Regenerate obstacles
    // obstacles.length = 0; // Clear the existing obstacles
    // obstacles.push(...generateObstacles(currentRoomCode, numObstacles, [], layer));

    // Clear the canvas before reproducing the achievement
    document.getElementById("clear-button").click();

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
            opacity: rectOpacity,
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

export function updateRectanglesList() {
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
        const achievement = [numCells, score, solution, timestamp, selfId, numObstacles, currentLevel];

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

function updateAchievementsList() {
    const tableBody = document.getElementById('detailed-log-table-body');
    // Define a variable for the earliest achievement time
    const earliestAchievementTime = achievements.length > 0 
        ? new Date(Math.min(...achievements.map(achievement => new Date(achievement[3]))))
        : null;

    // Clear existing rows
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    // Create a document fragment to hold the new rows
    const fragment = document.createDocumentFragment();

    let sortedAchievements = [];
    // Sort achievements by timestamp (most recent first)
    if (regime === "multiplayer") {
        sortedAchievements = achievements
            .filter(([n, , , , , o, l]) => n === numCells && o === numObstacles && l === currentLevel) // Filter by current N and number of obstacles
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
    } else if (regime === "solo") {
        sortedAchievements = achievements
            .filter(([n, , , , , , l]) => n === numCells && l === currentLevel) // Filter by current N and number of obstacles
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
    }

 
    // Update best score
    if (regime === "multiplayer") {
        if (sortedAchievements.length > 0) {
            const bestScore = sortedAchievements[0][1];
            document.getElementById('best-score-status').textContent = `Best Score: ${bestScore}`;
        } else {
            document.getElementById('best-score-status').textContent = 'Best Score: N/A';
        }
    }

    sortedAchievements.forEach(achievement => {
        const [n, score, solution, timestamp, playerId] = achievement;

        const row = document.createElement('tr');
        const descriptionCell = document.createElement('td');
        descriptionCell.innerHTML = `${score}<br><span style="opacity: 0.5; font-size: 0.8em;">${calculateTimeDifference(earliestAchievementTime, timestamp)}</span>`;
        row.appendChild(descriptionCell);

        if (regime === "multiplayer") {
            const playerIdCell = document.createElement('td');
            const { icon, color } = getAvatarUrl(playerId);
            const playerIdShort = `<i class="fas ${icon}" style="color: ${color};" title="${playerId ? playerId.substring(0, 2) : '??'}"></i>`;
            playerIdCell.innerHTML = `${playerIdShort}`;
            row.appendChild(playerIdCell);
        }

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


// Multiplayer routines
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
        updateUserList(users);
        sendGameState();
    });

    room.onPeerLeave((userId) => {
        users.delete(userId);
        updateUserList(users);
    });

    logMessage("Connected to room. Room code:", currentRoomCode);
}

// Clear button event listener
document.getElementById("clear-button").addEventListener("click", () => {
    layer.find("Rect").forEach((rect) => rect.destroy());
    layer.find("Text").forEach((text) => text.destroy());
    layer.draw();
    logMessage("Canvas cleared.");
    updateRectanglesList();
});