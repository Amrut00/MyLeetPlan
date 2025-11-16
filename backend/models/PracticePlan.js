import mongoose from 'mongoose';

const practicePlanSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    unique: true
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

// Mongoose will create a unique index for dayOfWeek from the schema definition above.

const PracticePlan = mongoose.model('PracticePlan', practicePlanSchema);

export default PracticePlan;

