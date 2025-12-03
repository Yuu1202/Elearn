const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
    // Plain text - TIDAK di-hash
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  badges: [{
    badgeId: String,
    badgeName: String,
    badgeType: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    courseId: String,
    courseName: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);