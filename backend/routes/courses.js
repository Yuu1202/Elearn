const express = require('express');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Create course (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      thumbnail, 
      difficulty, 
      badgeType, 
      courseCode,
      metadata 
    } = req.body;

    const course = new Course({
      title,
      description,
      thumbnail,
      difficulty,
      badgeType,
      courseCode: {
        html: courseCode.html || '',
        css: courseCode.css || '',
        js: courseCode.js || ''
      },
      metadata: {
        totalSections: metadata.totalSections || 0,
        totalQuizzes: metadata.totalQuizzes || 0,
        sectionIds: metadata.sectionIds || [],
        quizIds: metadata.quizIds || []
      },
      createdBy: req.user._id,
      isPublished: false
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select('-courseCode') // Don't send code to list view
      .sort('-createdAt');
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all courses including unpublished (Admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find().sort('-createdAt');
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get course by ID (with full code for rendering)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      thumbnail, 
      difficulty, 
      badgeType, 
      courseCode,
      metadata 
    } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        thumbnail,
        difficulty,
        badgeType,
        courseCode: {
          html: courseCode.html || '',
          css: courseCode.css || '',
          js: courseCode.js || ''
        },
        metadata: {
          totalSections: metadata.totalSections || 0,
          totalQuizzes: metadata.totalQuizzes || 0,
          sectionIds: metadata.sectionIds || [],
          quizIds: metadata.quizIds || []
        },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle publish status (Admin only)
router.put('/:id/publish', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;