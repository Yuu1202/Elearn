// Konfigurasi API
const API_URL = 'http://localhost:5000/api';
const TOKEN = localStorage.getItem('token');

// API Course untuk progress tracking
const courseAPI = {
  async markSectionComplete(sectionId) {
    if (!TOKEN) {
      alert('Silakan login untuk melacak progres');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/progress/section`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          courseId: COURSE_ID, 
          sectionId 
        })
      });
      
      const data = await response.json();
      
      if (data.badgeEarned) {
        alert(`🎉 Lencana Diperoleh: ${data.badgeEarned.badgeName}`);
      }
      
      console.log('Section completed:', data);
      await updateProgressDisplay();
      return data;
    } catch (error) {
      console.error('Error marking section:', error);
    }
  },
  
  async submitQuiz(quizId, score) {
    if (!TOKEN) {
      alert('Silakan login untuk menyimpan hasil kuis');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/progress/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: COURSE_ID,
          quizId,
          score
        })
      });
      
      const data = await response.json();
      
      if (data.badgeEarned) {
        alert(`🎉 Lencana Diperoleh: ${data.badgeEarned.badgeName}`);
      }
      
      await updateProgressDisplay();
      return data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  },
  
  async getProgress() {
    if (!TOKEN) return null;
    
    try {
      const response = await fetch(`${API_URL}/progress/course/${COURSE_ID}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }
};

/**
 * Logika Course Client
 */

// Menghitung skor quiz sederhana
function calculateQuizScore() {
  let score = 0;
  
  // Mengambil jawaban dari form
  const q1_answer = document.querySelector('input[name="q1"]:checked')?.value;

  // Membandingkan dengan kunci jawaban
  if (q1_answer === QUIZ_ANSWERS['q1']) {
    score += 1;
  }
  
  return score;
}

// Handler untuk tombol "Tandai Selesai"
async function markComplete(sectionId) {
  const result = await courseAPI.markSectionComplete(sectionId);
  if (result) {
    document.getElementById(`status_${sectionId}`).textContent = '✅ Selesai';
    document.getElementById(`status_${sectionId}`).classList.add('completed');
  }
}

// Handler untuk tombol "Kirim Jawaban Quiz"
async function submitCourseQuiz() {
  const score = calculateQuizScore();
  const quizId = COURSE_QUIZZES[0]; // Hanya ada 1 quiz: quiz_1
  
  const result = await courseAPI.submitQuiz(quizId, score);
  const resultDiv = document.getElementById('quiz-result');

  if (result) {
    resultDiv.innerHTML = `<strong>Hasil Anda: ${score} dari 1.</strong><br>`;
    if (result.isCompleted) {
      resultDiv.innerHTML += 'Kuis ini sudah selesai dan tersimpan.';
    } else {
      resultDiv.innerHTML += 'Gagal menyimpan hasil kuis.';
    }
  } else {
    resultDiv.innerHTML = 'Gagal mengirim hasil kuis.';
  }
}

// Update tampilan progres
async function updateProgressDisplay() {
  const progress = await courseAPI.getProgress();
  const display = document.getElementById('progress-display');
  
  if (!progress) {
    display.textContent = 'Progres: Login diperlukan';
    return;
  }
  
  // Hitung jumlah item (sections + quizzes)
  const totalItems = COURSE_SECTIONS.length + COURSE_QUIZZES.length; 
  
  // Hitung item yang sudah diselesaikan
  const sectionsDone = progress.completedSections.filter(s => COURSE_SECTIONS.includes(s)).length;
  const quizzesDone = progress.completedQuizzes.filter(q => COURSE_QUIZZES.includes(q)).length;
  const itemsDone = sectionsDone + quizzesDone;
  
  const percentage = totalItems > 0 ? Math.round((itemsDone / totalItems) * 100) : 0;
  
  display.textContent = `Progres: ${percentage}% (${itemsDone}/${totalItems} item)`;
  
  // Update status di setiap section
  COURSE_SECTIONS.forEach(sectionId => {
    const statusEl = document.getElementById(`status_${sectionId}`);
    if (statusEl) {
      if (progress.completedSections.includes(sectionId)) {
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

  // Update status Quiz (sederhana)
  const quizResultDiv = document.getElementById('quiz-result');
  const quizId = COURSE_QUIZZES[0];
  if (progress.completedQuizzes.includes(quizId)) {
    quizResultDiv.innerHTML = '<strong>Kuis ini sudah selesai dan tersimpan di riwayat Anda.</strong>';
  }
}

// Inisialisasi: Tampilkan progres saat halaman dimuat
document.addEventListener('DOMContentLoaded', updateProgressDisplay);