import { getDateNDaysFromToday } from './dayUtils.js';

/**
 * Calculate repetition interval based on solve count and difficulty
 * @param {number} solveCount - Number of times problem has been solved
 * @param {string} difficulty - 'Easy', 'Medium', or 'Hard'
 * @returns {number} Interval in days
 */
export function calculateInterval(solveCount, difficulty) {
  let baseInterval;
  
  switch(solveCount) {
    case 1: baseInterval = 1; break;
    case 2: baseInterval = 3; break;
    case 3: baseInterval = 7; break;
    case 4: baseInterval = 14; break;
    case 5: baseInterval = 30; break;
    default: baseInterval = 60; // Cap at 60 days for solveCount >= 6
  }
  
  // Difficulty adjustments
  const multiplier = {
    'Easy': 1.25,   // +25% (longer intervals - easier problems)
    'Medium': 1.0,  // Standard
    'Hard': 0.75    // -25% (shorter intervals - harder problems need more practice)
  };
  
  return Math.ceil(baseInterval * (multiplier[difficulty] || 1.0));
}

/**
 * Find the next day when a topic is scheduled as the repetition topic
 * @param {string} problemTopic - The topic to find
 * @param {Date} fromDate - Start searching from this date
 * @returns {Promise<Date>} Next date when topic is repetition topic
 */
export async function findNextTopicDay(problemTopic, fromDate) {
  // Import here to avoid circular dependency
  const PracticePlan = (await import('../models/PracticePlan.js')).default;
  
  const startDate = new Date(fromDate);
  startDate.setUTCHours(0, 0, 0, 0);
  
  // Get all practice plans
  const plans = await PracticePlan.find().sort({ dayOfWeek: 1 });
  
  if (plans.length === 0) {
    // No practice plan, fallback to 3 days from fromDate
    const fallbackDate = new Date(fromDate);
    fallbackDate.setDate(fallbackDate.getDate() + 3);
    fallbackDate.setUTCHours(0, 0, 0, 0);
    return fallbackDate;
  }
  
  // Check next 14 days (2 weeks) for the topic
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(startDate.getDate() + i);
    const dayOfWeek = checkDate.getDay();
    
    const plan = plans.find(p => p.dayOfWeek === dayOfWeek);
    if (plan && plan.repetitionTopic === problemTopic) {
      checkDate.setUTCHours(0, 0, 0, 0);
      return checkDate;
    }
  }
  
  // If not found in 14 days, find in next cycle (check up to 4 weeks)
  for (let i = 14; i < 28; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(startDate.getDate() + i);
    const dayOfWeek = checkDate.getDay();
    
    const plan = plans.find(p => p.dayOfWeek === dayOfWeek);
    if (plan && plan.repetitionTopic === problemTopic) {
      checkDate.setUTCHours(0, 0, 0, 0);
      return checkDate;
    }
  }
  
  // Fallback: return 3 days from fromDate
  const fallbackDate = new Date(fromDate);
  fallbackDate.setDate(fallbackDate.getDate() + 3);
  fallbackDate.setUTCHours(0, 0, 0, 0);
  return fallbackDate;
}

/**
 * Calculate mastery level based on solve count, failed count, and streak
 * @param {number} solveCount - Number of times solved
 * @param {number} failedCount - Number of times unmarked
 * @param {number} streakCount - Consecutive correct completions
 * @returns {string} Mastery level: 'new', 'learning', 'reviewing', 'mastered'
 */
export function calculateMasteryLevel(solveCount, failedCount, streakCount) {
  if (solveCount === 0) return 'new';
  if (failedCount > solveCount * 0.3) return 'learning'; // >30% failure rate
  if (solveCount < 3) return 'learning';
  if (solveCount >= 6 && streakCount >= 3) return 'mastered';
  return 'reviewing';
}

/**
 * Calculate priority score for daily repetition selection
 * Higher score = higher priority
 * @param {Object} problem - Problem document
 * @param {Date} today - Today's date (UTC start of day)
 * @returns {number} Priority score
 */
export function calculatePriorityScore(problem, today) {
  let score = 0;
  
  // 1. Urgency Score (0-50 points)
  // Problems overdue get higher priority
  if (problem.scheduledRepetitionDate) {
    const scheduledDate = new Date(problem.scheduledRepetitionDate);
    scheduledDate.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    if (scheduledDate < todayStart) {
      const daysOverdue = Math.floor((todayStart - scheduledDate) / (1000 * 60 * 60 * 24));
      score += Math.min(daysOverdue * 10, 50); // Cap at 50 points
    }
  }
  
  // 2. Mastery Score (0-20 points)
  // Learning problems need more practice
  const masteryWeights = {
    'new': 20,
    'learning': 20,
    'reviewing': 10,
    'mastered': 5
  };
  score += masteryWeights[problem.masteryLevel] || 10;
  
  // 3. Solve Count Score (0-15 points)
  // Fewer solves = higher priority (need more practice)
  if (problem.solveCount === 0) score += 15;
  else if (problem.solveCount === 1) score += 12;
  else if (problem.solveCount === 2) score += 10;
  else if (problem.solveCount === 3) score += 8;
  else if (problem.solveCount < 6) score += 5;
  else score += 2; // Mastered problems (6+ solves)
  
  // 4. Days Since Last Review (0-15 points)
  // Longer since last review = higher priority
  if (problem.lastCompletedDate) {
    const lastReview = new Date(problem.lastCompletedDate);
    lastReview.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    const daysSince = Math.floor((todayStart - lastReview) / (1000 * 60 * 60 * 24));
    score += Math.min(daysSince * 1.5, 15); // Cap at 15 points
  } else {
    score += 15; // Never reviewed = max priority
  }
  
  return score;
}

/**
 * Get next N topic days for a given topic
 * @param {string} topic - Topic to find days for
 * @param {number} weeksAhead - Number of weeks to look ahead
 * @returns {Promise<Date[]>} Array of dates when topic is repetition topic
 */
export async function getNextTopicDays(topic, weeksAhead = 4) {
  const PracticePlan = (await import('../models/PracticePlan.js')).default;
  const topicDays = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  // Get all practice plans
  const plans = await PracticePlan.find().sort({ dayOfWeek: 1 });
  
  if (plans.length === 0) {
    // No practice plan, return empty array
    return [];
  }
  
  // Find next N occurrences of this topic (across multiple weeks)
  let daysChecked = 0;
  let found = 0;
  const maxDays = weeksAhead * 7;
  
  while (found < weeksAhead && daysChecked < maxDays) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + daysChecked);
    checkDate.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = checkDate.getDay();
    
    const plan = plans.find(p => p.dayOfWeek === dayOfWeek);
    if (plan && plan.repetitionTopic === topic) {
      topicDays.push(new Date(checkDate));
      found++;
    }
    
    daysChecked++;
  }
  
  return topicDays;
}

/**
 * Distribute unselected problems evenly across future topic days
 * @param {Array} unselectedProblems - Array of problems with priority scores
 * @param {string} topic - Topic of the problems
 * @returns {Promise<void>}
 */
export async function distributeUnselectedProblems(unselectedProblems, topic) {
  if (unselectedProblems.length === 0) return;
  
  const Problem = (await import('../models/Problem.js')).default;
  const nextTopicDays = await getNextTopicDays(topic, 4); // 4 weeks ahead
  
  if (nextTopicDays.length === 0) {
    // No topic days found, distribute evenly over next 28 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < unselectedProblems.length; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 7 + (i % 21)); // Spread over 3 weeks
      targetDate.setUTCHours(0, 0, 0, 0);
      
      await Problem.findByIdAndUpdate(unselectedProblems[i].problem._id, {
        scheduledRepetitionDate: targetDate
      });
    }
    return;
  }
  
  // Distribute problems evenly across these days
  const problemsPerDay = Math.ceil(unselectedProblems.length / nextTopicDays.length);
  
  for (let i = 0; i < unselectedProblems.length; i++) {
    const dayIndex = Math.floor(i / problemsPerDay);
    const targetDate = nextTopicDays[Math.min(dayIndex, nextTopicDays.length - 1)];
    
    // Update scheduledRepetitionDate
    await Problem.findByIdAndUpdate(unselectedProblems[i].problem._id, {
      scheduledRepetitionDate: targetDate
    });
  }
}

/**
 * Select daily repetitions based on priority and limit
 * @param {string} topic - Today's repetition topic
 * @param {Date} today - Today's date (UTC start of day)
 * @param {number} maxDaily - Maximum number of repetitions per day (default: 5)
 * @returns {Promise<Object>} { selected: Problem[], unselected: Array }
 */
export async function selectDailyRepetitions(topic, today, maxDaily = 5) {
  const Problem = (await import('../models/Problem.js')).default;
  
  const todayStart = new Date(today);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCHours(23, 59, 59, 999);
  
  // Get existing repetition entries for today to exclude them
  const todayRepetitionIds = await Problem.find({
    type: 'repetition',
    $or: [
      { repetitionDate: { $gte: todayStart, $lt: todayEnd } },
      { scheduledRepetitionDate: { $gte: todayStart, $lt: todayEnd } }
    ]
  }).select('originalProblemId').lean();
  
  const excludedAnchorIds = todayRepetitionIds
    .map(r => r.originalProblemId)
    .filter(id => id !== null && id !== undefined);
  
  // Build query - handle empty excludedAnchorIds array
  const query = {
    type: 'anchor',
    topic: topic,
    $or: [
      { scheduledRepetitionDate: { $lte: todayEnd } },
      { scheduledRepetitionDate: null } // Include problems without scheduled date (legacy)
    ]
  };
  
  // Only add $nin if there are excluded IDs
  if (excludedAnchorIds.length > 0) {
    query._id = { $nin: excludedAnchorIds };
  }
  
  // Find all eligible anchor problems for today
  const eligibleProblems = await Problem.find(query).lean();
  
  // Calculate priority scores
  const scoredProblems = eligibleProblems.map(p => ({
    problem: p,
    priorityScore: calculatePriorityScore(p, today)
  }));
  
  // Sort by priority (highest first)
  scoredProblems.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Select top N problems
  const selected = scoredProblems.slice(0, maxDaily);
  const unselected = scoredProblems.slice(maxDaily);
  
  return {
    selected: selected.map(s => s.problem),
    unselected: unselected
  };
}

