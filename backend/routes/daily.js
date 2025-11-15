import express from 'express';
import Problem from '../models/Problem.js';
import PracticePlan from '../models/PracticePlan.js';
import { getTodayTopics, getDateNDaysFromToday, formatDate, getTodayDayOfWeek } from '../utils/dayUtils.js';

const router = express.Router();

// Get today's dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Try to get practice plan from database, fallback to default
    let todayTopics;
    const dayOfWeek = getTodayDayOfWeek();
    const practicePlan = await PracticePlan.findOne({ dayOfWeek });
    
    if (practicePlan) {
      todayTopics = {
        anchor: practicePlan.anchorTopic,
        repetition: practicePlan.repetitionTopic
      };
    } else {
      // Fallback to default
      todayTopics = getTodayTopics();
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    // Get repetition problems: anchor problems where repetitionDate is TODAY
    // These are problems that are scheduled for repetition today
    // BACKLOG LOGIC: If a repetition problem is not completed on its scheduled day,
    // it becomes a backlog (repetitionDate < today and isCompleted: false)
    const tomorrow = getDateNDaysFromToday(1);
    
    // Reset problems that were completed before their repetition date
    // This ensures problems that were completed when originally added show up for repetition
    const problemsToReset = await Problem.countDocuments({
      type: 'anchor',
      isCompleted: true,
      repetitionDate: {
        $gte: today,
        $lt: tomorrow
      },
      // Only reset if completedDate exists and was completed before the repetition date
      $and: [
        { completedDate: { $exists: true, $ne: null } },
        {
          $expr: {
            $lt: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$completedDate',
                  timezone: 'UTC'
                }
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$repetitionDate',
                  timezone: 'UTC'
                }
              }
            ]
          }
        }
      ]
    });

    // Only run update if there are problems that need resetting
    if (problemsToReset > 0) {
      try {
        await Problem.updateMany(
          {
            type: 'anchor',
            isCompleted: true,
            repetitionDate: {
              $gte: today,
              $lt: tomorrow
            },
            // Only reset if completedDate exists and was completed before the repetition date
            $and: [
              { completedDate: { $exists: true, $ne: null } },
              {
                $expr: {
                  $lt: [
                    {
                      $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$completedDate',
                        timezone: 'UTC'
                      }
                    },
                    {
                      $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$repetitionDate',
                        timezone: 'UTC'
                      }
                    }
                  ]
                }
              }
            ]
          },
          {
            $set: { isCompleted: false } // Reset to false so it shows for repetition
          }
        );
      } catch (updateError) {
        // Log error but don't fail the entire request
        console.error('Error resetting problems for repetition:', updateError);
        // Continue - problems will still be fetched, just might not be reset
      }
    }
    
    // Find repetition problems: ONLY problems where repetitionDate is TODAY
    // This is the source of truth - if repetitionDate is today, it's due for repetition
    const repetitionProblems = await Problem.find({
      type: 'anchor',
      repetitionDate: {
        $gte: today,
        $lt: tomorrow
      },
      isCompleted: false // Only show if not yet completed in repetition
    }).sort({ repetitionDate: 1, addedDate: 1 });

    // Get backlog: ONLY repetition problems (anchor problems) where repetitionDate is in the past
    // and they were NOT completed on their scheduled repetition day
    // BACKLOG = Problems that were due for repetition but weren't completed on that day
    const backlogProblems = await Problem.find({
      type: 'anchor',
      repetitionDate: {
        $lt: today // repetitionDate is in the past
      },
      isCompleted: false // Not yet completed (missed their repetition day)
    }).sort({ repetitionDate: 1 }); // Sort by when they were due (oldest first)

    // Get count of problems added today
    const todayAddedCount = await Problem.countDocuments({
      addedDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get count of problems solved today (includes both new problems and repetition problems)
    const todaySolvedCount = await Problem.countDocuments({
      completedDate: {
        $gte: today,
        $lt: tomorrow
      },
      isCompleted: true
    });

    res.json({
      date: todayStr,
      anchorTopic: todayTopics.anchor,
      repetitionTopic: todayTopics.repetition,
      todayAddedCount: todayAddedCount,
      todaySolvedCount: todaySolvedCount,
      repetitionProblems: repetitionProblems.map(p => ({
        id: p._id,
        problemNumber: p.problemNumber,
        problemSlug: p.problemSlug,
        problemTitle: p.problemTitle,
        topic: p.topic,
        difficulty: p.difficulty,
        notes: p.notes,
        isCompleted: p.isCompleted,
        solveCount: p.solveCount || 1,
        addedDate: p.addedDate
      })),
      backlog: backlogProblems.map(p => ({
        id: p._id,
        problemNumber: p.problemNumber,
        problemSlug: p.problemSlug,
        problemTitle: p.problemTitle,
        topic: p.topic,
        difficulty: p.difficulty,
        notes: p.notes,
        isCompleted: p.isCompleted,
        solveCount: p.solveCount || 1,
        repetitionDate: p.repetitionDate,
        addedDate: p.addedDate
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

export default router;

