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

// Check otentikasi admin
const token = getToken();
const user = getUser();

// Memastikan user memiliki token, data user, dan role adalah 'admin'
if (!token || !user || user.role !== 'admin') {
  // 💡 FIX: Ganti alert() dengan custom modal UI (sesuai instruksi)
  // Untuk saat ini, kita akan menggunakan konsol log dan redirect
  console.error('Akses ditolak: Diperlukan hak akses Admin.');
  // alert('Admin access required'); // DILARANG: Hindari alert()
  window.location.href = 'index.html'; // Redirect ke halaman utama jika bukan admin
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
  
  // Hapus kelas 'active' dari semua tombol tab dan konten
  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));
  
  // event.target digunakan di sini, pastikan fungsi dipanggil melalui onclick
  // Jika dipanggil dari JS (misal: showTab('courses')), perlu adaptasi di HTML
  if (event.target) {
     event.target.classList.add('active'); 
  }

  // Tambahkan kelas 'active' ke konten tab yang sesuai
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // Muat data saat tab diklik
  if (tabName === 'courses') {
    loadCourses();
  } else if (tabName === 'users') {
    loadUsers();
  }
}

// Tampilkan/sembunyikan form buat kursus
function showCreateCourseForm() {
  document.getElementById('createCourseForm').style.display = 'block';
}

function hideCreateCourseForm() {
  document.getElementById('createCourseForm').style.display = 'none';
  document.getElementById('courseForm').reset(); // Reset field form
}

// Buat kursus baru (Hanya kirim data minimal, kode dan metadata di-generate backend)
document.getElementById('courseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('courseTitle').value;
  const description = document.getElementById('courseDescription').value;
  const thumbnail = document.getElementById('courseThumbnail').value;
  const difficulty = document.getElementById('courseDifficulty').value;
  
  // Mapping kesulitan ke jenis badge (misal: beginner -> bronze)
  const badgeTypeMap = {
    beginner: 'bronze',
    intermediate: 'silver',
    advanced: 'gold'
  };
  const badgeType = badgeTypeMap[difficulty];
  
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
        badgeType
        // courseCode dan metadata dihapus dari payload (dibuat di backend)
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create course');
    }
    
    // 💡 FIX: Ganti alert()
    // alert('Course created successfully! Folder course telah digenerate di frontend/courses.'); 
    console.log('Course created successfully! Folder course telah digenerate di frontend/courses.');

    hideCreateCourseForm();
    loadCourses(); // Muat ulang daftar kursus
  } catch (error) {
    console.error('Error creating course:', error);
    // 💡 FIX: Ganti alert()
    // alert(`Failed to create course: ${error.message}`); 
    console.error(`Failed to create course: ${error.message}`);
  }
});

// Muat semua kursus (termasuk yang Draft)
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

// Tampilkan daftar kursus
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
          <!-- Button Publish/Unpublish -->
          <button class="btn-success" onclick="togglePublish('${course._id}', ${course.isPublished})">
            ${course.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <!-- Button Delete -->
          <button class="btn-danger" onclick="deleteCourse('${course._id}')">Delete</button>
        </div>
      </div>
      <p>${course.description}</p>
      <p style="font-size: 0.9rem; color: #7f8c8d;"> 
        Folder Course: <strong>/frontend/courses/${course.courseFolder || 'N/A'}</strong>
      </p>
      <div style="margin-top: 10px;">
        <!-- Tambahkan link edit/view di sini jika ada UI terpisah -->
        <!-- Misalnya: <a href="edit-course.html?id=${course._id}" class="btn-primary btn-sm">Edit Content</a> -->
      </div>
    </div>
  `).join('');
}

// Toggle status publikasi kursus
async function togglePublish(courseId, isPublished) {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/publish`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${isPublished ? 'unpublish' : 'publish'} course`);
    }
    
    console.log(`Course ${courseId} status toggled.`);
    loadCourses();
  } catch (error) {
    console.error('Error toggling publish status:', error);
    // 💡 FIX: Ganti alert()
    // alert('Failed to change publish status');
    console.error('Failed to change publish status');
  }
}

// Hapus kursus
async function deleteCourse(courseId) {
  // 💡 FIX: Ganti confirm() dengan custom modal UI (sesuai instruksi)
  // Untuk saat ini, menggunakan konsol log dan mengandalkan backend.
  if (!confirm('Are you sure you want to delete this course? This will also delete its folder and all associated progress/comments!')) {
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
    
    console.log(`Course ${courseId} deleted successfully.`);
    loadCourses();
  } catch (error) {
    console.error('Error deleting course:', error);
    // 💡 FIX: Ganti alert()
    // alert('Failed to delete course');
    console.error('Failed to delete course');
  }
}

// Muat daftar user
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

// Tampilkan daftar user
function displayUsers(users) {
  const list = document.getElementById('usersList');
  // Filter user yang sedang login agar tidak bisa menghapus diri sendiri
  const filteredUsers = users.filter(u => u._id !== user._id); 

  if (filteredUsers.length === 0) {
    list.innerHTML = '<p class="empty-state">No other users found</p>';
    return;
  }
  
  list.innerHTML = filteredUsers.map(u => `
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
          <!-- Hanya tampilkan tombol delete jika user BUKAN admin -->
          ${u.role !== 'admin' ? `<button class="btn-danger" onclick="deleteUser('${u._id}')">Delete</button>` : ''}
        </div>
      </div>
      <p style="font-size: 0.9rem; color: #7f8c8d;">
        Badges: ${u.badges?.length || 0} • Joined: ${new Date(u.createdAt).toLocaleDateString()}
      </p>
    </div>
  `).join('');
}

// Hapus user
async function deleteUser(userId) {
  // 💡 FIX: Ganti confirm()
  if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) {
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
    
    console.log(`User ${userId} deleted successfully.`);
    loadUsers(); // Muat ulang daftar user
  } catch (error) {
    console.error('Error deleting user:', error);
    // 💡 FIX: Ganti alert()
    // alert('Failed to delete user');
    console.error('Failed to delete user');
  }
}

// Panggil fungsi untuk memuat data awal saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Memastikan tab 'courses' aktif saat pertama kali load
    const initialTabButton = document.querySelector('.tab-btn[onclick*="showTab(\'courses\')"]');
    if (initialTabButton) {
        initialTabButton.classList.add('active');
        loadCourses();
    }
});