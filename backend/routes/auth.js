const express = require('express');
const jwt = require('jsonwebtoken');        // Digunakan untuk membuat JSON Web Token (JWT)
const User = require('../models/User');     // Model Mongoose untuk Pengguna
const { auth } = require('../middleware/auth'); // Middleware untuk memverifikasi token

const router = express.Router();

// --- Endpoint /api/auth/register ---
// Pendaftaran Pengguna Baru
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Periksa apakah pengguna dengan email atau username sudah ada
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' }); // 400 Bad Request
    }

    // 2. Buat objek User baru (CATATAN: Password disimpan sebagai plain text)
    const user = new User({
      username,
      email,
      password, 
      role: 'user'
    });

    await user.save(); // Simpan ke database

    // 3. Buat JSON Web Token (JWT) untuk sesi
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d' // Token berlaku selama 7 hari
    });

    // 4. Kirim token dan data pengguna (tanpa password)
    res.status(201).json({ // 201 Created
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        badges: user.badges
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoint /api/auth/login ---
// Proses Masuk Pengguna
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Cari pengguna berdasarkan username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' }); // 401 Unauthorized
    }

    // 2. Periksa password (plain text comparison)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Buat JSON Web Token (JWT) untuk sesi
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // 4. Kirim token dan data pengguna
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        badges: user.badges
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoint /api/auth/me ---
// Mendapatkan Data Pengguna Saat Ini
router.get('/me', auth, async (req, res) => {
  try {
    // Middleware 'auth' sudah memastikan req.user terisi dengan data pengguna
    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        badges: req.user.badges
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;