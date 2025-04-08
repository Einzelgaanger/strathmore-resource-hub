
export const RANKS = [
  { name: 'Freshman Scholar', icon: '🔍', min: 0, max: 99, class: 'freshman' },
  { name: 'Knowledge Seeker', icon: '📚', min: 100, max: 299, class: 'seeker' },
  { name: 'Dedicated Learner', icon: '✏️', min: 300, max: 599, class: 'learner' },
  { name: 'Resource Ranger', icon: '🗂️', min: 600, max: 999, class: 'ranger' },
  { name: 'Academic Achiever', icon: '🏆', min: 1000, max: 1499, class: 'achiever' },
  { name: 'Knowledge Champion', icon: '🎓', min: 1500, max: 2199, class: 'champion' },
  { name: 'Resource Virtuoso', icon: '⭐', min: 2200, max: 2999, class: 'virtuoso' },
  { name: 'Campus Maven', icon: '🌟', min: 3000, max: 3999, class: 'maven' },
  { name: 'Educational Elite', icon: '👑', min: 4000, max: 5499, class: 'elite' },
  { name: 'Stratizen Legend', icon: '🔱', min: 5500, max: 999999, class: 'legend' }
];

export const DEFAULT_PASSWORD = 'stratizens#web';

export const RESOURCE_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'note', label: 'Note' },
  { value: 'past_paper', label: 'Past Paper' }
];

export const POINT_VALUES = {
  login: 10,
  perMinuteOnline: 1,
  uploadNote: 50,
  uploadAssignment: 10,
  uploadPastPaper: 20,
  comment: 1,
  completeAssignment: 20,
  overdueAssignment: -50
};
