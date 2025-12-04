const jwt = require('jsonwebtoken'); // Mengimpor library 'jsonwebtoken' untuk membuat dan memverifikasi token.
const User = require('../models/User'); // Mengimpor model User dari database untuk mencari pengguna berdasarkan ID yang ada di token.

/**
 * Middleware untuk otentikasi pengguna umum.
 * Fungsi ini memastikan bahwa pengguna memiliki token yang valid
 * sebelum dapat mengakses rute yang dilindungi.
 */
const auth = async (req, res, next) => {
  try {
    // 1. Ambil token dari header 'Authorization'.
    // Token diharapkan dalam format: "Bearer <token>"
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 2. Cek apakah token ada. Jika tidak ada, lempar error.
    if (!token) {
      throw new Error(); 
    }

    // 3. Verifikasi token menggunakan secret key dari environment variable.
    // jwt.verify akan mengembalikan payload (data terenkripsi, di sini berisi userId).
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Cari pengguna di database menggunakan userId dari payload token.
    const user = await User.findById(decoded.userId);

    // 5. Cek apakah pengguna ditemukan. Jika tidak, lempar error (token valid tapi pengguna tidak ada).
    if (!user) {
      throw new Error();
    }

    // 6. Jika semua berhasil, simpan objek pengguna dan token ke dalam objek request
    // sehingga rute berikutnya dapat mengakses data pengguna (req.user) dan token (req.token).
    req.user = user;
    req.token = token;
    
    // Lanjutkan ke handler rute berikutnya.
    next(); 
  } catch (error) {
    // Jika ada error (token tidak ada, tidak valid, atau pengguna tidak ditemukan).
    res.status(401).json({ error: 'Please authenticate' }); // Kirim status 401 Unauthorized.
  }
};

/**
 * Middleware untuk otentikasi pengguna administrator (admin).
 * Fungsi ini memastikan pengguna terotentikasi dan memiliki peran 'admin'.
 */
const adminAuth = async (req, res, next) => {
  try {
    // Proses pengambilan dan pengecekan token (sama seperti middleware 'auth').
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    // Verifikasi token.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cari pengguna di database.
    const user = await User.findById(decoded.userId);

    // Cek otentikasi DAN otorisasi (peran/role).
    // 1. Cek apakah pengguna ditemukan.
    // 2. Cek apakah peran pengguna BUKAN 'admin'.
    if (!user || user.role !== 'admin') {
      // Jika pengguna tidak ditemukan ATAU peran bukan admin.
      return res.status(403).json({ error: 'Admin access required' }); // Kirim status 403 Forbidden.
    }

    // Simpan objek pengguna dan token ke request.
    req.user = user;
    req.token = token;
    
    // Lanjutkan ke handler rute berikutnya.
    next();
  } catch (error) {
    // Jika ada error otentikasi (token bermasalah).
    res.status(401).json({ error: 'Please authenticate as admin' }); // Kirim status 401 Unauthorized.
  }
};

// Mengekspor kedua fungsi middleware agar bisa digunakan di file rute lain.
module.exports = { auth, adminAuth };