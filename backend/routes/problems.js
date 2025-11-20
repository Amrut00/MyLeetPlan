import express from 'express';
import Problem from '../models/Problem.js';
import { getRepetitionDateFromPlan } from '../utils/dayUtils.js';
import { clearCalendarCache, clearStatsCache } from './stats.js';
import { 
  calculateInterval, 
  findNextTopicDay, 
  calculateMasteryLevel 
} from '../utils/spacedRepetition.js';

const router = express.Router();

// Add new problems (Anchor topic)
router.post('/', async (req, res) => {
  try {
    const { problemNumbers, topic } = req.body;

    if (!problemNumbers || !Array.isArray(problemNumbers) || problemNumbers.length === 0) {
      return res.status(400).json({ error: 'Problem numbers array is required' });
    }

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Get repetition date based on practice plan
    const repetitionDate = await getRepetitionDateFromPlan(topic);
    // UTC day bounds
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);

    const results = [];
    const duplicates = [];

    for (let i = 0; i < problemNumbers.length; i++) {
      const problemNumber = problemNumbers[i].toString().trim();
      const problemSlug = Array.isArray(req.body.problemSlug) 
        ? (req.body.problemSlug[i] || '').trim()
        : (req.body.problemSlug || '').trim();
      const problemTitle = Array.isArray(req.body.problemTitle) 
        ? (req.body.problemTitle[i] || '').trim()
        : (req.body.problemTitle || '').trim();

      // Check if this problem already exists (same problem number)
      const existingProblem = await Problem.findOne({
        problemNumber: problemNumber
      }).sort({ createdAt: -1 }); // Get the most recent one

      // If already added today (UTC), do not create a new one
      const existingToday = await Problem.findOne({
        problemNumber: problemNumber,
        createdAt: { $gte: todayStartUTC, $lte: todayEndUTC }
      });
      if (existingToday) {
        duplicates.push({
          problemNumber,
          isDuplicate: true,
          reason: 'already_added_today'
        });
        results.push(existingToday);
        continue;
      }

      if (existingProblem) {
        // Problem already exists - get the highest solve count
        const maxSolveCount = await Problem.findOne({
          problemNumber: problemNumber
        }).sort({ solveCount: -1 });
        
        // Do NOT increment solve count on add/duplicate creation.
        // Solve count should only increment when marking a problem as completed.
        const newSolveCount = (maxSolveCount?.solveCount || 0);
        
        // Update slug if new one is provided and different
        let finalSlug = problemSlug || existingProblem.problemSlug;
        if (problemSlug && problemSlug !== existingProblem.problemSlug) {
          finalSlug = problemSlug;
        }

        // Create a new entry for today (for repetition tracking)
        const newProblem = new Problem({
          problemNumber: problemNumber,
          problemSlug: finalSlug,
          problemTitle: problemTitle || existingProblem.problemTitle || '',
          topic: topic,
          difficulty: req.body.difficulty || existingProblem.difficulty || 'Medium',
          notes: req.body.notes || '',
          addedDate: todayStartUTC,
          repetitionDate: repetitionDate,
          type: 'anchor',
          solveCount: newSolveCount,
          isCompleted: false // Not completed by default - user needs to mark it complete
        });

        const saved = await newProblem.save();
        results.push(saved);
        duplicates.push({
          problemNumber,
          solveCount: newSolveCount,
          isDuplicate: true
        });
      } else {
        // New problem - create it
        const newProblem = new Problem({
          problemNumber: problemNumber,
          problemSlug: problemSlug,
          problemTitle: problemTitle || '',
          topic: topic,
          difficulty: req.body.difficulty || 'Medium',
          notes: req.body.notes || '',
          addedDate: todayStartUTC,
          repetitionDate: repetitionDate,
          type: 'anchor',
          solveCount: 0,
          isCompleted: false // Not completed by default - user needs to mark it complete
        });

        const saved = await newProblem.save();
        results.push(saved);
      }
    }

    const hasTodayDupes = duplicates.some(d => d.reason === 'already_added_today');
    
    // Clear caches since new problems were added
    clearCalendarCache();
    clearStatsCache();
    
    res.status(hasTodayDupes ? 200 : 201).json({
      message: hasTodayDupes
        ? `${results.length} problem(s) added or already present for today.`
        : `${results.length} problem(s) added successfully.`,
      problems: results,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      alreadyAddedToday: hasTodayDupes
    });
  } catch (error) {
    console.error('Error adding problems:', error);
    res.status(500).json({ error: 'Failed to add problems', details: error.message });
  }
});

// Mark problem as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the current problem to check if it's already completed
    const currentProblem = await Problem.findById(id);
    
    if (!currentProblem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const now = new Date();
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);

    // Prevent marking as complete if it was already completed on a past day
    if (currentProblem.isCompleted) {
      let completionDate;
      if (currentProblem.type === 'repetition') {
        completionDate = currentProblem.repetitionCompletedDate;
      } else {
        completionDate = currentProblem.completedDate;
      }

      if (completionDate) {
        const completionDayStart = new Date(completionDate);
        completionDayStart.setUTCHours(0, 0, 0, 0);
        
        // If completion date is before today, prevent changes
        if (completionDayStart < todayStartUTC) {
          return res.status(400).json({ 
            error: 'Cannot change completion status for problems completed on past days. Completion status is locked after the day has passed.' 
          });
        }
      }
    }

    const updateData = { isCompleted: true };

    // Handle repetition problems differently from anchor problems
    if (currentProblem.type === 'repetition') {
      // For repetition problems, use repetitionCompletedDate instead of completedDate
      updateData.repetitionCompletedDate = now;
      
      // Only increment solve count if it wasn't already completed
      if (!currentProblem.isCompleted) {
        // Check if already solved today (anchor or repetition) to prevent double-counting
        const alreadySolvedToday = await Problem.exists({
          problemNumber: currentProblem.problemNumber,
          $or: [
            { type: 'anchor', completedDate: { $gte: todayStartUTC, $lte: todayEndUTC }, isCompleted: true },
            { type: 'repetition', repetitionCompletedDate: { $gte: todayStartUTC, $lte: todayEndUTC }, isCompleted: true }
          ]
        });

        // Find the maximum solve count for this problem number across all entries
        const maxSolveCountDoc = await Problem.findOne({
          problemNumber: currentProblem.problemNumber
        }).sort({ solveCount: -1 });
        const currentMax = maxSolveCountDoc?.solveCount || currentProblem.solveCount || 0;

        // Only increment if no completion recorded for this problem number today
        const newSolveCount = alreadySolvedToday ? currentMax : currentMax + 1;
        updateData.solveCount = newSolveCount;

        // Sync solve count across all entries for this problem number (both anchor and repetition)
        await Problem.updateMany(
          { problemNumber: currentProblem.problemNumber },
          { $set: { solveCount: newSolveCount } }
        );

        // Calculate next repetition dates for the anchor problem
        if (currentProblem.originalProblemId) {
          const anchorProblem = await Problem.findById(currentProblem.originalProblemId);
          if (anchorProblem) {
            const interval = calculateInterval(newSolveCount, anchorProblem.difficulty);
            const nextRepetitionDate = new Date(now);
            nextRepetitionDate.setDate(nextRepetitionDate.getDate() + interval);
            nextRepetitionDate.setUTCHours(0, 0, 0, 0);
            
            const scheduledRepetitionDate = await findNextTopicDay(
              anchorProblem.topic, 
              nextRepetitionDate
            );
            
            // Calculate mastery level
            const masteryLevel = calculateMasteryLevel(
              newSolveCount,
              anchorProblem.failedCount || 0,
              (anchorProblem.streakCount || 0) + 1 // Increment streak
            );
            
            // Find the most recent completion date (anchor or any repetition)
            let mostRecentCompletion = now;
            if (anchorProblem.completedDate) {
              const anchorCompletion = new Date(anchorProblem.completedDate);
              if (anchorCompletion > mostRecentCompletion) {
                mostRecentCompletion = anchorCompletion;
              }
            }
            
            // Check all repetition completions for this anchor
            const allRepetitionCompletions = await Problem.find({
              type: 'repetition',
              originalProblemId: anchorProblem._id,
      isCompleted: true,
              repetitionCompletedDate: { $exists: true, $ne: null }
            }).select('repetitionCompletedDate').sort({ repetitionCompletedDate: -1 }).limit(1).lean();
            
            if (allRepetitionCompletions.length > 0) {
              const latestRepCompletion = new Date(allRepetitionCompletions[0].repetitionCompletedDate);
              if (latestRepCompletion > mostRecentCompletion) {
                mostRecentCompletion = latestRepCompletion;
              }
            }
            
            // Update anchor problem with new repetition dates
            await Problem.findByIdAndUpdate(
              currentProblem.originalProblemId,
              {
                lastCompletedDate: mostRecentCompletion,
                nextRepetitionDate: nextRepetitionDate,
                scheduledRepetitionDate: scheduledRepetitionDate,
                repetitionInterval: interval,
                masteryLevel: masteryLevel,
                streakCount: (anchorProblem.streakCount || 0) + 1
              }
            );
            
            // Clear caches since anchor problem was updated
            clearCalendarCache();
            clearStatsCache();
          }
        }
      }
    } else {
      // For anchor problems, use completedDate as before
      updateData.completedDate = now;

    // Only increment solve count if it wasn't already completed
    if (!currentProblem.isCompleted) {
      // Use UTC day boundaries to detect if we already counted a solve today for this problem number
      const todayStartUTC = new Date();
      todayStartUTC.setUTCHours(0, 0, 0, 0);
      const todayEndUTC = new Date(todayStartUTC);
      todayEndUTC.setUTCHours(23, 59, 59, 999);

        // Check if already solved today (anchor or repetition)
      const alreadySolvedToday = await Problem.exists({
        problemNumber: currentProblem.problemNumber,
          $or: [
            { type: 'anchor', completedDate: { $gte: todayStartUTC, $lte: todayEndUTC }, isCompleted: true },
            { type: 'repetition', repetitionCompletedDate: { $gte: todayStartUTC, $lte: todayEndUTC }, isCompleted: true }
          ]
      });

      // Find the maximum solve count for this problem number across all entries
      const maxSolveCountDoc = await Problem.findOne({
        problemNumber: currentProblem.problemNumber
      }).sort({ solveCount: -1 });
      const currentMax = maxSolveCountDoc?.solveCount || currentProblem.solveCount || 0;

      // Only increment if no completion recorded for this problem number today
      const newSolveCount = alreadySolvedToday ? currentMax : currentMax + 1;
      updateData.solveCount = newSolveCount;

      // Sync solve count across all entries for this problem number
      await Problem.updateMany(
        { problemNumber: currentProblem.problemNumber },
        { $set: { solveCount: newSolveCount } }
      );

      // Calculate next repetition dates for anchor problem
      const interval = calculateInterval(newSolveCount, currentProblem.difficulty);
      const nextRepetitionDate = new Date(now);
      nextRepetitionDate.setDate(nextRepetitionDate.getDate() + interval);
      nextRepetitionDate.setUTCHours(0, 0, 0, 0);
      
      const scheduledRepetitionDate = await findNextTopicDay(
        currentProblem.topic, 
        nextRepetitionDate
      );
      
      // Calculate mastery level
      const masteryLevel = calculateMasteryLevel(
        newSolveCount,
        currentProblem.failedCount || 0,
        (currentProblem.streakCount || 0) + 1 // Increment streak
      );
      
      // Find the most recent completion date (this anchor or any repetition)
      let mostRecentCompletion = now;
      
      // Check all repetition completions for this anchor
      const allRepetitionCompletions = await Problem.find({
        type: 'repetition',
        originalProblemId: currentProblem._id,
        isCompleted: true,
        repetitionCompletedDate: { $exists: true, $ne: null }
      }).select('repetitionCompletedDate').sort({ repetitionCompletedDate: -1 }).limit(1).lean();
      
      if (allRepetitionCompletions.length > 0) {
        const latestRepCompletion = new Date(allRepetitionCompletions[0].repetitionCompletedDate);
        if (latestRepCompletion > mostRecentCompletion) {
          mostRecentCompletion = latestRepCompletion;
        }
      }
      
      // Update anchor problem with new repetition dates
      updateData.lastCompletedDate = mostRecentCompletion;
      updateData.nextRepetitionDate = nextRepetitionDate;
      updateData.scheduledRepetitionDate = scheduledRepetitionDate;
      updateData.repetitionInterval = interval;
      updateData.masteryLevel = masteryLevel;
      updateData.streakCount = (currentProblem.streakCount || 0) + 1;
      }
    }

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Clear caches since completion status changed
    clearCalendarCache();
    clearStatsCache();

    res.json({
      message: 'Problem marked as completed',
      problem
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Failed to update problem', details: error.message });
  }
});

// Get all problems (for debugging/admin) - MUST come before /:id route
router.get('/', async (req, res) => {
  try {
    const { completed, topic } = req.query;
    const query = {};

    if (completed !== undefined) {
      query.isCompleted = completed === 'true';
    }

    if (topic) {
      query.topic = topic;
    }

    const problems = await Problem.find(query).sort({ createdAt: -1 }).lean();
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems', details: error.message });
  }
});

// Get all unique topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await Problem.distinct('topic');
    res.json({ topics: topics.sort() });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics', details: error.message });
  }
});

// Get single problem by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem', details: error.message });
  }
});

// Update problem details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { problemNumber, topic, repetitionDate, difficulty, notes } = req.body;

    // Get current problem to check if topic is changing
    const currentProblem = await Problem.findById(id);
    if (!currentProblem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const updateData = {};
    if (problemNumber !== undefined) updateData.problemNumber = problemNumber.toString().trim();
    if (req.body.problemSlug !== undefined) updateData.problemSlug = req.body.problemSlug.toString().trim();
    if (topic !== undefined) updateData.topic = topic;
    if (repetitionDate !== undefined) updateData.repetitionDate = new Date(repetitionDate);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (notes !== undefined) updateData.notes = notes;

    // If topic changed and problem is an anchor, recalculate scheduledRepetitionDate
    if (topic !== undefined && topic !== currentProblem.topic && currentProblem.type === 'anchor') {
      const fromDate = currentProblem.scheduledRepetitionDate || currentProblem.nextRepetitionDate || new Date();
      const newScheduledDate = await findNextTopicDay(topic, fromDate);
      updateData.scheduledRepetitionDate = newScheduledDate;
    }

    // If repetitionDate is manually updated, also update scheduledRepetitionDate
    if (repetitionDate !== undefined && currentProblem.type === 'anchor') {
      const newScheduledDate = await findNextTopicDay(
        updateData.topic || currentProblem.topic, 
        new Date(repetitionDate)
      );
      updateData.scheduledRepetitionDate = newScheduledDate;
      updateData.nextRepetitionDate = new Date(repetitionDate);
    }

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Clear caches if dates or completion status might have changed
    clearCalendarCache();
    clearStatsCache();

    res.json({
      message: 'Problem updated successfully',
      problem
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Failed to update problem', details: error.message });
  }
});

// Unmark problem as completed
router.patch('/:id/uncomplete', async (req, res) => {
  try {
    const { id } = req.params;

    const currentProblem = await Problem.findById(id);
    
    if (!currentProblem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Use UTC day boundaries
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);
    const todayEndUTC = new Date(todayStartUTC);
    todayEndUTC.setUTCHours(23, 59, 59, 999);

    // Prevent unmarking if completion date is in the past
    if (currentProblem.isCompleted) {
      let completionDate;
      if (currentProblem.type === 'repetition') {
        completionDate = currentProblem.repetitionCompletedDate;
      } else {
        completionDate = currentProblem.completedDate;
      }

      if (completionDate) {
        const completionDayStart = new Date(completionDate);
        completionDayStart.setUTCHours(0, 0, 0, 0);
        
        // If completion date is before today, prevent changes
        if (completionDayStart < todayStartUTC) {
          return res.status(400).json({ 
            error: 'Cannot change completion status for problems completed on past days. Completion status is locked after the day has passed.' 
          });
        }
      }
    }

    // Prepare base update
    const updateData = {
      isCompleted: false
    };

    // Handle repetition vs anchor problems differently
    if (currentProblem.type === 'repetition') {
      // For repetition problems, unset repetitionCompletedDate
      updateData.$unset = { repetitionCompletedDate: 1 };
      
      // Check if this was completed today
      const wasCompletedToday = currentProblem.repetitionCompletedDate && (
        currentProblem.repetitionCompletedDate >= todayStartUTC && 
        currentProblem.repetitionCompletedDate <= todayEndUTC
      );

      // Count completions today (anchor or repetition)
    const completedTodayCount = await Problem.countDocuments({
      problemNumber: currentProblem.problemNumber,
      isCompleted: true,
        $or: [
          { type: 'anchor', completedDate: { $gte: todayStartUTC, $lte: todayEndUTC } },
          { type: 'repetition', repetitionCompletedDate: { $gte: todayStartUTC, $lte: todayEndUTC } }
        ]
    });

      // If this was the only completion today, decrement solveCount
      if (wasCompletedToday && completedTodayCount === 1) {
        const maxSolveCountDoc = await Problem.findOne({
          problemNumber: currentProblem.problemNumber
        }).sort({ solveCount: -1 });
        const currentMax = maxSolveCountDoc?.solveCount || currentProblem.solveCount || 0;
        const newSolveCount = Math.max(0, currentMax - 1);

        await Problem.updateMany(
          { problemNumber: currentProblem.problemNumber },
          { $set: { solveCount: newSolveCount } }
        );
        
        // Recalculate anchor problem's dates if this was a repetition
        if (currentProblem.originalProblemId) {
          const anchorProblem = await Problem.findById(currentProblem.originalProblemId);
          if (anchorProblem) {
            // Find the most recent completion date (anchor or any remaining repetition)
            let mostRecentCompletion = null;
            if (anchorProblem.completedDate) {
              mostRecentCompletion = new Date(anchorProblem.completedDate);
            }
            
            // Check all remaining repetition completions
            const remainingRepetitionCompletions = await Problem.find({
              type: 'repetition',
              originalProblemId: anchorProblem._id,
              isCompleted: true,
              repetitionCompletedDate: { $exists: true, $ne: null }
            }).select('repetitionCompletedDate').sort({ repetitionCompletedDate: -1 }).limit(1).lean();
            
            if (remainingRepetitionCompletions.length > 0) {
              const latestRepCompletion = new Date(remainingRepetitionCompletions[0].repetitionCompletedDate);
              if (!mostRecentCompletion || latestRepCompletion > mostRecentCompletion) {
                mostRecentCompletion = latestRepCompletion;
              }
            }
            
            // Recalculate next repetition dates if there's a completion
            if (mostRecentCompletion) {
              const interval = calculateInterval(newSolveCount, anchorProblem.difficulty);
              const nextRepetitionDate = new Date(mostRecentCompletion);
              nextRepetitionDate.setDate(nextRepetitionDate.getDate() + interval);
              nextRepetitionDate.setUTCHours(0, 0, 0, 0);
              
              const scheduledRepetitionDate = await findNextTopicDay(
                anchorProblem.topic,
                nextRepetitionDate
              );
              
              const masteryLevel = calculateMasteryLevel(
                newSolveCount,
                anchorProblem.failedCount || 0,
                anchorProblem.streakCount || 0
              );
              
              await Problem.findByIdAndUpdate(
                currentProblem.originalProblemId,
                {
                  lastCompletedDate: mostRecentCompletion,
                  nextRepetitionDate: nextRepetitionDate,
                  scheduledRepetitionDate: scheduledRepetitionDate,
                  repetitionInterval: interval,
                  masteryLevel: masteryLevel
                }
              );
            } else {
              // No completions left, reset dates
              await Problem.findByIdAndUpdate(
                currentProblem.originalProblemId,
                {
                  $unset: { lastCompletedDate: 1, nextRepetitionDate: 1, scheduledRepetitionDate: 1 },
                  repetitionInterval: 1,
                  masteryLevel: 'new'
                }
              );
            }
          }
        }
      }
    } else {
      // For anchor problems, unset completedDate
      updateData.$unset = { completedDate: 1 };

      // Count how many completions exist today BEFORE unmarking
      const completedTodayCount = await Problem.countDocuments({
        problemNumber: currentProblem.problemNumber,
        isCompleted: true,
        $or: [
          { type: 'anchor', completedDate: { $gte: todayStartUTC, $lte: todayEndUTC } },
          { type: 'repetition', repetitionCompletedDate: { $gte: todayStartUTC, $lte: todayEndUTC } }
        ]
      });

    // If this entry was completed today and it is the ONLY completion for today,
      // then decrement solveCount by 1
    const wasCompletedToday = currentProblem.completedDate && (
      currentProblem.completedDate >= todayStartUTC && currentProblem.completedDate <= todayEndUTC
    );

    if (wasCompletedToday && completedTodayCount === 1) {
      const maxSolveCountDoc = await Problem.findOne({
        problemNumber: currentProblem.problemNumber
      }).sort({ solveCount: -1 });
      const currentMax = maxSolveCountDoc?.solveCount || currentProblem.solveCount || 0;
      const newSolveCount = Math.max(0, currentMax - 1);

      await Problem.updateMany(
        { problemNumber: currentProblem.problemNumber },
        { $set: { solveCount: newSolveCount } }
      );
      
      // Recalculate next repetition dates for anchor problem
      if (currentProblem.type === 'anchor') {
        // Find the most recent completion date (any remaining repetition)
        let mostRecentCompletion = null;
        
        // Check all repetition completions for this anchor
        const allRepetitionCompletions = await Problem.find({
          type: 'repetition',
          originalProblemId: currentProblem._id,
          isCompleted: true,
          repetitionCompletedDate: { $exists: true, $ne: null }
        }).select('repetitionCompletedDate').sort({ repetitionCompletedDate: -1 }).limit(1).lean();
        
        if (allRepetitionCompletions.length > 0) {
          mostRecentCompletion = new Date(allRepetitionCompletions[0].repetitionCompletedDate);
        }
        
        // Recalculate next repetition dates if there's a completion
        if (mostRecentCompletion) {
          const interval = calculateInterval(newSolveCount, currentProblem.difficulty);
          const nextRepetitionDate = new Date(mostRecentCompletion);
          nextRepetitionDate.setDate(nextRepetitionDate.getDate() + interval);
          nextRepetitionDate.setUTCHours(0, 0, 0, 0);
          
          const scheduledRepetitionDate = await findNextTopicDay(
            currentProblem.topic,
            nextRepetitionDate
          );
          
          const masteryLevel = calculateMasteryLevel(
            newSolveCount,
            currentProblem.failedCount || 0,
            currentProblem.streakCount || 0
          );
          
          updateData.lastCompletedDate = mostRecentCompletion;
          updateData.nextRepetitionDate = nextRepetitionDate;
          updateData.scheduledRepetitionDate = scheduledRepetitionDate;
          updateData.repetitionInterval = interval;
          updateData.masteryLevel = masteryLevel;
        } else {
          // No completions left, reset dates
          if (!updateData.$unset) updateData.$unset = {};
          updateData.$unset.lastCompletedDate = 1;
          updateData.$unset.nextRepetitionDate = 1;
          updateData.$unset.scheduledRepetitionDate = 1;
          updateData.repetitionInterval = 1;
          updateData.masteryLevel = 'new';
        }
      }
      }
    }

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Clear caches since completion status changed
    clearCalendarCache();
    clearStatsCache();

    const message = currentProblem.type === 'repetition'
      ? 'Repetition problem unmarked as completed. It will appear in backlog/repetition section.'
      : 'Problem unmarked as completed';

    res.json({
      message,
      problem
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Failed to update problem', details: error.message });
  }
});

// Delete problem
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // If deleting an anchor problem, also delete all its repetition entries
    if (problem.type === 'anchor') {
      await Problem.deleteMany({
        type: 'repetition',
        originalProblemId: problem._id
      });
    }

    // Delete the problem
    await Problem.findByIdAndDelete(id);

    // Clear caches since problem was deleted
    clearCalendarCache();
    clearStatsCache();

    res.json({
      message: 'Problem deleted successfully',
      problem
    });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Failed to delete problem', details: error.message });
  }
});

export default router;

