// Day mapping for the 7-day cycle
const DAY_TOPICS = {
  0: { // Sunday
    anchor: 'Linked Lists',
    repetition: 'Binary Search' // from Thursday (3 days ago)
  },
  1: { // Monday
    anchor: 'Arrays & Hashing',
    repetition: 'Stacks' // from Friday (3 days ago)
  },
  2: { // Tuesday
    anchor: 'Two Pointers',
    repetition: 'Trees (Basics)' // from Saturday (3 days ago)
  },
  3: { // Wednesday
    anchor: 'Sliding Window',
    repetition: 'Linked Lists' // from Sunday (3 days ago)
  },
  4: { // Thursday
    anchor: 'Binary Search',
    repetition: 'Arrays & Hashing' // from Monday (3 days ago)
  },
  5: { // Friday
    anchor: 'Stacks',
    repetition: 'Two Pointers' // from Tuesday (3 days ago)
  },
  6: { // Saturday
    anchor: 'Trees (Basics)',
    repetition: 'Sliding Window' // from Wednesday (3 days ago)
  }
};

/**
 * Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getTodayDayOfWeek() {
  return new Date().getDay();
}

/**
 * Get today's topics (anchor and repetition)
 * This is a fallback function - the actual implementation should fetch from database
 */
export function getTodayTopics() {
  const dayOfWeek = getTodayDayOfWeek();
  return DAY_TOPICS[dayOfWeek];
}

/**
 * Get the date N days from today
 */
export function getDateNDaysFromToday(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  date.setHours(0, 0, 0, 0); // Reset to start of day
  return date;
}

/**
 * Get the date for 3 days from today (for repetition scheduling)
 * This is a fallback - use getRepetitionDateFromPlan() instead
 */
export function getRepetitionDate() {
  return getDateNDaysFromToday(3);
}

/**
 * Get repetition date based on practice plan
 * Finds the next day when the given topic is scheduled as the repetition topic
 */
export async function getRepetitionDateFromPlan(topic) {
  // Import here to avoid circular dependency
  const PracticePlan = (await import('../models/PracticePlan.js')).default;
  
  const today = new Date();
  const todayDayOfWeek = today.getDay();
  
  // Get all practice plans
  const plans = await PracticePlan.find().sort({ dayOfWeek: 1 });
  
  if (plans.length === 0) {
    // No custom plan, fallback to 3 days
    return getRepetitionDate();
  }
  
  // Find the next day when this topic is the repetition topic
  // Check the next 7 days (one full week cycle)
  for (let i = 1; i <= 7; i++) {
    const checkDay = (todayDayOfWeek + i) % 7;
    const plan = plans.find(p => p.dayOfWeek === checkDay);
    
    if (plan && plan.repetitionTopic === topic) {
      // Found the day - return the date
      return getDateNDaysFromToday(i);
    }
  }
  
  // If not found in the next 7 days, fallback to 3 days
  return getRepetitionDate();
}

/**
 * Get the date for a specific day of week (0-6)
 * Returns the date of that day in the current week
 */
export function getDateForDayOfWeek(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = dayOfWeek - currentDay;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Format date to YYYY-MM-DD string (using local timezone)
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

/**
 * Check if a date is in the past (before today)
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

