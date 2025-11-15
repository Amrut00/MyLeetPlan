import express from 'express';
import PracticePlan from '../models/PracticePlan.js';

const router = express.Router();

// Get all practice plan entries
router.get('/', async (req, res) => {
  try {
    const plans = await PracticePlan.find().sort({ dayOfWeek: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching practice plan:', error);
    res.status(500).json({ error: 'Failed to fetch practice plan', details: error.message });
  }
});

// Get practice plan for a specific day
router.get('/day/:dayOfWeek', async (req, res) => {
  try {
    const dayOfWeek = parseInt(req.params.dayOfWeek);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Invalid day of week. Must be 0-6 (0=Sunday, 6=Saturday)' });
    }

    const plan = await PracticePlan.findOne({ dayOfWeek });
    if (!plan) {
      return res.status(404).json({ error: 'Practice plan not found for this day' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching practice plan for day:', error);
    res.status(500).json({ error: 'Failed to fetch practice plan', details: error.message });
  }
});

// Create or update practice plan entry
router.post('/', async (req, res) => {
  try {
    const { dayOfWeek, anchorTopic, repetitionTopic } = req.body;

    if (dayOfWeek === undefined || dayOfWeek === null) {
      return res.status(400).json({ error: 'Day of week is required' });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Invalid day of week. Must be 0-6 (0=Sunday, 6=Saturday)' });
    }

    if (!anchorTopic || !anchorTopic.trim()) {
      return res.status(400).json({ error: 'Anchor topic is required' });
    }

    if (!repetitionTopic || !repetitionTopic.trim()) {
      return res.status(400).json({ error: 'Repetition topic is required' });
    }

    // Use upsert to create or update
    const plan = await PracticePlan.findOneAndUpdate(
      { dayOfWeek },
      {
        dayOfWeek,
        anchorTopic: anchorTopic.trim(),
        repetitionTopic: repetitionTopic.trim()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json(plan);
  } catch (error) {
    console.error('Error saving practice plan:', error);
    res.status(500).json({ error: 'Failed to save practice plan', details: error.message });
  }
});

// Update practice plan entry
router.put('/:id', async (req, res) => {
  try {
    const { anchorTopic, repetitionTopic } = req.body;

    if (!anchorTopic || !anchorTopic.trim()) {
      return res.status(400).json({ error: 'Anchor topic is required' });
    }

    if (!repetitionTopic || !repetitionTopic.trim()) {
      return res.status(400).json({ error: 'Repetition topic is required' });
    }

    const plan = await PracticePlan.findByIdAndUpdate(
      req.params.id,
      {
        anchorTopic: anchorTopic.trim(),
        repetitionTopic: repetitionTopic.trim()
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Practice plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error updating practice plan:', error);
    res.status(500).json({ error: 'Failed to update practice plan', details: error.message });
  }
});

// Delete practice plan entry
router.delete('/:id', async (req, res) => {
  try {
    const plan = await PracticePlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Practice plan not found' });
    }
    res.json({ message: 'Practice plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting practice plan:', error);
    res.status(500).json({ error: 'Failed to delete practice plan', details: error.message });
  }
});

// Initialize default practice plan (if no plans exist)
router.post('/initialize', async (req, res) => {
  try {
    const existingPlans = await PracticePlan.countDocuments();
    if (existingPlans > 0) {
      return res.json({ message: 'Practice plan already exists', plans: await PracticePlan.find().sort({ dayOfWeek: 1 }) });
    }

    const defaultPlan = [
      { dayOfWeek: 0, anchorTopic: 'Linked Lists', repetitionTopic: 'Binary Search' },
      { dayOfWeek: 1, anchorTopic: 'Arrays & Hashing', repetitionTopic: 'Stacks' },
      { dayOfWeek: 2, anchorTopic: 'Two Pointers', repetitionTopic: 'Trees (Basics)' },
      { dayOfWeek: 3, anchorTopic: 'Sliding Window', repetitionTopic: 'Linked Lists' },
      { dayOfWeek: 4, anchorTopic: 'Binary Search', repetitionTopic: 'Arrays & Hashing' },
      { dayOfWeek: 5, anchorTopic: 'Stacks', repetitionTopic: 'Two Pointers' },
      { dayOfWeek: 6, anchorTopic: 'Trees (Basics)', repetitionTopic: 'Sliding Window' }
    ];

    const plans = await PracticePlan.insertMany(defaultPlan);
    res.json({ message: 'Default practice plan initialized', plans });
  } catch (error) {
    console.error('Error initializing practice plan:', error);
    res.status(500).json({ error: 'Failed to initialize practice plan', details: error.message });
  }
});

export default router;

