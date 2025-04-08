
// Default password for new users
export const DEFAULT_PASSWORD = "stratizens#web";

// Rank definitions (as fallback if ranks can't be loaded from database)
export const RANKS = [
  { id: 1, name: 'Freshman Scholar', icon: '🔍', min: 0, max: 99, min_points: 0, max_points: 99, class: 'freshman' },
  { id: 2, name: 'Knowledge Seeker', icon: '📚', min: 100, max: 299, min_points: 100, max_points: 299, class: 'seeker' },
  { id: 3, name: 'Dedicated Learner', icon: '✏️', min: 300, max: 599, min_points: 300, max_points: 599, class: 'learner' },
  { id: 4, name: 'Resource Ranger', icon: '🗂️', min: 600, max: 999, min_points: 600, max_points: 999, class: 'ranger' },
  { id: 5, name: 'Academic Achiever', icon: '🏆', min: 1000, max: 1499, min_points: 1000, max_points: 1499, class: 'achiever' },
  { id: 6, name: 'Knowledge Champion', icon: '🎓', min: 1500, max: 2199, min_points: 1500, max_points: 2199, class: 'champion' },
  { id: 7, name: 'Resource Virtuoso', icon: '⭐', min: 2200, max: 2999, min_points: 2200, max_points: 2999, class: 'virtuoso' },
  { id: 8, name: 'Campus Maven', icon: '🌟', min: 3000, max: 3999, min_points: 3000, max_points: 3999, class: 'maven' },
  { id: 9, name: 'Educational Elite', icon: '👑', min: 4000, max: 5499, min_points: 4000, max_points: 5499, class: 'elite' },
  { id: 10, name: 'Stratizen Legend', icon: '🔱', min: 5500, max: 999999, min_points: 5500, max_points: 999999, class: 'legend' },
];
