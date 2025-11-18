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
    // Use UTC day bounds to match database timestamps exactly
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);
    const todayStr = formatDate(new Date(todayStartUTC));

    // Get repetition problems: Create separate repetition entries for problems due today
    // This ensures original anchor problems' completion status remains intact
    const tomorrow = new Date(todayEndUTC);
    
    // Find anchor problems that are due for repetition today
    const anchorProblemsDueForRepetition = await Problem.find({
      type: 'anchor',
      repetitionDate: {
        $gte: todayStartUTC,
        $lt: tomorrow
      }
    });

    // Create repetition entries for problems that don't have one yet
    for (const anchorProblem of anchorProblemsDueForRepetition) {
      // Check if a repetition entry already exists for today
      const existingRepetition = await Problem.findOne({
        type: 'repetition',
        originalProblemId: anchorProblem._id,
        repetitionDate: {
          $gte: todayStartUTC,
          $lt: tomorrow
        }
      });

      // If no repetition entry exists, create one
      if (!existingRepetition) {
        await Problem.create({
          problemNumber: anchorProblem.problemNumber,
          problemSlug: anchorProblem.problemSlug,
          problemTitle: anchorProblem.problemTitle,
          topic: anchorProblem.topic,
          difficulty: anchorProblem.difficulty,
          notes: anchorProblem.notes,
          addedDate: anchorProblem.addedDate, // Keep original added date
          repetitionDate: anchorProblem.repetitionDate,
          type: 'repetition',
          originalProblemId: anchorProblem._id,
          isCompleted: false,
          solveCount: anchorProblem.solveCount || 0
        });
      }
    }
    
    // Find repetition problems: ONLY repetition type entries where repetitionDate is TODAY
    const repetitionProblems = await Problem.find({
      type: 'repetition',
      repetitionDate: {
        $gte: todayStartUTC,
        $lt: tomorrow
      },
      isCompleted: false // Only show if not yet completed
    }).sort({ repetitionDate: 1, createdAt: 1 });

    // Get backlog: ONLY repetition type entries where repetitionDate is in the past
    // and they were NOT completed on their scheduled repetition day
    // BACKLOG = Problems that were due for repetition but weren't completed on that day
    const backlogProblems = await Problem.find({
      type: 'repetition',
      repetitionDate: {
        $lt: todayStartUTC // repetitionDate is in the past
      },
      isCompleted: false // Not yet completed (missed their repetition day)
    }).sort({ repetitionDate: 1 }); // Sort by when they were due (oldest first)

    // Get count of problems added today
    const todayAddedCount = await Problem.countDocuments({
      createdAt: {
        $gte: todayStartUTC,
        $lt: tomorrow
      }
    });

    // Get count of problems solved today (includes both anchor and repetition problems)
    // Count anchor problems completed today + repetition problems completed today
    const todaySolvedAnchorCount = await Problem.countDocuments({
      type: 'anchor',
      completedDate: {
        $gte: todayStartUTC,
        $lt: tomorrow
      },
      isCompleted: true
    });
    
    const todaySolvedRepetitionCount = await Problem.countDocuments({
      type: 'repetition',
      repetitionCompletedDate: {
        $gte: todayStartUTC,
        $lt: tomorrow
      },
      isCompleted: true
    });
    
    const todaySolvedCount = todaySolvedAnchorCount + todaySolvedRepetitionCount;

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
        createdAt: p.createdAt
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
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

export default router;

