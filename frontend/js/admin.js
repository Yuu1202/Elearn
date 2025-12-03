const API_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Check admin auth
const token = getToken();
const user = getUser();

if (!token || !user || user.role !== 'admin') {
  alert('Admin access required');
  window.location.href = 'index.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Tab switching
function showTab(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  if (tabName === 'courses') {
    loadCourses();
  } else if (tabName === 'users') {
    loadUsers();
  }
}

// Show/hide create course form
function showCreateCourseForm() {
  document.getElementById('createCourseForm').style.display = 'block';
}

function hideCreateCourseForm() {
  document.getElementById('createCourseForm').style.display = 'none';
  document.getElementById('courseForm').reset();
}

// Create course - NEW FORMAT
document.getElementById('courseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('courseTitle').value;
  const description = document.getElementById('courseDescription').value;
  const thumbnail = document.getElementById('courseThumbnail').value;
  const difficulty = document.getElementById('courseDifficulty').value;
  
  // Map difficulty to badge type
  const badgeTypeMap = {
    beginner: 'bronze',
    intermediate: 'silver',
    advanced: 'gold'
  };
  const badgeType = badgeTypeMap[difficulty];
  
  // Get metadata
  const totalSections = parseInt(document.getElementById('totalSections').value);
  const totalQuizzes = parseInt(document.getElementById('totalQuizzes').value);
  const sectionIds = document.getElementById('sectionIds').value.split(',').map(s => s.trim()).filter(Boolean);
  const quizIds = document.getElementById('quizIds').value.split(',').map(s => s.trim()).filter(Boolean);
  
  // Get course code
  const courseCode = {
    html: document.getElementById('courseHTML').value,
    css: document.getElementById('courseCSS').value,
    js: document.getElementById('courseJS').value
  };
  
  try {
    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        thumbnail: thumbnail || 'https://via.placeholder.com/300x200',
        difficulty,
        badgeType,
        courseCode,
        metadata: {
          totalSections,
          totalQuizzes,
          sectionIds,
          quizIds
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create course');
    }
    
    alert('Course created successfully!');
    hideCreateCourseForm();
    loadCourses();
  } catch (error) {
    console.error('Error creating course:', error);
    alert('Failed to create course');
  }
});

// Load courses
async function loadCourses() {
  try {
    const response = await fetch(`${API_URL}/courses/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const courses = await response.json();
    displayCourses(courses);
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Display courses
function displayCourses(courses) {
  const list = document.getElementById('coursesList');
  
  if (courses.length === 0) {
    list.innerHTML = '<p class="empty-state">No courses yet</p>';
    return;
  }
  
  list.innerHTML = courses.map(course => `
    <div class="admin-item">
      <div class="admin-item-header">
        <div>
          <h3>${course.title}</h3>
          <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
          <span style="margin-left: 10px; color: ${course.isPublished ? '#2ecc71' : '#e74c3c'};">
            ${course.isPublished ? '✅ Published' : '❌ Draft'}
          </span>
        </div>
        <div class="admin-item-actions">
          <button class="btn-success" onclick="togglePublish('${course._id}', ${course.isPublished})">
            ${course.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button class="btn-danger" onclick="deleteCourse('${course._id}')">Delete</button>
        </div>
      </div>
      <p>${course.description}</p>
      <p style="font-size: 0.9rem; color: #7f8c8d;">
        ${course.metadata?.totalSections || 0} sections • ${course.metadata?.totalQuizzes || 0} quizzes
      </p>
    </div>
  `).join('');
}

// Toggle publish
async function togglePublish(courseId, isPublished) {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/publish`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to update course');
    }
    
    alert(`Course ${isPublished ? 'unpublished' : 'published'} successfully!`);
    loadCourses();
  } catch (error) {
    console.error('Error toggling publish:', error);
    alert('Failed to update course');
  }
}

// Delete course
async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete course');
    }
    
    alert('Course deleted successfully!');
    loadCourses();
  } catch (error) {
    console.error('Error deleting course:', error);
    alert('Failed to delete course');
  }
}

// Load users
async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const users = await response.json();
    displayUsers(users);
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Display users
function displayUsers(users) {
  const list = document.getElementById('usersList');
  
  if (users.length === 0) {
    list.innerHTML = '<p class="empty-state">No users yet</p>';
    return;
  }
  
  list.innerHTML = users.map(u => `
    <div class="admin-item">
      <div class="admin-item-header">
        <div>
          <h3>${u.username}</h3>
          <p style="color: #7f8c8d;">${u.email}</p>
          <span style="color: ${u.role === 'admin' ? '#e74c3c' : '#3498db'}; font-weight: bold;">
            ${u.role === 'admin' ? '👑 Admin' : '👤 User'}
          </span>
        </div>
        <div class="admin-item-actions">
          ${u.role !== 'admin' ? `<button class="btn-danger" onclick="deleteUser('${u._id}')">Delete</button>` : ''}
        </div>
      </div>
      <p style="font-size: 0.9rem; color: #7f8c8d;">
        Badges: ${u.badges.length} • Joined: ${new Date(u.createdAt).toLocaleDateString()}
      </p>
    </div>
  `).join('');
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    alert('User deleted successfully!');
    loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

// Initialize
loadCourses();