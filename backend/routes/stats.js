import express from 'express';
import Problem from '../models/Problem.js';
import { getDateNDaysFromToday, formatDate } from '../utils/dayUtils.js';

const router = express.Router();

// Simple in-memory cache for statistics
let statsCache = null;
let statsCacheTime = null;
const STATS_CACHE_TTL = 30000; // 30 seconds cache

// Get statistics
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (statsCache && statsCacheTime && (now - statsCacheTime) < STATS_CACHE_TTL) {
      return res.json(statsCache);
    }

    // Use UTC as the single source of truth (matches database timestamps)
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);

    // Get data for last 365 days for streak calculation
    const startDateUTC = new Date(todayStartUTC);
    startDateUTC.setUTCDate(todayStartUTC.getUTCDate() - 365);
    startDateUTC.setUTCHours(0, 0, 0, 0);

    // Run all queries in parallel for better performance
    const [
      totalProblems,
      completedProblems,
      byDifficulty,
      byTopic,
      dailyCompletions,
      anchorCompletionsByDate,
      repetitionCompletionsByDate,
      thisWeekAnchorCount,
      thisWeekRepetitionCount,
      todayAnchorCount,
      todayRepetitionCount
    ] = await Promise.all([
    // Total problems
      Problem.countDocuments(),
      
      // Completed problems
      Problem.countDocuments({ isCompleted: true }),

    // Problems by difficulty
      Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          }
        }
      }
      ]),

    // Problems by topic
      Problem.aggregate([
      {
        $group: {
          _id: '$topic',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
      ]),

      // Daily completion for last 30 days (anchor only)
      (async () => {
    const thirtyDaysAgo = getDateNDaysFromToday(-30);
        return Problem.aggregate([
      {
        $match: {
              type: 'anchor',
          completedDate: { $gte: thirtyDaysAgo },
          isCompleted: true
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
      })(),
      
      // Anchor completions by date (for streak calculation)
      Problem.aggregate([
        {
          $match: {
            type: 'anchor',
            completedDate: { $gte: startDateUTC },
        isCompleted: true
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedDate', timezone: 'UTC' } },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Repetition completions by date (for streak calculation)
      Problem.aggregate([
        {
          $match: {
            type: 'repetition',
            repetitionCompletedDate: { $gte: startDateUTC },
          isCompleted: true
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$repetitionCompletedDate', timezone: 'UTC' } },
            count: { $sum: 1 }
      }
    }
      ]),

      // This week's anchor completions
      (async () => {
    const weekStartUTC = new Date(todayStartUTC);
        const dayOfWeekUTC = todayStartUTC.getUTCDay();
        const daysSinceMonday = (dayOfWeekUTC + 6) % 7;
        weekStartUTC.setUTCDate(todayStartUTC.getUTCDate() - daysSinceMonday);
    weekStartUTC.setUTCHours(0, 0, 0, 0);
        return Problem.countDocuments({
          type: 'anchor',
      completedDate: { $gte: weekStartUTC },
      isCompleted: true
    });
      })(),
      
      // This week's repetition completions
      (async () => {
        const weekStartUTC = new Date(todayStartUTC);
        const dayOfWeekUTC = todayStartUTC.getUTCDay();
        const daysSinceMonday = (dayOfWeekUTC + 6) % 7;
        weekStartUTC.setUTCDate(todayStartUTC.getUTCDate() - daysSinceMonday);
        weekStartUTC.setUTCHours(0, 0, 0, 0);
        return Problem.countDocuments({
          type: 'repetition',
          repetitionCompletedDate: { $gte: weekStartUTC },
          isCompleted: true
        });
      })(),
      
      // Today's anchor completions
      (async () => {
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);
        return Problem.countDocuments({
          type: 'anchor',
      completedDate: {
        $gte: todayStartUTC,
            $lte: todayEndUTC
          },
          isCompleted: true
        });
      })(),
      
      // Today's repetition completions
      (async () => {
        const todayEndUTC = new Date(todayStartUTC);
        todayEndUTC.setUTCHours(23, 59, 59, 999);
        return Problem.countDocuments({
          type: 'repetition',
          repetitionCompletedDate: {
            $gte: todayStartUTC,
            $lte: todayEndUTC
      },
      isCompleted: true
    });
      })()
    ]);

    const pendingProblems = totalProblems - completedProblems;
    const thisWeekProblems = thisWeekAnchorCount + thisWeekRepetitionCount;
    const todaySolvedCount = todayAnchorCount + todayRepetitionCount;

    // Calculate streak using the aggregated data (much faster!)
    // Merge anchor and repetition completions by date
    const completionsByDate = new Set();
    anchorCompletionsByDate.forEach(item => completionsByDate.add(item._id));
    repetitionCompletionsByDate.forEach(item => completionsByDate.add(item._id));
    
    // Calculate streak: consecutive days from today backwards
    let streak = 0;
    let currentDate = new Date(todayStartUTC);
    
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dateStr = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`;
      
      if (completionsByDate.has(dateStr)) {
        streak++;
        currentDate.setUTCDate(currentDate.getUTCDate() - 1);
      } else {
        // No completion on this day, streak is broken
        break;
      }
    }

    const result = {
      overview: {
        total: totalProblems,
        completed: completedProblems,
        pending: pendingProblems,
        completionRate: totalProblems > 0 ? ((completedProblems / totalProblems) * 100).toFixed(1) : 0
      },
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item._id] = {
          total: item.total,
          completed: item.completed,
          pending: item.total - item.completed
        };
        return acc;
      }, {}),
      byTopic: byTopic.map(item => ({
        topic: item._id,
        total: item.total,
        completed: item.completed,
        pending: item.total - item.completed
      })),
      dailyCompletions: dailyCompletions.map(item => ({
        date: item._id,
        count: item.count
      })),
      streak,
      thisWeekProblems,
      todaySolvedCount
    };

    // Cache the result
    statsCache = result;
    statsCacheTime = now;

    res.json(result);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// Clear statistics cache (call this when problems are updated)
const clearStatsCache = () => {
  statsCache = null;
  statsCacheTime = null;
};

// Export for use in other routes
export { clearStatsCache };

// Simple in-memory cache for calendar data
let calendarCache = null;
let calendarCacheTime = null;
const CALENDAR_CACHE_TTL = 30000; // 30 seconds cache

// Get calendar data (problem counts by date)
router.get('/calendar', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (calendarCache && calendarCacheTime && (now - calendarCacheTime) < CALENDAR_CACHE_TTL) {
      return res.json(calendarCache);
    }

    // Use UTC for calendar grouping to match database timestamps exactly
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);

    // Get data for the last 365 days (UTC)
    const startDateUTC = new Date(todayStartUTC);
    startDateUTC.setUTCDate(todayStartUTC.getUTCDate() - 365);
    startDateUTC.setUTCHours(0, 0, 0, 0);

    // Use simpler, faster queries with proper indexes - run in parallel
    const [anchorProblems, repetitionProblems, addedProblems] = await Promise.all([
      // Get all completed anchor problems in date range
      Problem.find({
        type: 'anchor',
          completedDate: { $gte: startDateUTC },
          isCompleted: true
      }).select('completedDate').lean(),
      
      // Get all completed repetition problems in date range
      Problem.find({
        type: 'repetition',
        repetitionCompletedDate: { $gte: startDateUTC },
        isCompleted: true
      }).select('repetitionCompletedDate').lean(),
      
      // Get all problems added in date range
      Problem.find({
          $or: [
            { createdAt: { $gte: startDateUTC } },
            { addedDate: { $gte: startDateUTC } }
          ]
      }).select('createdAt addedDate').lean()
    ]);

    // Group by date in memory (much faster for small datasets)
    const anchorCompletions = {};
    anchorProblems.forEach(p => {
      if (p.completedDate) {
        const dateStr = p.completedDate.toISOString().split('T')[0];
        if (!anchorCompletions[dateStr]) {
          anchorCompletions[dateStr] = { _id: dateStr, count: 0, completed: 0 };
        }
        anchorCompletions[dateStr].count++;
        anchorCompletions[dateStr].completed++;
      }
    });

    const repetitionCompletions = {};
    repetitionProblems.forEach(p => {
      if (p.repetitionCompletedDate) {
        const dateStr = p.repetitionCompletedDate.toISOString().split('T')[0];
        if (!repetitionCompletions[dateStr]) {
          repetitionCompletions[dateStr] = { _id: dateStr, count: 0, completed: 0 };
        }
        repetitionCompletions[dateStr].count++;
        repetitionCompletions[dateStr].completed++;
            }
    });

    const problemsAdded = {};
    addedProblems.forEach(p => {
      const date = p.createdAt || p.addedDate;
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        if (!problemsAdded[dateStr]) {
          problemsAdded[dateStr] = { _id: dateStr, added: 0 };
        }
        problemsAdded[dateStr].added++;
      }
    });

    // Convert to arrays
    const anchorCompletionsArray = Object.values(anchorCompletions);
    const repetitionCompletionsArray = Object.values(repetitionCompletions);
    const problemsAddedArray = Object.values(problemsAdded);

    // Build a map for quick lookup - merge all data
    const dataMap = {};
    
    // Add anchor completions
    anchorCompletionsArray.forEach(item => {
      dataMap[item._id] = {
        date: item._id,
        count: item.count || 0,
        completed: item.completed || 0,
        added: 0
      };
    });
    
    // Merge repetition completions
    repetitionCompletionsArray.forEach(item => {
      if (dataMap[item._id]) {
        dataMap[item._id].count += item.count || 0;
        dataMap[item._id].completed += item.completed || 0;
      } else {
        dataMap[item._id] = {
          date: item._id,
          count: item.count || 0,
          completed: item.completed || 0,
          added: 0
        };
      }
    });
    
    // Merge problems added
    problemsAddedArray.forEach(item => {
      if (dataMap[item._id]) {
        dataMap[item._id].added = item.added || 0;
      } else {
        dataMap[item._id] = {
          date: item._id,
          count: 0,
          completed: 0,
          added: item.added || 0
        };
      }
    });

    // Convert to array and fill in missing dates with 0
    const result = [];
    let cursor = new Date(startDateUTC);
    while (cursor <= todayStartUTC) {
      const y = cursor.getUTCFullYear();
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cursor.getUTCDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      if (dataMap[dateStr]) {
        result.push(dataMap[dateStr]);
      } else {
        result.push({
          date: dateStr,
          count: 0,
          completed: 0,
          added: 0
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Cache the result
    calendarCache = result;
    calendarCacheTime = now;

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data', details: error.message });
  }
});

// Clear calendar cache (call this when problems are updated)
const clearCalendarCache = () => {
  calendarCache = null;
  calendarCacheTime = null;
};

// Export for use in other routes
export { clearCalendarCache };
export default router;

