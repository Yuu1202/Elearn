const express = require('express');
const Comment = require('../models/Comment'); // Model Mongoose untuk Komentar
const { auth, adminAuth } = require('../middleware/auth'); // Middleware otorisasi

const router = express.Router();


// --- Endpoint /api/comments/ ---
// Health check / Rute dasar
router.get('/', (req, res) => {
  res.json({ message: 'Comments API is ready.' });
});

// --- Endpoint /api/comments/ (POST) ---
// Menambahkan Komentar Baru
router.post('/', auth, async (req, res) => { // Memerlukan autentikasi (auth)
  try {
    // Memastikan kita mengambil 'comment' dari req.body, yang merupakan isi komentar.
    const { courseId, comment } = req.body; 

    // Guard Clause: Pastikan komentar tidak kosong
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'Comment body cannot be empty.' });
    }

    // Membuat objek Komentar baru
    const newComment = new Comment({
      courseId,
      userId: req.user._id,        // ID pengguna diambil dari token JWT (req.user)
      username: req.user.username, // Username juga diambil dari req.user
      comment // Gunakan properti 'comment' (isi komentar)
    });

    await newComment.save();
    res.status(201).json(newComment); // 201 Created
  } catch (error) {
    // Tambahkan log detail error di server untuk debugging lebih lanjut
    console.error("Error creating comment:", error); 
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoint /api/comments/:courseId (GET) ---
// Mendapatkan semua komentar untuk sebuah kursus
router.get('/:courseId', async (req, res) => {
  try {
    // Cari semua komentar yang memiliki courseId yang cocok
    const comments = await Comment.find({ courseId: req.params.courseId })
      .sort('-createdAt'); // Urutkan berdasarkan waktu pembuatan terbaru
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoint /api/comments/:id (PUT) ---
// Memperbarui Komentar (Hanya oleh pemilik)
router.put('/:id', auth, async (req, res) => { // Memerlukan autentikasi (auth)
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Periksa apakah pengguna yang login adalah pemilik komentar
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' }); // 403 Forbidden
    }
    
    // Pastikan komentar baru tidak kosong
    if (!req.body.comment || req.body.comment.trim() === '') {
        return res.status(400).json({ error: 'Comment body cannot be empty.' });
    }

    // Perbarui isi komentar dan waktu update
    comment.comment = req.body.comment; 
    comment.updatedAt = Date.now();
    await comment.save();

    res.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoint /api/comments/:id (DELETE) ---
// Menghapus Komentar (Oleh pemilik atau Admin)
router.delete('/:id', auth, async (req, res) => { // Memerlukan autentikasi (auth)
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Periksa otorisasi: pemilik komentar ATAU admin
    // Catatan: Asumsi middleware 'auth' telah mengisi req.user dengan user data, termasuk 'role'.
    const isOwner = comment.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' }); // 403 Forbidden
    }

    await Comment.deleteOne({ _id: req.params.id }); // Hapus komentar
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;