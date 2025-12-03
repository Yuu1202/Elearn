const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedSections: [{
    type: String // Array of sectionId
  }],
  progressPercentage: {
    type: Number,
    default: 0
  },
  quizResults: [{
    quizId: String,
    score: Number,
    passed: Boolean,
    answers: [{
      questionId: String,
      selectedAnswer: Number,
      isCorrect: Boolean
    }],
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Ensure one progress per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);