import express from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import PracticePlan from '../models/PracticePlan.js';
import auth, { signToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limit auth endpoints to blunt brute-force / abuse on public signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

// Default 7-day practice plan seeded for every new user
const DEFAULT_PLAN = [
  { dayOfWeek: 0, anchorTopic: 'Linked Lists', repetitionTopic: 'Binary Search' },
  { dayOfWeek: 1, anchorTopic: 'Arrays & Hashing', repetitionTopic: 'Stacks' },
  { dayOfWeek: 2, anchorTopic: 'Two Pointers', repetitionTopic: 'Trees (Basics)' },
  { dayOfWeek: 3, anchorTopic: 'Sliding Window', repetitionTopic: 'Linked Lists' },
  { dayOfWeek: 4, anchorTopic: 'Binary Search', repetitionTopic: 'Arrays & Hashing' },
  { dayOfWeek: 5, anchorTopic: 'Stacks', repetitionTopic: 'Two Pointers' },
  { dayOfWeek: 6, anchorTopic: 'Trees (Basics)', repetitionTopic: 'Sliding Window' }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register a new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: (name || '').trim()
    });

    // Seed the default practice plan for this new user
    await PracticePlan.insertMany(
      DEFAULT_PLAN.map(day => ({ ...day, userId: user._id }))
    );

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register', details: error.message });
  }
});

// Log in an existing user
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in', details: error.message });
  }
});

// Get the currently authenticated user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toSafeJSON() });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

export default router;
