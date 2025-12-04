const mongoose = require('mongoose');

// Definisi skema untuk koleksi 'Progress'
const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Referensi ke ID pengguna
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId, // Referensi ke ID kursus
    ref: 'Course',
    required: true
  },
  completedSections: [{
    type: String // Array yang menyimpan ID/nama seksi yang telah diselesaikan
  }],
  progressPercentage: {
    type: Number,
    default: 0           // Persentase kemajuan total kursus (0-100)
  },
  quizResults: [{
    // Array dari hasil kuis yang telah dicoba
    quizId: String,
    score: Number,
    passed: Boolean,
    answers: [{
      // Detail jawaban untuk setiap pertanyaan dalam kuis
      questionId: String,
      selectedAnswer: Number, // Jawaban yang dipilih pengguna
      isCorrect: Boolean
    }],
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isCompleted: {
    type: Boolean,
    default: false       // Status apakah kursus telah selesai
  },
  startedAt: {
    type: Date,
    default: Date.now    // Waktu pengguna memulai kursus
  },
  completedAt: Date      // Waktu pengguna menyelesaikan kursus
});

// Memastikan hanya ada SATU dokumen Progress per pasangan userId dan courseId
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Mengekspor model Mongoose untuk digunakan
module.exports = mongoose.model('Progress', progressSchema);