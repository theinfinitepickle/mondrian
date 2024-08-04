// achievements.js
export const getAchievements = (N) => {
    const baseAchievements = [
      { id: 'full_canvas', description: 'Cover the entire canvas', completed: false },
      { id: 'no_duplicates', description: 'No duplicate rectangle sizes', completed: false },
     ];
  
    const sizeSpecificAchievements = {
      6: [
        { id: 'max_rectangles', description: 'Use the maximum number of rectangles (36)', completed: false },
        { id: 'min_rectangles', description: 'Use the minimum number of rectangles (1)', completed: false },
        { id: 'score_under_10', description: 'Achieve a score under 10', completed: false },
      ],
      // Add more size-specific achievements for different N values here
    };
  
    return [...baseAchievements, ...(sizeSpecificAchievements[N] || [])];
  };