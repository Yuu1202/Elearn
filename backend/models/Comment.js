const mongoose = require('mongoose');

// Definisi skema untuk koleksi 'Comment'
const commentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId, // Referensi ke ID kursus
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Referensi ke ID pengguna yang membuat komentar
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true       // Username pengguna yang membuat komentar (untuk tampilan cepat)
  },
  comment: {
    type: String,
    required: true       // Isi komentar
  },
  createdAt: {
    type: Date,
    default: Date.now    // Waktu komentar dibuat
  },
  updatedAt: {
    type: Date,
    default: Date.now    // Waktu terakhir pembaruan komentar
  }
});

// Mengekspor model Mongoose untuk digunakan
module.exports = mongoose.model('Comment', commentSchema);