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
  try {
    const response = await fetch(`${API_URL}/courses`);
    const courses = await response.json();
    
    const token = getToken();
    let userProgress = [];
    
    if (token) {
      const progressRes = await fetch(`${API_URL}/progress/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (progressRes.ok) {
        userProgress = await progressRes.json();
      }
    }
    
    displayCourses(courses, userProgress);
  } catch (error) {
    console.error('Error loading courses:', error);
    document.getElementById('coursesGrid').innerHTML = '<p class="empty-state">Failed to load courses</p>';
  }
}

// Display courses
function displayCourses(courses, userProgress) {
  const grid = document.getElementById('coursesGrid');
  
  if (courses.length === 0) {
    grid.innerHTML = '<p class="empty-state">No courses available yet</p>';
    return;
  }
  
  grid.innerHTML = courses.map(course => {
    const progress = userProgress.find(p => p.courseId._id === course._id);
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

// Open course detail modal
async function openCourseDetail(courseId) {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}`);
    const course = await response.json();
    
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
          // Start progress if not exists
          const startRes = await fetch(`${API_URL}/progress/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
          });
          progress = await startRes.json();
        }
      } catch (err) {
        console.error('Progress error:', err);
      }
    }
    
    displayCourseDetail(course, progress);
    document.getElementById('courseModal').style.display = 'block';
  } catch (error) {
    console.error('Error loading course:', error);
    alert('Failed to load course details');
  }
}

// Display course detail - Render as iframe
function displayCourseDetail(course, progress) {
  const detail = document.getElementById('courseDetail');
  const token = getToken();
  
  // Create full HTML document for iframe
  const courseHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${course.courseCode.css}</style>
    </head>
    <body>
      ${course.courseCode.html}
      <script>
        // API functions available to course
        const courseAPI = {
          markSectionComplete: function(sectionId) {
            window.parent.postMessage({
              type: 'SECTION_COMPLETE',
              sectionId: sectionId
            }, '*');
          },
          submitQuiz: function(quizId, score) {
            window.parent.postMessage({
              type: 'QUIZ_SUBMIT',
              quizId: quizId,
              score: score
            }, '*');
          },
          getProgress: function() {
            return ${JSON.stringify(progress)};
          }
        };
        
        // Course's custom JavaScript
        ${course.courseCode.js}
      <\/script>
    </body>
    </html>
  `;
  
  detail.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2>${course.title}</h2>
        <p>${course.description}</p>
        <span class="difficulty-badge difficulty-${course.difficulty}">${course.difficulty}</span>
      </div>
      ${progress ? `
        <div style="text-align: right;">
          <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${progress.progressPercentage}%</div>
          <div style="font-size: 0.9rem; color: #7f8c8d;">Progress</div>
        </div>
      ` : ''}
    </div>
    
    ${!token ? '<p style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">⚠️ Login to track your progress and earn badges!</p>' : ''}
    
    <iframe 
      id="courseFrame" 
      style="width: 100%; height: 600px; border: 1px solid #ecf0f1; border-radius: 8px;"
      sandbox="allow-scripts allow-same-origin"
      srcdoc="${courseHTML.replace(/"/g, '&quot;')}"
    ></iframe>
  `;
  
  // Listen for messages from iframe
  window.currentCourseId = course._id;
}

// Listen for messages from course iframe
window.addEventListener('message', async (event) => {
  const { type, sectionId, quizId, score } = event.data;
  
  const token = getToken();
  if (!token) {
    alert('Please login first');
    return;
  }
  
  if (type === 'SECTION_COMPLETE') {
    try {
      const response = await fetch(`${API_URL}/progress/section`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          courseId: window.currentCourseId, 
          sectionId 
        })
      });
      
      const data = await response.json();
      
      if (data.badgeEarned) {
        showBadgeModal(data.badgeEarned);
      }
      
      // Refresh course detail to show updated progress
      openCourseDetail(window.currentCourseId);
    } catch (error) {
      console.error('Error marking section:', error);
    }
  } else if (type === 'QUIZ_SUBMIT') {
    try {
      const response = await fetch(`${API_URL}/progress/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: window.currentCourseId,
          quizId,
          score
        })
      });
      
      const data = await response.json();
      
      alert(`Quiz Result:\nScore: ${data.score}%\nStatus: ${data.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
      
      if (data.badgeEarned) {
        showBadgeModal(data.badgeEarned);
      }
      
      // Refresh course detail
      openCourseDetail(window.currentCourseId);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }
});

// Remove old quiz/section functions (not needed anymore)
// Course app handles its own UI and logic

// Load comments
async function loadComments(courseId) {
  // Comments moved to separate tab if needed
  // For now, courses handle their own comments internally
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
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// Initialize
updateNavbar();
loadCourses();