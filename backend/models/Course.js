const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: 'https://via.placeholder.com/300x200'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  badgeType: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    default: 'bronze'
  },
  // Course is a full standalone app (HTML/CSS/JS)
  courseCode: {
    html: {
      type: String,
      default: ''
    },
    css: {
      type: String,
      default: ''
    },
    js: {
      type: String,
      default: ''
    }
  },
  // Metadata about sections and quizzes for progress tracking
  metadata: {
    totalSections: {
      type: Number,
      default: 0
    },
    totalQuizzes: {
      type: Number,
      default: 0
    },
    sectionIds: [String], // e.g., ['section_1', 'section_2']
    quizIds: [String] // e.g., ['quiz_1', 'quiz_2']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);