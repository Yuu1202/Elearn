const express = require('express');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');
const fs = require('fs-extra'); // WAJIB
const path = require('path');   // WAJIB

const router = express.Router();

// Helper function to create URL-friendly slug (courseFolder)
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 💡 Directories & Paths - KRUSIAL!
// Menentukan Root Directory (project_root/)
const rootDir = path.resolve(__dirname, '../../'); 
const coursesDestDir = path.join(rootDir, 'frontend/courses'); 

// Pastikan direktori tujuan kursus ada. fs-extra akan membuatnya jika belum ada.
try {
    fs.ensureDirSync(coursesDestDir);
} catch (e) {
    console.error(`❌ Gagal memastikan direktori ${coursesDestDir} ada. Cek izin akses.`);
}


/**
 * Fungsi untuk Menyusun dan Menyimpan File HTML Statis
 */
const generateCourseFiles = async (courseId, courseTitle, courseCode) => {
  const courseSlug = slugify(courseTitle);
  const destPath = path.join(coursesDestDir, courseSlug); 
  const indexPath = path.join(destPath, 'index.html');

  // 1. Hapus folder lama
  await fs.remove(destPath).catch(() => {});
  
  // 2. Buat folder baru
  await fs.ensureDir(destPath);
  
  // 3. Gabungkan HTML, CSS, dan JS menjadi satu file statis
  const finalHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${courseTitle}</title>
  <style>${courseCode?.css || ''}</style> 
</head>
<body>
  ${courseCode?.html || `<h1>${courseTitle} - Konten belum diisi.</h1><p>Silakan isi kode HTML di halaman admin.</p>`}
  <script>
    // Konstanta krusial untuk script course
    const COURSE_ID = '${courseId}';
    
    // JS dari courseCode.js
    ${courseCode?.js || ''}
  </script>
</body>
</html>`;
      
  // 4. Tulis konten ke index.html
  try {
    await fs.writeFile(indexPath, finalHtmlContent); 
  } catch (writeError) {
    console.error('❌ FATAL FILE WRITE ERROR in generateCourseFiles:', writeError);
    console.error(`Attempted path: ${indexPath}`);
    
    // Melemparkan error yang lebih spesifik
    throw new Error(`[Gagal Tulis File] Cek izin folder 'frontend/courses'. Path: ${indexPath}. Detail: ${writeError.message}`);
  }

  return courseSlug; 
};


// ----------------------------------------------------
// ROUTE CRUD DENGAN LOGIKA GENERASI FILE
// ----------------------------------------------------

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

    // 1. Validasi Input Dasar (agar tidak ada error saat save)
    if (!title) {
        return res.status(400).json({ error: 'Course title is required.' });
    }
    
    // 2. Simpan ke Database
    const courseFolder = slugify(title);

    const course = new Course({
      title,
      description,
      thumbnail,
      difficulty,
      badgeType,
      courseFolder, 
      courseCode: {
        html: courseCode?.html || '',
        css: courseCode?.css || '',
        js: courseCode?.js || ''
      },
      metadata: {
        totalSections: metadata?.totalSections || 0,
        totalQuizzes: metadata?.totalQuizzes || 0,
        sectionIds: metadata?.sectionIds || [],
        quizIds: metadata?.quizIds || []
      },
      createdBy: req.user._id,
      isPublished: false
    });

    await course.save();

    // 3. Generate files (Ini yang bisa melempar error)
    await generateCourseFiles(course._id, title, courseCode);

    res.status(201).json(course);
  } catch (error) {
    // 💡 FIX KRUSIAL: Tampilkan error yang lebih spesifik
    console.error('Error in POST /api/courses:', error.message);
    
    let errorMessage = 'Failed to create course.';
    if (error.message.includes('[Gagal Tulis File]')) {
      // Kirim pesan yang detail dari generateCourseFiles
      errorMessage = error.message; 
    } else if (error.message.includes('Cast to ObjectId failed')) {
      errorMessage = 'Data user ID tidak valid. Coba logout dan login lagi.';
    } else {
      errorMessage = `Failed to create course. Detail: ${error.message}`;
    }

    res.status(400).json({ error: errorMessage });
  }
});

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select('title description thumbnail difficulty badgeType courseFolder createdAt') 
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
    const { title, courseCode } = req.body;
    
    const courseFolder = slugify(title);

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body, // Memudahkan update field lain
        courseFolder, 
        courseCode: {
          html: courseCode?.html || '',
          css: courseCode?.css || '',
          js: courseCode?.js || ''
        },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Regenerate files setelah update
    await generateCourseFiles(course._id, title, courseCode);

    res.json(course);
  } catch (error) {
    console.error('Error in PUT /api/courses/:id:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Toggle publish status (Admin only)
router.put('/:id/publish', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    // ... (logic)
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

// DELETE course (Admin only) - Also delete folder/files
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Hapus folder kursus dari frontend
    if (course.courseFolder) {
      const coursePath = path.join(coursesDestDir, course.courseFolder);
      await fs.remove(coursePath)
        .then(() => console.log(`Course folder deleted: ${coursePath}`))
        .catch(err => console.warn(`Failed to delete course folder ${coursePath}: ${err.message}`));
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/courses/:id:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;