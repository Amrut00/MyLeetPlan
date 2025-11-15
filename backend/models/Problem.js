import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  problemNumber: {
    type: String,
    required: true,
    trim: true
  },
  problemSlug: {
    type: String,
    trim: true,
    default: ''
    // Optional: LeetCode problem slug (e.g., "count-good-numbers" for problem 1922)
  },
  problemTitle: {
    type: String,
    trim: true,
    default: ''
    // Optional: LeetCode problem title (e.g., "Count Good Numbers" for problem 1922)
  },
  topic: {
    type: String,
    required: true,
    trim: true
    // Removed enum to allow custom topics
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  addedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  repetitionDate: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  },
  type: {
    type: String,
    enum: ['anchor', 'repetition'],
    required: true
  },
  solveCount: {
    type: Number,
    default: 1
    // Tracks how many times this problem has been solved
  }
}, {
  timestamps: true
});

// Index for efficient queries
problemSchema.index({ repetitionDate: 1, isCompleted: 1 });
problemSchema.index({ addedDate: 1, topic: 1 });
problemSchema.index({ problemNumber: 1 }); // For duplicate detection
// FIX: Add composite indexes for better query performance
problemSchema.index({ repetitionDate: 1, topic: 1, isCompleted: 1 }); // For repetition queries
problemSchema.index({ addedDate: 1, topic: 1, type: 1 }); // For repetition queries with addedDate
problemSchema.index({ problemNumber: 1, solveCount: -1 }); // For solve count queries

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;

