const express = require('express');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Helper function to create URL-friendly slug
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (except space/hyphen)
    .replace(/[\s_-]+/g, '-') // Collapse whitespace and underscores to a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Directories
const rootDir = path.resolve(__dirname, '../../');
const coursesDestDir = path.join(rootDir, 'frontend/courses');
const courseTemplateDir = path.join(__dirname, '../templates/course_template'); // Asumsi path template

// Ensure destination directory exists
fs.ensureDirSync(coursesDestDir);

/**
 * 💡 Fungsi untuk Menyalin & Mengubah File Template
 * Menjamin file-file course dibuat sesuai dengan data baru (title, id).
 */
const generateCourseFiles = async (courseId, courseTitle) => {
  const courseSlug = slugify(courseTitle);
  const destPath = path.join(coursesDestDir, courseSlug);

  // 1. Hapus folder lama jika ada (untuk PUT)
  await fs.remove(destPath).catch(() => {});

  // 2. Salin template ke folder baru
  await fs.copy(courseTemplateDir, destPath);

  // 3. Ubah placeholder di file index.html
  const indexPath = path.join(destPath, 'index.html');
  let htmlContent = await fs.readFile(indexPath, 'utf8');

  // Ganti placeholder untuk judul dan ID kursus
  htmlContent = htmlContent.replace('{{COURSE_TITLE}}', courseTitle);
  htmlContent = htmlContent.replace('{{COURSE_ID}}', courseId.toString());

  await fs.writeFile(indexPath, htmlContent);

  return courseSlug; // Mengembalikan slug folder
};

// CREATE course (Admin only) - Generate folder/files from template
router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      thumbnail, 
      difficulty, 
      badgeType
      // Hapus courseCode, metadata
    } = req.body;

    const courseFolder = slugify(title);

    // 1. Cek apakah folder dengan slug yang sama sudah ada
    if (await fs.exists(path.join(coursesDestDir, courseFolder))) {
       // Opsional: berikan nama unik jika sudah ada
       // Untuk saat ini, kita anggap judul unik atau admin akan mengupdate yang sudah ada
       // atau kita biarkan logic generateCourseFiles me-replace jika ada (tidak ideal untuk POST baru)
       // Kita asumsikan slug unique untuk POST
    }
    
    // 2. Buat course di database
    const course = new Course({
      title,
      description,
      thumbnail,
      difficulty,
      badgeType,
      courseFolder, // Simpan slug folder
      createdBy: req.user._id,
      isPublished: false
    });

    await course.save();

    // 3. Generate folder dan file dari template
    await generateCourseFiles(course._id, title);

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all published courses (select courseFolder field)
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

// Get course by ID (for detail popup - select courseFolder field)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select('title description thumbnail difficulty badgeType courseFolder createdAt');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE course (Admin only) - Regenerate files
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      thumbnail, 
      difficulty, 
      badgeType, 
      // Hapus courseCode, metadata
    } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Tentukan slug folder baru
    const newCourseFolder = slugify(title);
    
    // Hapus folder lama jika slug berubah
    if (course.courseFolder && course.courseFolder !== newCourseFolder) {
      const oldPath = path.join(coursesDestDir, course.courseFolder);
      await fs.remove(oldPath).catch(() => console.error(`Failed to remove old dir: ${oldPath}`));
    }
    
    // Update database
    course.title = title;
    course.description = description;
    course.thumbnail = thumbnail;
    course.difficulty = difficulty;
    course.badgeType = badgeType;
    course.courseFolder = newCourseFolder; // Update folder field
    course.updatedAt = Date.now();

    // Regenerate folder dan file dari template
    await generateCourseFiles(course._id, title);

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle publish status (Admin only)
router.put('/:id/publish', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
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
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete course folder from frontend
    if (course.courseFolder) {
      const coursePath = path.join(coursesDestDir, course.courseFolder);
      await fs.remove(coursePath).catch(err => console.error(`Error deleting course directory: ${err.message}`));
    }

    // Delete from database
    await course.deleteOne();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;