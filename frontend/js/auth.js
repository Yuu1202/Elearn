const API_URL = 'http://localhost:5000/api';

// Toggle between login and register forms
function toggleForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authTitle');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    title.textContent = 'Login';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    title.textContent = 'Register';
  }
  
  // Clear message
  document.getElementById('authMessage').style.display = 'none';
}

// Show message
function showMessage(message, type) {
  const msgDiv = document.getElementById('authMessage');
  msgDiv.textContent = message;
  msgDiv.className = `message ${type}`;
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save token and user
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showMessage('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Save token and user
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showMessage('Registration successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

// Check if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'index.html';
}