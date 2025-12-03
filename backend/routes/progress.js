const express = require('express');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Start course progress
router.post('/start', auth, async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if progress already exists
    let progress = await Progress.findOne({
      userId: req.user._id,
      courseId
    });

    if (progress) {
      return res.json(progress);
    }

    // Create new progress
    progress = new Progress({
      userId: req.user._id,
      courseId,
      completedSections: [],
      progressPercentage: 0,
      quizResults: [],
      isCompleted: false
    });

    await progress.save();
    res.status(201).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all user progress
router.get('/user', auth, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user._id })
      .populate('courseId', 'title thumbnail difficulty badgeType');
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get progress for specific course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark section as complete
router.put('/section', auth, async (req, res) => {
  try {
    const { courseId, sectionId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let progress = await Progress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found. Start the course first.' });
    }

    // Add section if not already completed
    if (!progress.completedSections.includes(sectionId)) {
      progress.completedSections.push(sectionId);
    }

    // Calculate progress percentage
    const totalSections = course.metadata.totalSections;
    const completedCount = progress.completedSections.length;
    progress.progressPercentage = totalSections > 0 
      ? Math.round((completedCount / totalSections) * 100) 
      : 0;

    // Check if course is complete
    const allSectionsCompleted = progress.progressPercentage === 100;
    const allQuizzesPassed = course.metadata.quizIds.every(quizId => {
      const result = progress.quizResults.find(r => r.quizId === quizId);
      return result && result.passed;
    });

    let badgeEarned = null;

    if (allSectionsCompleted && allQuizzesPassed && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Award badge
      const badge = {
        badgeId: `badge_${Date.now()}`,
        badgeName: `${course.title} Master`,
        badgeType: course.badgeType,
        courseId: course._id.toString(),
        courseName: course.title,
        earnedAt: new Date()
      };

      await User.findByIdAndUpdate(req.user._id, {
        $push: { badges: badge }
      });

      badgeEarned = badge;

      // Check for Platinum badge
      const completedCoursesCount = await Progress.countDocuments({
        userId: req.user._id,
        isCompleted: true
      });

      const totalPublishedCourses = await Course.countDocuments({
        isPublished: true
      });

      if (completedCoursesCount === totalPublishedCourses) {
        const platinumBadge = {
          badgeId: `badge_platinum_${Date.now()}`,
          badgeName: 'Ultimate Learner',
          badgeType: 'platinum',
          courseId: 'all',
          courseName: 'All Courses',
          earnedAt: new Date()
        };

        await User.findByIdAndUpdate(req.user._id, {
          $push: { badges: platinumBadge }
        });

        badgeEarned = platinumBadge;
      }
    }

    await progress.save();

    res.json({
      progress,
      badgeEarned
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit quiz score (simplified - no answer checking in backend)
router.post('/quiz', auth, async (req, res) => {
  try {
    const { courseId, quizId, score } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Default passing score is 70
    const passingScore = 70;
    const passed = score >= passingScore;

    let progress = await Progress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found. Start the course first.' });
    }

    // Save quiz result
    const quizResult = {
      quizId,
      score,
      passed,
      answers: [], // Not storing detailed answers anymore
      attemptedAt: new Date()
    };

    // Remove old attempts for this quiz
    progress.quizResults = progress.quizResults.filter(r => r.quizId !== quizId);
    progress.quizResults.push(quizResult);

    // Check if course is complete
    const allSectionsCompleted = progress.progressPercentage === 100;
    const allQuizzesPassed = course.metadata.quizIds.every(qId => {
      const result = progress.quizResults.find(r => r.quizId === qId);
      return result && result.passed;
    });

    let badgeEarned = null;

    if (allSectionsCompleted && allQuizzesPassed && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Award badge
      const badge = {
        badgeId: `badge_${Date.now()}`,
        badgeName: `${course.title} Master`,
        badgeType: course.badgeType,
        courseId: course._id.toString(),
        courseName: course.title,
        earnedAt: new Date()
      };

      await User.findByIdAndUpdate(req.user._id, {
        $push: { badges: badge }
      });

      badgeEarned = badge;

      // Check for Platinum badge
      const completedCoursesCount = await Progress.countDocuments({
        userId: req.user._id,
        isCompleted: true
      });

      const totalPublishedCourses = await Course.countDocuments({
        isPublished: true
      });

      if (completedCoursesCount === totalPublishedCourses) {
        const platinumBadge = {
          badgeId: `badge_platinum_${Date.now()}`,
          badgeName: 'Ultimate Learner',
          badgeType: 'platinum',
          courseId: 'all',
          courseName: 'All Courses',
          earnedAt: new Date()
        };

        await User.findByIdAndUpdate(req.user._id, {
          $push: { badges: platinumBadge }
        });

        badgeEarned = platinumBadge;
      }
    }

    await progress.save();

    res.json({
      score,
      passed,
      badgeEarned
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;