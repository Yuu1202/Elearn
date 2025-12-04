const express = require('express');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Progress API is ready.' });
});

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

// Get user progress for a specific course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const progress = await Progress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      // 404 jika progress belum dimulai, bukan error
      return res.status(404).json({ message: 'Progress not found. Course not started.' });
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
      // Buat progress jika belum ada (walaupun seharusnya sudah dibuat di /start)
      progress = new Progress({
        userId: req.user._id,
        courseId,
        completedSections: [],
        progressPercentage: 0,
        quizResults: [],
        isCompleted: false
      });
    }

    // Add section if not already completed
    if (!progress.completedSections.includes(sectionId)) {
      progress.completedSections.push(sectionId);
    }

    // Calculate progress percentage (ROBUST CALCULATION)
    const totalSections = (course.metadata && course.metadata.totalSections) 
        ? course.metadata.totalSections 
        : 0; // Menggunakan 0 jika metadata tidak ada
    const completedCount = progress.completedSections.length;
    
    // Pastikan persentase tidak melebihi 100%
    let calculatedPercentage = totalSections > 0 
      ? Math.round((completedCount / totalSections) * 100) 
      : 0;
      
    progress.progressPercentage = Math.min(100, calculatedPercentage);

    // Check if course is complete
    const courseQuizIds = (course.metadata && course.metadata.quizIds) ? course.metadata.quizIds : [];
    
    const allSectionsCompleted = progress.completedSections.length >= totalSections && totalSections > 0;
    
    const allQuizzesPassed = courseQuizIds.every(quizId => {
      const result = progress.quizResults.find(r => r.quizId === quizId);
      return result && result.passed;
    });

    let badgeEarned = null;

    if (allSectionsCompleted && allQuizzesPassed && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Award badge logic...
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

      // Check for Platinum badge...
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

// Get all user progress
router.get('/user', auth, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user._id }).populate('courseId');
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit quiz score (logika perhitungan progress juga diperkuat di sini)
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
            progress = new Progress({
                userId: req.user._id,
                courseId,
                completedSections: [],
                progressPercentage: 0,
                quizResults: [],
                isCompleted: false
            });
        }

        // Update/Save quiz result
        const existingQuizIndex = progress.quizResults.findIndex(r => r.quizId === quizId);
        if (existingQuizIndex > -1) {
            // Update existing result
            progress.quizResults[existingQuizIndex] = { quizId, score, passed, submittedAt: new Date() };
        } else {
            // Add new result
            progress.quizResults.push({ quizId, score, passed, submittedAt: new Date() });
        }

        // Check completion status (ROBUST CALCULATION)
        const totalSections = (course.metadata && course.metadata.totalSections) 
            ? course.metadata.totalSections 
            : 0;
        const completedCount = progress.completedSections.length;
        const allSectionsCompleted = completedCount >= totalSections && totalSections > 0;
        
        const courseQuizIds = (course.metadata && course.metadata.quizIds) ? course.metadata.quizIds : []; 
        const allQuizzesPassed = courseQuizIds.every(qId => {
            const result = progress.quizResults.find(r => r.quizId === qId);
            return result && result.passed;
        });
        
        let badgeEarned = null;

        if (allSectionsCompleted && allQuizzesPassed && !progress.isCompleted) {
            // Logic for completing the course and awarding badge (Sama seperti di router.put('/section', ...))
            progress.isCompleted = true;
            progress.completedAt = new Date();
            // ... (Kode award badge) ...
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