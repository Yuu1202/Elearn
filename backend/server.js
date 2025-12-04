// File: backend/server.js (Versi Final dan Jelas)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const commentRoutes = require('./routes/comments');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Tentukan Root Directory agar path menjadi JELAS dan ABSOLUT
const rootDir = path.resolve(__dirname, '..'); // project/backend/.. -> project/
const coursesStaticDir = path.join(rootDir, 'frontend/courses');


// ------------------------------------------
// 1. Definisikan SEMUA Routes API TERLEBIH DAHULU
// ------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/comments', commentRoutes);

// Health check untuk root API
app.get('/api', (req, res) => {
  res.json({ status: 'ok', service: 'E-Learning API' });
});

// ------------------------------------------
// 2. Definisikan Static Files Serving
// ------------------------------------------

// 💡 FIX KRUSIAL: Ekspos folder courses (rute /courses)
// Ini harus menunjuk ke path ABSOLUT: project/frontend/courses
app.use('/courses', express.static(coursesStaticDir));

// Jika Anda ingin menyajikan asset utama (css/js/main.js) dari frontend root:
// app.use(express.static(path.join(rootDir, 'frontend'))); 

// Root Path Handler (untuk mencegah index.html muncul di root backend)
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to E-Learning Backend API. Access data via /api routes.' });
});


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); 
  });


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});