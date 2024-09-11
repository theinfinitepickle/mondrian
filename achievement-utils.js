export function areSolutionsEqual(sol1, sol2) {
    if (sol1.length !== sol2.length) return false;

    return sol1.every((dict, index) => {
        const keys1 = Object.keys(dict);
        const keys2 = Object.keys(sol2[index]);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => dict[key] === sol2[index][key]);
    });
}

export function calculateTimeDifference(time1, time2) {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    
    const diffInSeconds = Math.abs(date2 - date1) / 1000;
    
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = Math.floor(diffInSeconds % 60);
    
    let result = '';
    
    if (hours > 0) {
        result += `${hours}h`;
    }
    
    if (minutes > 0 || hours > 0) {
        result += `${minutes}m`;
    }
    
    result += `${seconds.toString().padStart(2, '0')}s`;
    
    return result;
}