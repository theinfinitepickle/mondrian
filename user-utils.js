export function getAvatarUrl(seed) {
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

export function updateUserList(users) {
    const userList = document.getElementById("userList");
    if (!users) {
        userList.innerHTML = '';
        return;
    }
    userList.innerHTML = Array.from(users.keys()).map(userId => {
        const { icon, color } = getAvatarUrl(userId);
        return `<i class="fas ${icon}" style="color: ${color};" title="${userId ? userId.substring(0, 2) : '??'}"></i>`;
    }).join('');
}