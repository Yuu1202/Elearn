const mongoose = require('mongoose');

// Definisi skema untuk koleksi 'User'
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,      // Wajib diisi
    unique: true,        // Harus unik (tidak boleh ada yang sama)
    trim: true           // Menghapus spasi di awal/akhir
  },
  email: {
    type: String,
    required: true,      // Wajib diisi
    unique: true,        // Harus unik
    trim: true,          // Menghapus spasi di awal/akhir
    lowercase: true      // Mengubah semua huruf menjadi huruf kecil
  },
  password: {
    type: String,
    required: true
    // Plain text - TIDAK di-hash. CATATAN: Dalam aplikasi nyata, password HARUS di-hash
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Nilai yang diizinkan hanya 'user' atau 'admin'
    default: 'user'          // Nilai default jika tidak disediakan
  },
  badges: [{
    // Array dari lencana (badges) yang diperoleh pengguna
    badgeId: String,
    badgeName: String,
    badgeType: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'] // Tipe lencana
    },
    courseId: String,
    courseName: String,
    earnedAt: {
      type: Date,
      default: Date.now      // Waktu lencana diperoleh
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now        // Waktu pembuatan akun pengguna
  }
});

// Mengekspor model Mongoose untuk digunakan
module.exports = mongoose.model('User', userSchema);