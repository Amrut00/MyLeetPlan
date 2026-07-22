import mongoose from 'mongoose';

const practicePlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  anchorTopic: {
    type: String,
    required: true,
    trim: true
  },
  repetitionTopic: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Each user has at most one plan entry per day of the week.
practicePlanSchema.index({ userId: 1, dayOfWeek: 1 }, { unique: true });

const PracticePlan = mongoose.model('PracticePlan', practicePlanSchema);

export default PracticePlan;

