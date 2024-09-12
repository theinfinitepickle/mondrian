import { achievements } from './game-logic-multiplayer.js';

// Save achievements to Local Storage
export function saveAchievements() {
  localStorage.setItem('achievements', JSON.stringify(achievements));
}

// Load achievements from Local Storage
export function loadAchievements() {
  const storedAchievements = localStorage.getItem('achievements');
  if (storedAchievements) {
    achievements.length = 0; // Clear the existing array
    achievements.push(...JSON.parse(storedAchievements));
  }
}

// Check if achievements exist in Local Storage
export function achievementsExist() {
  return localStorage.getItem('achievements') !== null;
}

// Clear achievements from Local Storage
export function clearAchievements() {
  localStorage.removeItem('achievements');
}

