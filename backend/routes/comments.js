const express = require('express');
const Comment = require('../models/Comment');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Add comment
router.post('/', auth, async (req, res) => {
  try {
    const { courseId, comment } = req.body;

    const newComment = new Comment({
      courseId,
      userId: req.user._id,
      username: req.user.username,
      comment
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for a course
router.get('/:courseId', async (req, res) => {
  try {
    const comments = await Comment.find({ courseId: req.params.courseId })
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update comment (Owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is owner
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    comment.comment = req.body.comment;
    comment.updatedAt = Date.now();
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete comment (Owner or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is owner or admin
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;