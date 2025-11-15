import express from 'express';
import Problem from '../models/Problem.js';
import { getDateNDaysFromToday, formatDate } from '../utils/dayUtils.js';

const router = express.Router();

// Get statistics
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    // Use UTC for consistency with MongoDB date storage
    today.setUTCHours(0, 0, 0, 0);

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

    // Calculate streak
    // Use UTC dates to match MongoDB storage
    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setUTCHours(0, 0, 0, 0);
    let foundGap = false;

    while (!foundGap && streak < 365) {
      const dayStart = new Date(currentDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const problemsCompleted = await Problem.countDocuments({
        completedDate: {
          $gte: dayStart,
          $lte: dayEnd
        },
        isCompleted: true
      });

      if (problemsCompleted > 0) {
        streak++;
        currentDate.setUTCDate(currentDate.getUTCDate() - 1);
      } else {
        foundGap = true;
      }
    }

    // This week's progress
    const weekStart = new Date(today);
    weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay()); // Start of week (Sunday)
    weekStart.setUTCHours(0, 0, 0, 0);

    const thisWeekProblems = await Problem.countDocuments({
      completedDate: { $gte: weekStart },
      isCompleted: true
    });

    // Problems solved today (includes both new problems and repetition problems)
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    const todaySolvedCount = await Problem.countDocuments({
      completedDate: {
        $gte: today,
        $lt: tomorrow
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get data for the last 365 days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 365);
    startDate.setHours(0, 0, 0, 0);

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Get server timezone offset (in minutes)
    // getTimezoneOffset() returns offset in minutes, positive means behind UTC
    // MongoDB timezone format: "+05:30" means UTC+5:30
    const timezoneOffset = new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    // Invert the sign because getTimezoneOffset is inverted
    const timezoneString = timezoneOffset > 0 
      ? `-${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
      : `+${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    // Aggregate problems by completion date (use completedDate for completed problems)
    // Convert UTC dates to local timezone for proper date grouping
    const calendarData = await Problem.aggregate([
      {
        $match: {
          completedDate: { $gte: startDate },
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

    // Also get problems added (use addedDate for all problems, including completed ones)
    // This gives a more comprehensive view - show activity on days when problems were added
    const addedData = await Problem.aggregate([
      {
        $match: {
          addedDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$addedDate',
              timezone: timezoneString
            } 
          },
          added: { $sum: 1 }
        }
      }
    ]);

    // Merge the data - prioritize completed count, but also show added count
    const dataMap = {};
    
    // First, add completed problems
    calendarData.forEach(item => {
      dataMap[item._id] = {
        date: item._id,
        count: item.count,
        completed: item.completed
      };
    });

    // Then, add/merge added problems count
    addedData.forEach(item => {
      if (dataMap[item._id]) {
        // If we already have completed data, use the higher count
        dataMap[item._id].added = item.added;
        // Use completed count if available, otherwise use added count
        dataMap[item._id].count = Math.max(dataMap[item._id].count || 0, item.added);
      } else {
        // No completed data, but problems were added
        dataMap[item._id] = {
          date: item._id,
          count: item.added, // Show added count even if not completed
          completed: 0,
          added: item.added
        };
      }
    });

    // Convert to array and fill in missing dates with 0
    const result = [];
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = formatLocalDate(currentDate);
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
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data', details: error.message });
  }
});

export default router;

