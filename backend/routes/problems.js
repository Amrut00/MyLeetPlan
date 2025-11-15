import express from 'express';
import Problem from '../models/Problem.js';
import { getRepetitionDateFromPlan } from '../utils/dayUtils.js';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      }).sort({ addedDate: -1 }); // Get the most recent one

      if (existingProblem) {
        // Problem already exists - get the highest solve count
        const maxSolveCount = await Problem.findOne({
          problemNumber: problemNumber
        }).sort({ solveCount: -1 });
        
        const newSolveCount = (maxSolveCount?.solveCount || 1) + 1;
        
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
          addedDate: today,
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
          addedDate: today,
          repetitionDate: repetitionDate,
          type: 'anchor',
          solveCount: 1,
          isCompleted: false // Not completed by default - user needs to mark it complete
        });

        const saved = await newProblem.save();
        results.push(saved);
      }
    }

    res.status(201).json({
      message: duplicates.length > 0 
        ? `${results.length} problem(s) added. ${duplicates.length} duplicate(s) found - solve count incremented.`
        : `${results.length} problem(s) added successfully.`,
      problems: results,
      duplicates: duplicates.length > 0 ? duplicates : undefined
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

    // If marking as complete (was not completed before), increment solve count
    // This handles repetition problems - each time you complete them, it's another solve
    const updateData = {
      isCompleted: true,
      completedDate: new Date()
    };

    // Only increment solve count if it wasn't already completed
    // This way, if you unmark and remark, it counts as another solve
    if (!currentProblem.isCompleted) {
      // FIX: Find the maximum solve count for this problem number across all entries
      // This ensures solve count is consistent across all entries for the same problem
      const maxSolveCount = await Problem.findOne({
        problemNumber: currentProblem.problemNumber
      }).sort({ solveCount: -1 });

      // Increment from the maximum solve count found
      const newSolveCount = (maxSolveCount?.solveCount || currentProblem.solveCount || 0) + 1;
      updateData.solveCount = newSolveCount;
      
      // FIX: Sync solve count across all entries for this problem number
      // This ensures consistency - all entries for the same problem show the same solve count
      await Problem.updateMany(
        { problemNumber: currentProblem.problemNumber },
        { $set: { solveCount: newSolveCount } }
      );
      
      // IMPORTANT: When completing a repetition problem (type: 'anchor' that's being repeated),
      // we should NOT create a new repetition entry. The problem is just marked as complete.
      // Only NEW problems added via POST / create new repetition entries.
    }

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

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

    const problems = await Problem.find(query).sort({ addedDate: -1 });
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

    const updateData = {};
    if (problemNumber !== undefined) updateData.problemNumber = problemNumber.toString().trim();
    if (req.body.problemSlug !== undefined) updateData.problemSlug = req.body.problemSlug.toString().trim();
    if (topic !== undefined) updateData.topic = topic;
    if (repetitionDate !== undefined) updateData.repetitionDate = new Date(repetitionDate);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (notes !== undefined) updateData.notes = notes;

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

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

    // FIX: When unmarking a repetition problem, check if it should reappear in repetition
    // If repetitionDate is today or in the past, the problem will show in backlog
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const repetitionDate = new Date(currentProblem.repetitionDate);
    repetitionDate.setHours(0, 0, 0, 0);
    
    const updateData = {
      isCompleted: false,
      $unset: { completedDate: 1 }
    };

    const problem = await Problem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Note: If repetitionDate is in the past, the problem will appear in backlog
    // If repetitionDate is today, it will appear in repetition section on next dashboard load
    const message = repetitionDate <= today
      ? 'Problem unmarked as completed. It will appear in backlog/repetition section.'
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

    const problem = await Problem.findByIdAndDelete(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

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

