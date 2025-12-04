const API_URL = 'http://localhost:5000/api'; // URL dasar untuk API backend

// Fungsi untuk mendapatkan token JWT dari localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Fungsi untuk mendapatkan data user (termasuk role) dari localStorage
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Check otentikasi
const token = getToken();
if (!token) {
  window.location.href = 'login.html'; // Redirect ke halaman login jika tidak ada token
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Tampilkan link admin jika user memiliki role 'admin'
const user = getUser();
if (user && user.role === 'admin') {
  const adminLink = document.getElementById('adminLink');
  if (adminLink) {
    adminLink.style.display = 'block';
  }
}

// Muat data profil user
async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` } // Menggunakan token untuk otentikasi
    });
    
    const data = await response.json();
    const currentUser = data.user;
    
    // Tampilkan data dasar user
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    displayBadges(currentUser.badges); // Tampilkan daftar badges
    loadProgress(); // Muat progres kursus
  } catch (error) {
    console.error('Error loading profile:', error);
    // Jika gagal, mungkin token kadaluwarsa, redirect ke login
    if (error.message.includes('Unauthorized')) {
        window.location.href = 'login.html';
    }
  }
}

// Tampilkan daftar badges yang sudah didapatkan
function displayBadges(badges) {
  const grid = document.getElementById('badgesGrid');
  
  if (!badges || badges.length === 0) {
    grid.innerHTML = '<p class="empty-state">No badges earned yet. Complete courses to earn badges!</p>';
    return;
  }
  
  // Mapping jenis badge ke ikon emoji
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };
  
  grid.innerHTML = badges.map(badge => `
    <div class="badge-card">
      <div class="badge-icon badge-${badge.badgeType}">${icons[badge.badgeType] || '⭐'}</div>
      <h4>${badge.badgeName}</h4>
      <p>${badge.courseName}</p>
      <p style="font-size: 0.85rem; color: #7f8c8d;"> 
        Earned: ${new Date(badge.earnedAt).toLocaleDateString()}
      </p>
    </div>
  `).join('');
}

// Muat progres kursus user
async function loadProgress() {
  try {
    // Endpoint ini akan melakukan 'populate' (join) data kursus ke progres
    const response = await fetch(`${API_URL}/progress/user`, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const progress = await response.json();
    displayProgress(progress);
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

// Tampilkan daftar progres kursus
function displayProgress(progress) {
  const list = document.getElementById('progressList');
  
  if (!progress || progress.length === 0) {
    list.innerHTML = '<p class="empty-state">No courses started yet. <a href="index.html">Browse courses</a></p>';
    return;
  }
  
  list.innerHTML = progress.map(p => {
    const course = p.courseId; // Data kursus sudah di-populate dari backend
    // Ambil metadata dari kursus (digunakan untuk menampilkan detail)
    const totalSections = course.metadata?.totalSections || 0;
    const totalQuizzes = course.metadata?.totalQuizzes || 0;
    
    return `
      <div class="progress-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3>${course.title}</h3>
            <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
          </div>
          <div style="text-align: right;">
            <!-- Persentase Progres -->
            <h2 style="color: #3498db;">${p.progressPercentage}%</h2>
            <!-- Status Selesai/Dalam Proses -->
            ${p.isCompleted ? '<p style="color: #2ecc71; font-weight: bold;">✅ Completed</p>' : '<p style="color: #f39c12;">🔄 In Progress</p>'}
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-bar-container" style="margin-top: 15px;">
          <div class="progress-bar" style="width: ${p.progressPercentage}%"></div>
        </div>
        
        <!-- Detail Progress -->
        <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 0.9rem; color: #7f8c8d;">
          <span>Sections Completed: ${p.completedSections.length || 0} / ${totalSections}</span>
          <span>Quizzes Passed: ${p.quizResults?.filter(r => r.isPassed).length || 0} / ${totalQuizzes}</span>
        </div>
        
        <a href="course-view.html?slug=${course.courseFolder}" class="btn-sm btn-primary" style="margin-top: 15px; display: inline-block;">
            Continue Learning
        </a>
      </div>
    `;
  }).join('');
}

// Panggil fungsi utama saat dokumen siap
document.addEventListener('DOMContentLoaded', loadProfile);