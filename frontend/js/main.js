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

// Fetch all courses and render them
async function fetchCourses() {
  try {
    const response = await fetch(`${API_URL}/courses`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    const courses = await response.json();
    displayCourses(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    document.getElementById('coursesGrid').innerHTML = '<p class="text-red-500">Gagal memuat kursus.</p>';
  }
}

// Display courses on the homepage
function displayCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  grid.innerHTML = courses.map(course => `
    <div class="course-card" onclick="showCourseModal(${JSON.stringify(course).replace(/"/g, '&quot;')})">
      <img src="${course.thumbnail}" alt="${course.title}" class="course-thumbnail">
      <div class="course-info">
        <h3>${course.title}</h3>
        <p class="course-description">${course.description.substring(0, 100)}...</p>
        <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
      </div>
    </div>
  `).join('');
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


// Display course detail in popup (Perbaikan Tombol Start)
function displayCourseDetail(course, progress) {
  const detail = document.getElementById('courseDetail');
  const token = getToken();
  
  // URL untuk tombol "Mulai"
  const coursePath = `/courses/${course.courseFolder}/index.html`;

  // Tentukan progress yang akan ditampilkan. Jika progress null, asumsikan 0%
  const progressPercent = progress ? progress.progressPercentage : 0;
  
  // Tentukan apakah user sudah memulai kursus
  const isStarted = progress && progress.progressPercentage > 0; 

  detail.innerHTML = `
    <div style="display: flex; gap: 30px;">
      <div style="flex: 1;">
        <img src="${course.thumbnail}" alt="${course.title}" style="width: 100%; border-radius: 10px; margin-bottom: 20px;">
        <h2>${course.title}</h2>
        <p style="color: #7f8c8d; margin: 15px 0;">${course.description}</p>
        <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
        
        ${token ? `
          <div style="margin: 20px 0;">
            <h4>Progres Anda</h4>
            <div class="progress-bar-container" style="background: #ecf0f1; height: 10px; border-radius: 5px;">
              <div class="progress-bar" style="width: ${progressPercent}%; height: 100%; background: #2ecc71; border-radius: 5px;"></div>
            </div>
            <p style="margin-top: 10px; font-weight: bold;">${progressPercent}% Selesai</p>
          </div>
        ` : `
          <div style="margin: 20px 0;">
            <p style="color: #e74c3c;">Login untuk melihat dan melacak progres.</p>
          </div>
        `}
        
        ${token ? `
          <!-- FIX KRUSIAL: Memanggil startCourse DENGAN course._id -->
          <button onclick="startCourse('${coursePath}', '${course._id}')" class="btn-primary" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem;">
            ${isStarted ? '▶️ Lanjutkan Belajar' : '🚀 Mulai Belajar'}
          </button>
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

// ... (Sisa fungsi lain seperti loadComments, submitComment, showBadgeModal tetap sama) ...


// Function to load and display comments (Pastikan fungsi ini ada)
async function loadComments(courseId) {
  try {
    const response = await fetch(`${API_URL}/comments/${courseId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch comments');
    }
    const comments = await response.json();
    const commentsList = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #7f8c8d;">Belum ada komentar.</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
      const date = new Date(comment.createdAt).toLocaleDateString();
      const time = new Date(comment.createdAt).toLocaleTimeString();
      return `
        <div class="comment-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <strong style="color: #2c3e50;">${comment.user?.username || 'Anonymous'}</strong>
          <span style="font-size: 0.8rem; color: #95a5a6; margin-left: 10px;">- ${date} ${time}</span>
          <p style="margin-top: 5px;">${comment.text}</p>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<p class="text-red-500">Gagal memuat komentar.</p>';
  }
}

// Function to submit a new comment (Pastikan fungsi ini ada)
async function submitComment(courseId) {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  const token = getToken();

  if (!token) {
    alert('Anda harus login untuk berkomentar.'); // Ganti dengan modal jika ini app
    return;
  }
  
  if (!text) {
    alert('Komentar tidak boleh kosong.'); // Ganti dengan modal jika ini app
    return;
  }

  try {
    const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, text })
    });
    
    if (response.status === 401) {
       // Sebaiknya ganti dengan notifikasi/modal
       console.error('Session expired. Please log in again.');
       return;
    }
    
    if (!response.ok) {
        throw new Error('Failed to post comment');
    }

    input.value = '';
    loadComments(courseId);
  } catch (error) {
    console.error('Error submitting comment:', error);
    // Sebaiknya ganti dengan notifikasi/modal
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