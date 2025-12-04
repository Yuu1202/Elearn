const express = require('express');
const User = require('../models/User'); // Model Mongoose untuk data User
const { auth, adminAuth } = require('../middleware/auth'); // Middleware untuk otentikasi user dan admin

const router = express.Router(); // Membuat instance router Express


// Route GET /api/users: Mendapatkan semua user (Hanya Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    // Cari semua dokumen User
    const users = await User.find().select('-password'); // Kecualikan field 'password' dari hasil
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route GET /api/users/:id: Mendapatkan data user berdasarkan ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Cari user berdasarkan ID dari parameter URL
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route PUT /api/users/:id: Mengubah data user
router.put('/:id', auth, async (req, res) => {
  try {
    // 1. Otorisasi: Hanya izinkan user mengupdate data mereka sendiri, atau Admin mengupdate siapa pun
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      // Jika ID user tidak cocok dengan ID di params DAN user bukan admin
      return res.status(403).json({ error: 'Not authorized' }); // Status 403 (Forbidden)
    }

    const { username, email, password } = req.body;
    const updates = {}; // Objek untuk menampung perubahan

    // Hanya masukkan field yang ada di body request
    if (username) updates.username = username;
    if (email) updates.email = email;
    // PENTING: Jika password di-update, Model User harus memiliki pre-save hook untuk melakukan hashing!
    if (password) updates.password = password; 

    // Cari dan update user berdasarkan ID
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true } // Mengembalikan dokumen yang sudah di-update
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route DELETE /api/users/:id: Menghapus user (Hanya Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Cari dan hapus user berdasarkan ID
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; // Ekspor router agar dapat digunakan di aplikasi Express utama