const API_URL = 'http://localhost:5000/api'; // URL dasar untuk API backend

// Toggle antara form login dan register
function toggleForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authTitle');
  
  // Logika tampilan
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    title.textContent = 'Login';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    title.textContent = 'Register';
  }
  
  // Bersihkan pesan error/sukses
  document.getElementById('authMessage').style.display = 'none';
}

// Tampilkan pesan status (sukses/error)
function showMessage(message, type) {
  const msgDiv = document.getElementById('authMessage');
  msgDiv.textContent = message;
  msgDiv.className = `message ${type}`; // Menggunakan kelas CSS untuk styling (misal: 'message success' atau 'message error')
  msgDiv.style.display = 'block';
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
      // Melempar error dengan pesan dari backend jika ada
      throw new Error(data.error || 'Login failed');
    }
    
    // Simpan token dan data user ke localStorage setelah login sukses
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showMessage('Login successful! Redirecting...', 'success');
    
    // Redirect ke halaman utama setelah 1 detik
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    console.error('Login error:', error.message);
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
      // Melempar error dengan pesan dari backend jika ada
      throw new Error(data.error || 'Registration failed');
    }
    
    // Simpan token dan data user ke localStorage setelah register sukses
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showMessage('Registration successful! Redirecting...', 'success');
    
    // Redirect ke halaman utama setelah 1 detik
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    console.error('Registration error:', error.message);
    showMessage(error.message, 'error');
  }
});

// Tentukan form awal yang ditampilkan
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan form login yang tampil duluan
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('authTitle').textContent = 'Login';
    }
});