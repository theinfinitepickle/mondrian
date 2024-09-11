import { joinRoom, selfId as trysteroSelfId } from "./trystero-nostr.min.js";
import { 
    achievements, 
    obstacles, 
    numObstacles, 
    numCells, 
    layer, 
    updateRectanglesList, 
    reproduceAchievement,
    updateAchievementsList // Add this import
} from './game-logic-multiplayer.js';

export let selfId = trysteroSelfId;
export let currentRoomCode = null;

let room;
let sendAchievements, receiveAchievements;
const users = new Map(); // Add this line to define the users Map

export function initializeMultiplayer(roomId) {
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

export function sendGameState() {
    if (sendAchievements) {
        sendAchievements(achievements);
    }
}

export function updateAchievements(newAchievements) {
    let updated = false;
    
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
    
    const missingAchievements = achievements.filter(a => 
        !newAchievements.some(na => 
            JSON.stringify(na[2]) === JSON.stringify(a[2]) && 
            na[1] === a[1] && 
            na[4] === a[4]
        )
    );
    
    if (missingAchievements.length > 0 || updated) {
        if (sendAchievements) {
            sendAchievements(achievements);
        }
    }
    
    updateAchievementsList(); // This should now work
}

export function updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = Array.from(users.keys()).map(userId => {
        const { icon, color } = getAvatarUrl(userId);
        return `<i class="fas ${icon}" style="color: ${color};" title="${userId ? userId.substring(0, 2) : '??'}"></i>`;
    }).join('');
}

function getAvatarUrl(seed) {
    const icons = ['fa-bug', 'fa-cat', 'fa-crow', 'fa-dog', 'fa-fish', 'fa-frog', 'fa-hippo', 'fa-kiwi-bird', 'fa-worm', 'fa-otter', 'fa-shrimp', 'fa-person'];
    const colors = ['#90EE90', '#FFB6C1', '#ADD8E6'];

    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const iconIndex = hashCode(seed) % icons.length;
    const colorIndex = hashCode(seed + 'color') % colors.length;

    const icon = icons[iconIndex];
    const color = colors[colorIndex];

    return { icon, color };
}