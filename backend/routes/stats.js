import express from 'express';
import Problem from '../models/Problem.js';
import { getDateNDaysFromToday, formatDate } from '../utils/dayUtils.js';

const router = express.Router();

// Get statistics
router.get('/', async (req, res) => {
  try {
    // Use UTC as the single source of truth (matches database timestamps)
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);

    // Total problems
    const totalProblems = await Problem.countDocuments();
    const completedProblems = await Problem.countDocuments({ isCompleted: true });
    const pendingProblems = totalProblems - completedProblems;

    // Problems by difficulty
    const byDifficulty = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          }
        }
      }
    ]);

    // Problems by topic
    const byTopic = await Problem.aggregate([
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
    ]);

    // Daily completion for last 30 days
    const thirtyDaysAgo = getDateNDaysFromToday(-30);
    const dailyCompletions = await Problem.aggregate([
      {
        $match: {
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

    // Calculate streak (UTC): consecutive days ending at the most recent active day
    let streak = 0;
    // Find most recent day with completions (<= today in UTC)
    let anchorDayUTC = new Date(todayStartUTC);
    let foundAnchor = false;
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(anchorDayUTC);
      const dayEnd = new Date(anchorDayUTC);
      dayEnd.setUTCHours(23, 59, 59, 999);
      const count = await Problem.countDocuments({
        completedDate: { $gte: dayStart, $lte: dayEnd },
        isCompleted: true
      });
      if (count > 0) {
        foundAnchor = true;
        break;
      }
      anchorDayUTC.setUTCDate(anchorDayUTC.getUTCDate() - 1);
    }
    if (foundAnchor) {
      // Count consecutive days backward from anchor
      let cursorUTC = new Date(anchorDayUTC);
      for (let i = 0; i < 365; i++) {
        const dayStart = new Date(cursorUTC);
        const dayEnd = new Date(cursorUTC);
        dayEnd.setUTCHours(23, 59, 59, 999);
        const count = await Problem.countDocuments({
          completedDate: { $gte: dayStart, $lte: dayEnd },
          isCompleted: true
        });
        if (count > 0) {
          streak++;
          cursorUTC.setUTCDate(cursorUTC.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // This week's progress
    // Week boundaries in UTC (Sunday start)
    const weekStartUTC = new Date(todayStartUTC);
    weekStartUTC.setUTCDate(todayStartUTC.getUTCDate() - todayStartUTC.getUTCDay());
    weekStartUTC.setUTCHours(0, 0, 0, 0);

    const thisWeekProblems = await Problem.countDocuments({
      completedDate: { $gte: weekStartUTC },
      isCompleted: true
    });

    // Problems solved today (includes both new problems and repetition problems)
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);
    const todaySolvedCount = await Problem.countDocuments({
      completedDate: {
        $gte: todayStartUTC,
        $lt: todayEndUTC
      },
      isCompleted: true
    });

    res.json({
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
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// Get calendar data (problem counts by date)
router.get('/calendar', async (req, res) => {
  try {
    // Use UTC for calendar grouping to match database timestamps exactly
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);

    // Get data for the last 365 days (UTC)
    const startDateUTC = new Date(todayStartUTC);
    startDateUTC.setUTCDate(todayStartUTC.getUTCDate() - 365);
    startDateUTC.setUTCHours(0, 0, 0, 0);

    const timezoneString = 'UTC';

    // Aggregate problems by completion date (use completedDate for completed problems)
    // Group by UTC date so UI and DB match exactly
    const calendarData = await Problem.aggregate([
      {
        $match: {
          completedDate: { $gte: startDateUTC },
          isCompleted: true
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$completedDate',
              timezone: timezoneString
            } 
          },
          count: { $sum: 1 },
          completed: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Also aggregate problems added per day (use createdAt/addedDate as fallback)
    const addedData = await Problem.aggregate([
      {
        $match: {
          $or: [
            { createdAt: { $gte: startDateUTC } },
            { addedDate: { $gte: startDateUTC } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$createdAt', '$addedDate'] },
              timezone: timezoneString
            }
          },
          added: { $sum: 1 }
        }
      }
    ]);

    // Build a map for quick lookup
    const dataMap = {};
    calendarData.forEach(item => {
      dataMap[item._id] = {
        date: item._id,
        count: item.count || 0,
        completed: item.completed || 0
      };
    });
    addedData.forEach(item => {
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

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data', details: error.message });
  }
});

export default router;

