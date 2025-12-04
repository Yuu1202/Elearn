const API_URL = 'http://localhost:5000/api';

// Get token and user from localStorage
function getToken() {
  // PENTING: Gunakan localStorage untuk menyimpan sesi pengguna
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Update navbar based on login status
function updateNavbar() {
  const token = getToken();
  const user = getUser();
  
  const loginLink = document.getElementById('loginLink');
  const profileLink = document.getElementById('profileLink');
  const adminLink = document.getElementById('adminLink');
  const logoutBtn = document.getElementById('logoutBtn');

  if (token && user) {
    loginLink.style.display = 'none';
    profileLink.style.display = 'block';
    logoutBtn.style.display = 'block';
    
    if (user.role === 'admin') {
      adminLink.style.display = 'block';
    } else {
      adminLink.style.display = 'none';
    }
  } else {
    loginLink.style.display = 'block';
    profileLink.style.display = 'none';
    adminLink.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateNavbar();
  window.location.href = 'index.html';
});


// Fetch all courses and render them (DIMODIFIKASI untuk error handling)

// File: main.js

// ...

// Fetch all courses and render them (DIMODIFIKASI untuk error handling)
// File: main.js

// ... (kode sebelumnya)

// Fetch all courses and render them (DIMODIFIKASI untuk error handling)
async function fetchCourses() {
  try {
    // 1. Panggilan Wajib: Ambil daftar kursus
    const coursesResponse = await fetch(`${API_URL}/courses`);
    if (!coursesResponse.ok) {
      throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
    }
    const courses = await coursesResponse.json();
    
    let userProgressMap = {};
    const token = getToken();
    
    // 2. Panggilan Opsional: Ambil progres pengguna (Dibungkus try/catch agar resilien)
    if (token) {
        try { 
            const progressResponse = await fetch(`${API_URL}/progress/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (progressResponse.ok) {
                const allProgress = await progressResponse.json();
                
                // --- START FIX KRUSIAL UNTUK MENGHINDARI ERROR null ---
                allProgress.forEach(p => {
                    // Check jika p.courseId bernilai null sebelum membaca properti
                    // Gunakan optional chaining (?.) untuk syntax modern dan aman.
                    const courseId = p.courseId?._id || p.courseId; 
                    
                    if (courseId) {
                        userProgressMap[courseId] = p.progressPercentage || 0; 
                    } else {
                        // Log pesan jika ada record progres yang diabaikan karena courseId null
                        console.warn('Skipping progress record due to null courseId:', p);
                    }
                });
                // --- END FIX KRUSIAL ---
            } else {
                 console.warn(`Could not load user progress (Status: ${progressResponse.status}). Displaying courses without progress.`);
            }
        } catch (progressError) {
             // Jika terjadi error jaringan atau error lain di sini, kursus tetap tampil
             console.warn('Error fetching user progress. Displaying courses without progress.', progressError);
        }
    }
    
    // Jika daftar kursus berhasil diambil, selalu tampilkan
    displayCourses(courses, userProgressMap); 
    
  } catch (error) {
     // Menampilkan error besar jika gagal memuat daftar kursus
     const grid = document.getElementById('coursesGrid');
     if (grid) grid.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat kursus: ${error.message}</p>`;
  }
}

// Display courses on the homepage

// Display courses on the homepage (DIMODIFIKASI)
function displayCourses(courses, userProgressMap = {}) {
  const grid = document.getElementById('coursesGrid');
  grid.innerHTML = courses.map(course => {
    // Ambil persentase progres, default 0%
    const percentage = userProgressMap[course._id] || 0; 

    return `
        <div class="course-card" onclick="showCourseModal(${JSON.stringify(course).replace(/"/g, '&quot;')})">
            <img src="${course.thumbnail}" alt="${course.title}" class="course-thumbnail">
            <div class="course-info">
                <h3>${course.title}</h3>
                <p class="course-description">${course.description.substring(0, 100)}...</p>
                <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
                
                <div class="progress-container" style="margin-top: 10px;">
                    <div class="progress-bar-outline" style="background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div class="progress-bar-inner" style="width: ${percentage}%; height: 100%; background: #2ecc71; border-radius: 5px;"></div>
                    </div>
                    
                </div>
                </div>
        </div>
    `;
  }).join('');
}

// Function to fetch course progress
async function getCourseProgress(courseId) {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/progress/course/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // 404 berarti user belum memulai kursus, ini bukan error
        if (response.status === 404) {
            return null; // Mengembalikan null jika belum dimulai
        }
        
        if (!response.ok) {
            console.error('Failed to fetch progress:', response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching course progress:', error);
        return null;
    }
}

// Show course detail modal
async function showCourseModal(course) {
  const modal = document.getElementById('courseModal');
  const token = getToken();
  let progress = null;

  if (token) {
    // Ambil progres terbaru
    progress = await getCourseProgress(course._id);
  }
  
  displayCourseDetail(course, progress);
  modal.style.display = 'block';
}


// Function untuk memanggil API memulai progres dan mengarahkan ke halaman kursus
async function startCourse(coursePath, courseId) {
  const token = getToken();
  if (token) {
    try {
      // Panggil API untuk memastikan progres dimulai di backend
      const response = await fetch(`${API_URL}/progress/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId }) // KRITIS: Meneruskan courseId
      });
      
      if (!response.ok && response.status !== 404) {
        console.warn('Progress API start failed, but proceeding to course:', await response.json());
      }
    } catch (error) {
      console.error('Error starting course:', error);
    }
  }
  
  // Arahkan ke halaman kursus
  window.location.href = coursePath; 
}

async function deleteCourseProgress(courseId) {
    const token = getToken();
    if (!token) {
        alert('Anda harus login untuk menghapus progres.');
        return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus semua progres kursus ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/progress/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Gagal menghapus progres kursus.');
        }

        alert('Progres kursus berhasil dihapus! Anda kini dapat memulai kursus dari awal.');
        
        // Tutup modal dan muat ulang halaman untuk memperbarui daftar kursus
        document.getElementById('courseModal').style.display = 'none';
        fetchCourses(); 

    } catch (error) {
        console.error('Error deleting course progress:', error);
        alert(`Gagal menghapus progres: ${error.message}`);
    }
}

// Display course detail in popup (Perbaikan Tombol Start)
function displayCourseDetail(course, progress) {
  const detail = document.getElementById('courseDetail');
  const token = getToken();
  
  // URL untuk tombol "Mulai"
  const coursePath = `/courses/${course.courseFolder}/index.html`;

  // Tentukan progress yang akan ditampilkan. Jika progress null, asumsikan 0%
  const progressPercent = progress ? progress.progressPercentage : 0;
  
  // Tentukan apakah user sudah memulai kursus
  // Dianggap dimulai jika ada objek progress yang ditemukan atau progress > 0
  const isStarted = !!progress; 

  detail.innerHTML = `
    <div style="display: flex; gap: 30px;">
      <div style="flex: 1;">
        <img src="${course.thumbnail}" alt="${course.title}" style="width: 100%; border-radius: 10px; margin-bottom: 20px;">
        <h2>${course.title}</h2>
        <p style="color: #7f8c8d; margin: 15px 0;">${course.description}</p>
        <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
        
        ${token ? `
          <div style="margin: 20px 0;">
            ${isStarted ? `
                <p style="font-weight: bold; margin-bottom: 5px;">Progres Anda: ${progressPercent}%</p>
            ` : '<p>Anda belum memulai kursus ini.</p>'}
          </div>
        ` : `
          <div style="margin: 20px 0;">
            <p style="color: #e74c3c;">Login untuk melihat dan melacak progres.</p>
          </div>
        `}
        
        ${token ? `
          <button onclick="startCourse('${coursePath}', '${course._id}')" class="btn-primary" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem;">
            ${isStarted ? '▶️ Lanjutkan Belajar' : '🚀 Mulai Belajar'}
          </button>
          
          ${isStarted ? `
             <button onclick="deleteCourseProgress('${course._id}')" class="btn-secondary" style="width: 100%; margin-top: 10px; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                 🗑️ Hapus Progres
             </button>
          ` : ''}
          
        ` : `
          <a href="login.html" class="btn-primary" style="display: block; text-align: center; width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem; text-decoration: none;">
            🔒 Login untuk Mulai
          </a>
        `}
      </div>
      
      <div style="flex: 1;">
        <h3>💬 Comments</h3>
        <div id="commentsList" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
          </div>
        
        ${token ? `
          <div class="comment-form">
            <textarea id="commentInput" placeholder="Tulis komentar Anda..." style="width: 100%; min-height: 80px;"></textarea>
            <button onclick="submitComment('${course._id}')" style="margin-top: 10px;">Posting Komentar</button>
          </div>
        ` : '<p style="text-align: center; color: #7f8c8d;">Login untuk berkomentar</p>'}
      </div>
    </div>
  `;
  
  loadComments(course._id);
}
// File: main.js

// ... (Kode sebelumnya, di atas fungsi loadComments)

// ------------------------------------------
// PROGRESS LOGIC
// ------------------------------------------

/**
 * Memanggil API untuk menandai section sebagai selesai.
 * @param {string} courseId - ID kursus.
 * @param {string} sectionId - ID section yang diselesaikan.
 */
async function markSectionComplete(courseId, sectionId) {
    const token = getToken();
    if (!token) {
        alert('Anda harus login untuk mencatat progres.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/progress/section`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // Mengirim ID kursus dan ID section yang selesai
            body: JSON.stringify({ courseId, sectionId }) 
        });

        if (!response.ok) {
            throw new Error('Gagal mencatat progres section.');
        }

        const data = await response.json();
        
        // Notifikasi berhasil dicatat
        console.log(`Progres section ${sectionId} berhasil dicatat. Persentase baru: ${data.progressPercentage}%`);
        
        // Opsional: Cek jika ada badge baru yang didapat
        if (data.badgeEarned) {
             showBadgeModal(data.badgeEarned); // Asumsi fungsi ini sudah Anda buat
        }
        
        // KRUSIAL: Muat ulang progres untuk update tampilan bar dan status section
        loadCourseProgress(courseId); 

    } catch (error) {
        console.error('Error marking section complete:', error);
        alert('Gagal mencatat progres. Coba login ulang.');
    }
}


// Di dalam file main.js:
// ...

async function loadCourses() {
    const token = getToken();
    // 1. Ambil daftar kursus publik
    const coursesResponse = await fetch(`${API_URL}/courses/public`);
    const courses = await coursesResponse.json();
    
    let userProgressMap = {}; // Gunakan Map untuk pencarian cepat
    
    if (token) {
        try {
            // 2. Ambil semua progres pengguna (GET /api/progress/user)
            const progressResponse = await fetch(`${API_URL}/progress/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allProgress = await progressResponse.json();
            
            // 3. Petakan progres ke objek (ProgressId -> Percentage)
            allProgress.forEach(p => {
                // CourseId mungkin berbentuk string ID atau objek Course yang ter-populate
                const id = p.courseId._id || p.courseId; 
                userProgressMap[id] = p.progressPercentage; 
            });
        } catch (error) {
            console.warn('Gagal memuat progres pengguna:', error);
        }
    }
    
    // ... (Logika render Course Card)
    
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = courses.map(course => {
        // 4. Ambil persentase yang sudah dihitung backend
        const percentage = userProgressMap[course._id] || 0; 
        
        // ... (HTML Course Card)
        return `
            <div class="course-card" ...>
                <div class="progress-bar-inner" style="width: ${percentage}%;"></div>
                <p class="progress-text">${percentage}% Selesai</p>
            </div>
        `;
    }).join('');
}
// ...

/**
 * Mengambil dan menampilkan progres kursus dari backend.
 * KRUSIAL: Ini harus dipanggil pada saat halaman kursus dimuat (onload)
 * dan setiap kali ada perubahan progres (setelah markSectionComplete).
 * @param {string} courseId - ID kursus.
 */
async function loadCourseProgress(courseId) {
    const progressDisplay = document.getElementById('progressDisplay');
    const token = getToken();
    
    // Sembunyikan progres jika belum login
    if (!token) {
        if (progressDisplay) {
            progressDisplay.innerHTML = '<p style="color: #7f8c8d;">Login untuk melacak progres Anda.</p>';
        }
        // Pastikan Anda memanggil fungsi ini saat halaman dimuat
        return; 
    }
    
    // Asumsi Course ID dan Section List sudah tersedia secara global di scope kursus
    const COURSE_SECTIONS = window.COURSE_SECTIONS || [];
    const COURSE_QUIZZES = window.COURSE_QUIZZES || [];

    try {
        const response = await fetch(`${API_URL}/progress/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Tangani jika progres belum ada (status 404)
        if (response.status === 404) {
             if (progressDisplay) {
                 progressDisplay.textContent = 'Progres: 0% (0 item)';
             }
             // Lanjutkan ke langkah 4 untuk mereset status section ke 'Belum Selesai'
             // ... (Logika di bawah ini akan mengurus tampilan 0%)
        }
        
        if (!response.ok && response.status !== 404) {
            throw new Error('Failed to fetch progress');
        }

        // Jika 404, progressData akan kosong, jika 200, ambil datanya
        const progressData = response.ok ? await response.json() : {};
        
        // 1. Ambil data yang dibutuhkan
        const safeCompletedSections = progressData.completedSections || [];
        const safeCompletedQuizzes = (progressData.quizResults || [])
             .filter(r => r.passed)
             .map(r => r.quizId);

        // 2. Hitung Ulang Progres (Logika ini akan bekerja baik bahkan jika progressData kosong/404)
        const totalItems = COURSE_SECTIONS.length + COURSE_QUIZZES.length;
        const sectionsDone = safeCompletedSections.length;
        const quizzesDone = safeCompletedQuizzes.filter(q => COURSE_QUIZZES.includes(q)).length;
        const itemsDone = sectionsDone + quizzesDone;
        
        // Hitung persentase
        const percentage = totalItems > 0 ? Math.round((itemsDone / totalItems) * 100) : 0;
        
        // 3. Update Tampilan Progres Bar
        if (progressDisplay) {
           progressDisplay.textContent = `Progres: ${percentage}% (${itemsDone}/${totalItems} item)`;
           
           // Update visual bar (asumsi ada element progress bar dengan ID 'progressBarInner')
           const progressBarInner = document.getElementById('progressBarInner');
           if (progressBarInner) {
               progressBarInner.style.width = `${percentage}%`;
           }
        }
        
        // 4. Update Status Section
        COURSE_SECTIONS.forEach(sectionId => {
            const statusEl = document.getElementById(`status_${sectionId}`);
            if (statusEl) {
                if (safeCompletedSections.includes(sectionId)) {
                    statusEl.textContent = '✅ Selesai';
                    statusEl.classList.add('completed');
                    statusEl.classList.remove('incomplete');
                } else {
                    statusEl.textContent = '⏳ Belum Selesai';
                    statusEl.classList.add('incomplete');
                    statusEl.classList.remove('completed');
                }
            }
        });

    } catch (error) {
        console.error('Error loading course progress:', error);
        if (progressDisplay) {
            progressDisplay.textContent = 'Gagal memuat progres.';
        }
    }
}
// Function to load and display comments (Perbaikan Properti & Tambah Tombol Delete)
async function loadComments(courseId) {
  try {
    const response = await fetch(`${API_URL}/comments/${courseId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch comments');
    }
    const comments = await response.json();
    const commentsList = document.getElementById('commentsList');
    
    // Dapatkan user yang sedang login untuk otorisasi tombol Hapus
    const currentUser = getUser(); // Dapatkan data user dari fungsi di atas

    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #7f8c8d;">Belum ada komentar.</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
      const date = new Date(comment.createdAt).toLocaleDateString();
      const time = new Date(comment.createdAt).toLocaleTimeString();
      
      // Cek apakah user adalah pemilik komentar atau Admin
      const isOwnerOrAdmin = currentUser && 
          (currentUser._id === comment.userId || currentUser.role === 'admin');
          
      // Gunakan comment.comment (isi) dan comment.username (dari backend)
      return `
        <div class="comment-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <strong style="color: #2c3e50;">${comment.username || 'Anonymous'}</strong>
          <span style="font-size: 0.8rem; color: #95a5a6; margin-left: 10px;">- ${date} ${time}</span>
          <p style="margin-top: 5px;">${comment.comment}</p>
          ${isOwnerOrAdmin ? `
            <button 
              onclick="deleteComment('${comment._id}', '${courseId}')" 
              style="font-size: 0.75rem; color: #e74c3c; background: none; border: none; cursor: pointer; padding: 0;"
            >
              [Hapus]
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<p class="text-red-500">Gagal memuat komentar.</p>';
  }
}

// Function to submit a new comment (Perbaikan Properti: ganti 'text' jadi 'comment')
async function submitComment(courseId) {
  const input = document.getElementById('commentInput');
  const commentText = input.value.trim(); // Simpan isi komentar
  const token = getToken();

  if (!token) {
    alert('Anda harus login untuk berkomentar.');
    return;
  }
  
  if (!commentText) {
    alert('Komentar tidak boleh kosong.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // FIX: Mengirim 'comment' bukan 'text'
        body: JSON.stringify({ courseId, comment: commentText }) 
    });
    
    // ... (logic status 401) ...
    
    if (!response.ok) {
        throw new Error('Failed to post comment');
    }

    input.value = '';
    loadComments(courseId); // Muat ulang komentar setelah berhasil
  } catch (error) {
    console.error('Error submitting comment:', error);
  }
}

// Function baru untuk menghapus komentar
async function deleteComment(commentId, courseId) {
  if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
    return;
  }
  
  const token = getToken();
  if (!token) {
    alert('Anda harus login untuk menghapus komentar.');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (response.status === 403) {
      alert('Anda tidak berhak menghapus komentar ini.');
      return;
    }
    
    if (!response.ok) {
        throw new Error('Failed to delete comment');
    }

    alert('Komentar berhasil dihapus!');
    loadComments(courseId); // Muat ulang komentar setelah berhasil
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Gagal menghapus komentar.');
  }
}

// Show badge modal
function showBadgeModal(badge) {
  const modal = document.getElementById('badgeModal');
  const content = document.getElementById('badgeContent');
  
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };
  
  content.innerHTML = `
    <div style="font-size: 5rem; margin: 20px 0;">${icons[badge.badgeType]}</div>
    <h3>${badge.badgeName}</h3>
    <p>${badge.courseName}</p>
  `;
  
  modal.style.display = 'block';
}

function closeBadgeModal() {
  document.getElementById('badgeModal').style.display = 'none';
}


// Close modal
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('courseModal').style.display = 'none';
});

window.onclick = (event) => {
  const modal = document.getElementById('courseModal');
  if (event.target == modal) {
    modal.style.display = "none";
  }
};


// Initial calls
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  fetchCourses();
});