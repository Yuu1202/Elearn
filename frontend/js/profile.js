const API_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Check auth
const token = getToken();
if (!token) {
  window.location.href = 'login.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Show admin link if admin
const user = getUser();
if (user && user.role === 'admin') {
  document.getElementById('adminLink').style.display = 'block';
}

// Load profile
async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    const currentUser = data.user;
    
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    displayBadges(currentUser.badges);
    loadProgress();
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Display badges
function displayBadges(badges) {
  const grid = document.getElementById('badgesGrid');
  
  if (!badges || badges.length === 0) {
    grid.innerHTML = '<p class="empty-state">No badges earned yet. Complete courses to earn badges!</p>';
    return;
  }
  
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };
  
  grid.innerHTML = badges.map(badge => `
    <div class="badge-card">
      <div class="badge-icon badge-${badge.badgeType}">${icons[badge.badgeType]}</div>
      <h4>${badge.badgeName}</h4>
      <p>${badge.courseName}</p>
      <p style="font-size: 0.85rem; color: #7f8c8d;">
        ${new Date(badge.earnedAt).toLocaleDateString()}
      </p>
    </div>
  `).join('');
}

// Load progress
async function loadProgress() {
  try {
    const response = await fetch(`${API_URL}/progress/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const progress = await response.json();
    displayProgress(progress);
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

// Display progress
function displayProgress(progress) {
  const list = document.getElementById('progressList');
  
  if (progress.length === 0) {
    list.innerHTML = '<p class="empty-state">No courses started yet. <a href="index.html">Browse courses</a></p>';
    return;
  }
  
  list.innerHTML = progress.map(p => {
    const course = p.courseId;
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
            <h2 style="color: #3498db;">${p.progressPercentage}%</h2>
            ${p.isCompleted ? '<p style="color: #2ecc71; font-weight: bold;">✅ Completed</p>' : '<p style="color: #f39c12;">🔄 In Progress</p>'}
          </div>
        </div>
        <div class="progress-bar-container" style="margin-top: 15px;">
          <div class="progress-bar" style="width: ${p.progressPercentage}%"></div>
        </div>
        <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 0.9rem; color: #7f8c8d;">
          <span>Sections: ${p.completedSections.length} / ${totalSections}</span>
          <span>Quizzes: ${p.quizResults.filter(q => q.passed).length} / ${totalQuizzes} passed</span>
        </div>
      </div>
    `;
  }).join('');
}

// Initialize
loadProfile();