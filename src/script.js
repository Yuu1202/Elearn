// DOM Elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('closeBtn');
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const courseModal = document.getElementById('courseModal');
const closeCourseModal = document.getElementById('closeCourseModal');

// Sidebar Toggle
hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});

// Profile Modal
profileBtn.addEventListener('click', () => {
    profileModal.classList.add('active');
});

closeProfileModal.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

// Course Modal
/*
    [DATABASE DYNAMIC]
    Untuk membuat ini dinamis dengan database:
    
    1. Di HTML, tambahkan data-course-id pada setiap .course-card
       Contoh: <div class="course-card large" data-course-id="1">
    
    2. Saat card diklik, ambil course_id dan fetch data dari database
    3. Isi modal dengan data course yang sesuai
*/
const courseCards = document.querySelectorAll('.course-card');
courseCards.forEach(card => {
    card.addEventListener('click', function() {
        // [DATABASE]
        // const courseId = this.getAttribute('data-course-id');
        // Fetch course detail dari database berdasarkan courseId
        // UPDATE modal content dengan data dari database
        
        courseModal.classList.add('active');
    });
});

closeCourseModal.addEventListener('click', () => {
    courseModal.classList.remove('active');
});

// Close modals when clicking outside
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('active');
    }
});

courseModal.addEventListener('click', (e) => {
    if (e.target === courseModal) {
        courseModal.classList.remove('active');
    }
});

// Close modals with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        profileModal.classList.remove('active');
        courseModal.classList.remove('active');
        sidebar.classList.remove('active');
    }
});

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animate progress bars on load
/*
    [DATABASE]
    Progress bar akan diupdate secara dinamis dari database
    Width sudah di-set dari inline style berdasarkan user_progress.progress_percentage
*/
window.addEventListener('load', () => {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.width = width;
        }, 300);
    });
});

// Add active class to navigation items
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
    });
});

/*
    [DATABASE INTEGRATION GUIDE]
    
    Untuk integrasi dengan database (PHP/MySQL contoh):
    
    1. PROFILE DATA
       - Ambil dari tabel 'users' berdasarkan session user_id
       - Query: SELECT full_name, username, profile_picture FROM users WHERE user_id = ?
       - Update: .avatar, .profile-avatar, h2 di modal
    
    2. COURSES LIST
       - Loop dari tabel 'courses'
       - Query: SELECT course_id, course_name, course_description, course_color FROM courses
       - Untuk setiap course, generate .course-card
    
    3. USER PROGRESS
       - Join tabel 'user_progress' dengan 'courses'
       - Query: SELECT progress_percentage FROM user_progress WHERE user_id = ? AND course_id = ?
       - Update: .progress-fill width dan percentage text
    
    4. BADGES
       - Tabel 'badges' untuk semua badge yang tersedia
       - Tabel 'user_badges' untuk badge yang sudah diperoleh user
       - Query untuk badge aktif: 
         SELECT b.*, ub.earned_date FROM badges b 
         JOIN user_badges ub ON b.badge_id = ub.badge_id 
         WHERE ub.user_id = ?
       - Query untuk badge belum aktif:
         SELECT * FROM badges WHERE badge_id NOT IN 
         (SELECT badge_id FROM user_badges WHERE user_id = ?)
    
    5. STREAK CALENDAR
       - Tabel 'user_activity' dengan kolom activity_date
       - Query: SELECT activity_date FROM user_activity 
                WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       - Loop 7 hari terakhir, cek apakah ada di hasil query
       - Jika ada, tambahkan class 'active' pada .streak-day
    
    6. COMMENTS
       - Tabel 'course_comments' join dengan 'users'
       - Query: SELECT c.comment_text, c.created_at, u.full_name, u.profile_picture 
                FROM course_comments c 
                JOIN users u ON c.user_id = u.user_id 
                WHERE c.course_id = ? 
                ORDER BY c.created_at DESC LIMIT 10
       - Generate .comment untuk setiap hasil
    
    7. EXAMPLE PHP LOOP (untuk course cards):
    
    <?php
    $courses = $db->query("SELECT * FROM courses");
    foreach($courses as $course) {
        $progress = $db->query("SELECT progress_percentage FROM user_progress 
                                WHERE user_id = ? AND course_id = ?", 
                                [$_SESSION['user_id'], $course['course_id']]);
        ?>
        <div class="course-card large" data-course-id="<?php echo $course['course_id']; ?>">
            <div class="card-header <?php echo $course['course_color']; ?>">
                <span class="book-icon"></span>
            </div>
            <div class="card-content">
                <h3><?php echo $course['course_name']; ?></h3>
                <p><?php echo $course['course_description']; ?></p>
                <div class="progress-section">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span><?php echo $progress['progress_percentage']; ?>%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: <?php echo $progress['progress_percentage']; ?>%"></div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    ?>
    
    8. DATABASE SCHEMA RECOMMENDATION:
    
    TABLE users:
    - user_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - username (VARCHAR)
    - full_name (VARCHAR)
    - profile_picture (VARCHAR) // path to image or NULL
    - created_at (DATETIME)
    
    TABLE courses:
    - course_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - course_name (VARCHAR)
    - course_description (TEXT)
    - course_color (VARCHAR) // class name: 'green', 'purple', 'orange', 'blue'
    - created_at (DATETIME)
    
    TABLE user_progress:
    - progress_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - user_id (INT, FOREIGN KEY)
    - course_id (INT, FOREIGN KEY)
    - progress_percentage (INT) // 0-100
    - last_accessed (DATETIME)
    - updated_at (DATETIME)
    
    TABLE badges:
    - badge_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - course_id (INT, FOREIGN KEY, NULL untuk badge global)
    - badge_name (VARCHAR)
    - badge_description (TEXT)
    - badge_icon (VARCHAR) // emoji atau path icon
    - created_at (DATETIME)
    
    TABLE user_badges:
    - user_badge_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - user_id (INT, FOREIGN KEY)
    - badge_id (INT, FOREIGN KEY)
    - earned_date (DATE)
    
    TABLE user_activity:
    - activity_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - user_id (INT, FOREIGN KEY)
    - activity_date (DATE)
    - activity_type (VARCHAR) // 'login', 'course_access', 'quiz_completed', etc.
    
    TABLE course_comments:
    - comment_id (INT, PRIMARY KEY, AUTO_INCREMENT)
    - course_id (INT, FOREIGN KEY)
    - user_id (INT, FOREIGN KEY)
    - comment_text (TEXT)
    - created_at (DATETIME)
*/