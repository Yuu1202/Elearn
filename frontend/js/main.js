const API_URL = 'http://localhost:5000/api';

// Get token and user from localStorage
function getToken() {
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
  window.location.href = 'login.html';
});

// Load courses 
async function loadCourses() {
  let courses;
  let userProgress = [];

  try {
    // 1. AMBIL DAFTAR KURSUS UTAMA
    const response = await fetch(`${API_URL}/courses`);
    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
    }
    courses = await response.json();
    
    const token = getToken();

    // 2. AMBIL PROGRESS PENGGUNA (Diisolasi dari kegagalan otentikasi)
    if (token) {
      const progressRes = await fetch(`${API_URL}/progress/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (progressRes.ok) {
        userProgress = await progressRes.json();
      } else if (progressRes.status === 401) {
        console.warn('Token expired or invalid. Logging out silently.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateNavbar();
      } else {
        console.warn(`Could not load user progress: ${progressRes.statusText}. Continuing without progress data.`);
      }
    }
    
    // 3. TAMPILKAN KURSUS
    displayCourses(courses, userProgress);
  } catch (error) {
    console.error('CRITICAL Error loading courses list:', error);
    document.getElementById('coursesGrid').innerHTML = '<p class="empty-state">Failed to load courses. Please check API server status.</p>';
  }
}

// Display courses - PERBAIKAN DI SINI! Menambahkan p.courseId &&
function displayCourses(courses, userProgress) {
  const grid = document.getElementById('coursesGrid');
  
  if (courses.length === 0) {
    grid.innerHTML = '<p class="empty-state">No courses available yet</p>';
    return;
  }
  
  grid.innerHTML = courses.map(course => {
    // FIX: Pastikan p.courseId tidak null (karena course mungkin sudah dihapus)
    const progress = userProgress.find(p => p.courseId && p.courseId._id === course._id);
    const progressPercent = progress ? progress.progressPercentage : 0;
    const isCompleted = progress ? progress.isCompleted : false;
    
    return `
      <div class="course-card" onclick="openCourseDetail('${course._id}')">
        <img src="${course.thumbnail}" alt="${course.title}">
        <div class="course-card-body">
          <h3>${course.title}</h3>
          <p>${course.description}</p>
          <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
          ${progressPercent > 0 ? `
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <p style="font-size: 0.9rem; color: #7f8c8d; margin-top: 5px;">${progressPercent}% Complete</p>
          ` : ''}
          ${isCompleted ? '<p class="badge-earned">✅ Badge Earned!</p>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Open course detail modal (popup with detail + comments)
async function openCourseDetail(courseId) {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}`);
    const course = await response.json(); // Course object contains 'courseFolder'

    if (!course.courseFolder) {
        throw new Error('Course folder path not found');
    }
    
    const token = getToken();
    let progress = null;
    
    if (token) {
      try {
        const progressRes = await fetch(`${API_URL}/progress/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (progressRes.ok) {
          progress = await progressRes.json();
        } else {
          // Jika progress belum dimulai atau token invalid, kita coba ambil progress awal
          const startRes = await fetch(`${API_URL}/progress/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId }) 
          });
          if (startRes.ok) {
            progress = await startRes.json();
          } else if (startRes.status === 401) {
            console.warn('Token expired or invalid during progress check. Please log in again.');
            // Biarkan progress=null, modal akan menampilkan "Login to Start"
          }
        }
      } catch (err) {
        console.error('Progress error:', err);
      }
    }
    
    displayCourseDetail(course, progress);
    document.getElementById('courseModal').style.display = 'block';
  } catch (error) {
    console.error('Error loading course:', error);
    alert('Failed to load course details. Make sure course folder is generated and API is running.');
  }
}

// Display course detail in popup
function displayCourseDetail(course, progress) {
  const detail = document.getElementById('courseDetail');
  const token = getToken();
  
  // URL untuk tombol "Mulai"
  const coursePath = `/courses/${course.courseFolder}/index.html`;

  detail.innerHTML = `
    <div style="display: flex; gap: 30px;">
      <div style="flex: 1;">
        <img src="${course.thumbnail}" alt="${course.title}" style="width: 100%; border-radius: 10px; margin-bottom: 20px;">
        <h2>${course.title}</h2>
        <p style="color: #7f8c8d; margin: 15px 0;">${course.description}</p>
        <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
        
        ${progress ? `
          <div style="margin: 20px 0;">
            <h4>Your Progress</h4>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${progress.progressPercentage}%"></div>
            </div>
            <p style="margin-top: 10px;">${progress.progressPercentage}% Complete</p>
          </div>
        ` : ''}
        
        ${token ? `
          <button onclick="startCourse('${coursePath}')" class="btn-primary" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem;">
            ${progress && progress.progressPercentage > 0 ? '▶️ Continue Learning' : '🚀 Start Learning'}
          </button>
        ` : `
          <a href="login.html" class="btn-primary" style="display: block; text-align: center; width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem; text-decoration: none;">
            🔒 Login to Start
          </a>
        `}
      </div>
      
      <div style="flex: 1;">
        <h3>💬 Comments</h3>
        <div id="commentsList" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
          </div>
        
        ${token ? `
          <div class="comment-form">
            <textarea id="commentInput" placeholder="Write your comment..." style="width: 100%; min-height: 80px;"></textarea>
            <button onclick="submitComment('${course._id}')" style="margin-top: 10px;">Post Comment</button>
          </div>
        ` : '<p style="text-align: center; color: #7f8c8d;">Login to comment</p>'}
      </div>
    </div>
  `;
  
  loadComments(course._id);
}

// Start course - Arahkan ke path course independen
function startCourse(coursePath) {
  // Buka halaman course independen di window yang sama
  window.location.href = coursePath;
}

// Load comments
async function loadComments(courseId) {
  try {
    const response = await fetch(`${API_URL}/comments/${courseId}`);
    const comments = await response.json();
    
    const list = document.getElementById('commentsList');
    
    if (comments.length === 0) {
      list.innerHTML = '<p class="empty-state">No comments yet. Be the first to comment!</p>';
      return;
    }
    
    list.innerHTML = comments.map(comment => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${comment.username || 'Anonymous'}</span>
          <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <p>${comment.comment}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<p class="empty-state">Failed to load comments.</p>';
  }
}

// Submit comment
async function submitComment(courseId) {
  const token = getToken();
  const input = document.getElementById('commentInput');
  const comment = input.value.trim();
  
  if (!token) {
    alert('Please log in to comment.');
    return;
  }

  if (!comment) {
    alert('Please write a comment');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ courseId, comment })
    });

    if (response.status === 401) {
       alert('Session expired. Please log in again.');
       return;
    }
    
    if (!response.ok) {
        throw new Error('Failed to post comment');
    }

    input.value = '';
    loadComments(courseId);
  } catch (error) {
    console.error('Error submitting comment:', error);
    alert('Failed to post comment');
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

window.onclick = function(event) {
  const modal = document.getElementById('courseModal');
  const badgeModal = document.getElementById('badgeModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
  if (event.target === badgeModal) {
    badgeModal.style.display = 'none';
  }
}

// Initialize
updateNavbar();
loadCourses();