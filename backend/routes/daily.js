import express from 'express';
import Problem from '../models/Problem.js';
import PracticePlan from '../models/PracticePlan.js';
import { getTodayTopics, getDateNDaysFromToday, formatDate, getTodayDayOfWeek } from '../utils/dayUtils.js';
import { 
  selectDailyRepetitions, 
  distributeUnselectedProblems,
  getNextTopicDays
} from '../utils/spacedRepetition.js';

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
    const tomorrow = new Date(todayEndUTC);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const todayStr = formatDate(new Date(todayStartUTC));

    // Smart Repetition System: Topic-aware repetition creation
    const repetitionTopic = todayTopics.repetition;
    const DAILY_REPETITION_LIMIT = 5; // Maximum repetitions per day

    // Select problems for repetition using priority-based algorithm
    const { selected, unselected } = await selectDailyRepetitions(
      repetitionTopic,
      todayStartUTC,
      DAILY_REPETITION_LIMIT
    );
    
    // Create repetition entries for selected problems
    for (const anchorProblem of selected) {
      // Check if a repetition entry already exists for today
      const existingRepetition = await Problem.findOne({
        type: 'repetition',
        originalProblemId: anchorProblem._id,
        $or: [
          { repetitionDate: { $gte: todayStartUTC, $lt: tomorrow } },
          { scheduledRepetitionDate: { $gte: todayStartUTC, $lt: tomorrow } }
        ]
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
          repetitionDate: anchorProblem.scheduledRepetitionDate || anchorProblem.repetitionDate || todayStartUTC,
          scheduledRepetitionDate: anchorProblem.scheduledRepetitionDate || todayStartUTC,
          type: 'repetition',
          originalProblemId: anchorProblem._id,
          isCompleted: false,
          solveCount: anchorProblem.solveCount || 0,
          masteryLevel: anchorProblem.masteryLevel || 'new'
        });
      }
    }

    // Distribute unselected problems to future topic days
    if (unselected.length > 0) {
      await distributeUnselectedProblems(unselected, repetitionTopic);
    }
    
    // Find repetition problems: ONLY repetition type entries where date is TODAY
    // First, get all to check if we exceed the limit
    const allTodayRepetitions = await Problem.find({
      type: 'repetition',
      topic: repetitionTopic, // Only show today's topic
      $or: [
        { repetitionDate: { $gte: todayStartUTC, $lt: tomorrow } },
        { scheduledRepetitionDate: { $gte: todayStartUTC, $lt: tomorrow } }
      ],
      isCompleted: false // Only show if not yet completed
    })
    .sort({ scheduledRepetitionDate: 1, repetitionDate: 1, createdAt: 1 });

    // If we have more than the limit, redistribute excess to future dates
    if (allTodayRepetitions.length > DAILY_REPETITION_LIMIT) {
      const excess = allTodayRepetitions.slice(DAILY_REPETITION_LIMIT);
      const nextTopicDays = await getNextTopicDays(repetitionTopic, 4);
      
      if (nextTopicDays.length > 0) {
        const problemsPerDay = Math.ceil(excess.length / nextTopicDays.length);
        for (let i = 0; i < excess.length; i++) {
          const dayIndex = Math.floor(i / problemsPerDay);
          const targetDate = nextTopicDays[Math.min(dayIndex, nextTopicDays.length - 1)];
          
          await Problem.findByIdAndUpdate(excess[i]._id, {
            scheduledRepetitionDate: targetDate,
            repetitionDate: targetDate // Update both for consistency
          });
        }
      }
    }

    // Return only the limited set
    const repetitionProblems = allTodayRepetitions.slice(0, DAILY_REPETITION_LIMIT);

    // Get backlog: ALL repetition type entries where scheduledRepetitionDate is in the past
    // BACKLOG = Problems that were due for repetition but weren't completed on that day
    // Show all overdue problems regardless of topic (not just today's topic)
    const backlogProblems = await Problem.find({
      type: 'repetition',
      $or: [
        { scheduledRepetitionDate: { $lt: todayStartUTC } },
        { repetitionDate: { $lt: todayStartUTC } } // Fallback for legacy data
      ],
      isCompleted: false // Not yet completed (missed their repetition day)
    })
    .sort({ scheduledRepetitionDate: 1, repetitionDate: 1 }) // Sort by when they were due (oldest first)
    .limit(DAILY_REPETITION_LIMIT * 2); // Allow more backlog items than daily limit

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

