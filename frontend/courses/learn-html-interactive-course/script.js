const API_URL = 'http://localhost:5000/api';

// --- Helper Functions (untuk simulasi interaktif Duolingo-style) ---

/**
 * Memeriksa jawaban sederhana untuk Section 1.
 * @param {string} inputId ID dari elemen input
 * @param {string} correctAnswer Jawaban yang benar
 * @param {string} feedbackId ID dari elemen feedback
 */
function checkAnswer(inputId, correctAnswer, feedbackId) {
    const inputElement = document.getElementById(inputId);
    const feedbackElement = document.getElementById(feedbackId);
    
    if (!inputElement || !feedbackElement) return;

    const userAnswer = inputElement.value.toLowerCase().trim().replace(/<|>/g, '');
    
    if (userAnswer === correctAnswer.toLowerCase()) {
        feedbackElement.textContent = 'Benar! Tag untuk paragraf adalah <p>. Lanjutkan!';
        feedbackElement.style.color = 'green';
    } else {
        feedbackElement.textContent = 'Coba lagi. Ingat, tag untuk paragraf hanya satu huruf.';
        feedbackElement.style.color = 'red';
    }
}


// --- Logic Utama Course ---

/**
 * Memperbarui tampilan progres bar dan teks.
 */
function updateProgressDisplay() {
    const totalItems = COURSE_SECTIONS.length + COURSE_QUIZZES.length;
    let completedItems = 0;

    // Hitung Section yang selesai
    COURSE_SECTIONS.forEach((id, index) => {
        const statusElement = document.getElementById(`status_${id}`);
        const sectionElement = document.getElementById(id);
        const nextSectionId = COURSE_SECTIONS[index + 1] || COURSE_QUIZZES[0];
        const nextElement = document.getElementById(nextSectionId);

        if (localStorage.getItem(`${COURSE_ID}_${id}_completed`) === 'true') {
            completedItems++;
            if (statusElement) {
                statusElement.textContent = 'Status: Selesai ✅';
                statusElement.classList.add('completed');
            }
            // Aktifkan bagian/quiz berikutnya
            if (nextElement) {
                nextElement.classList.remove('disabled');
                nextElement.removeAttribute('disabled');
            }
        } else {
             // Pastikan hanya Section 1 yang aktif di awal
            if (id !== 'section_1' && sectionElement) {
                sectionElement.classList.add('disabled');
                sectionElement.setAttribute('disabled', 'true');
            }
            if (statusElement) {
                statusElement.textContent = 'Status: Belum Selesai';
                statusElement.classList.remove('completed');
            }
        }
    });

    // Hitung Quiz yang selesai
    COURSE_QUIZZES.forEach(id => {
        if (localStorage.getItem(`${COURSE_ID}_${id}_completed`) === 'true') {
            completedItems++;
            const resultElement = document.getElementById('quiz-result');
            if(resultElement) {
                 resultElement.textContent = 'Quiz Selesai! Skor: 100%.';
                 resultElement.style.backgroundColor = '#d4edda'; // Bootstrap success background
                 resultElement.style.color = '#155724'; // Bootstrap success color
            }
        }
    });

    // Hitung dan perbarui progress bar
    const progress = (completedItems / totalItems) * 100;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
        progressText.textContent = `Progress: ${Math.round(progress)}% Complete (${completedItems} dari ${totalItems} item)`;
    }
}

/**
 * Menandai sebuah section sebagai selesai.
 * @param {string} sectionId ID Section yang diselesaikan.
 */
function markComplete(sectionId) {
    localStorage.setItem(`${COURSE_ID}_${sectionId}_completed`, 'true');
    updateProgressDisplay();

    // Kirim status ke backend (simulasi)
    fetch(`${API_URL}/complete-section`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: COURSE_ID, sectionId: sectionId }),
    })
    .then(response => {
        if (!response.ok) {
            console.warn('Backend completion update failed (simulated).');
        }
        // Tampilkan notifikasi
        alert(`Bagian ${sectionId} Selesai! Bagian berikutnya sekarang aktif.`);
    })
    .catch(error => {
        console.error('Error during fetch:', error);
    });
}

/**
 * Menghitung skor Quiz.
 * Logika ini disesuaikan dengan pertanyaan Q1 di index.html dan kunci di QUIZ_ANSWERS.
 * @returns {number} Skor quiz (0 atau 100).
 */
function calculateQuizScore() {
    let score = 0;
    const form = document.getElementById('quiz-form');
    if (!form) return 0;

    // Validasi Q1
    const q1Answer = form.elements['q1'] ? form.elements['q1'].value : null;

    // QUIZ_ANSWERS = {'q1': 'body'}
    if (q1Answer === QUIZ_ANSWERS['q1']) {
        score = 100; // Karena hanya ada 1 pertanyaan
    }
    return score;
}

/**
 * Mengirimkan quiz dan menampilkan hasil.
 */
function submitCourseQuiz() {
    const score = calculateQuizScore();
    const resultElement = document.getElementById('quiz-result');
    const quizId = 'quiz_1';

    if (score === 100) {
        resultElement.textContent = `SELAMAT! Anda LULUS dengan skor ${score}%.`;
        resultElement.style.backgroundColor = '#d4edda'; // Success
        resultElement.style.color = '#155724';
        
        // Tandai quiz selesai di localStorage
        localStorage.setItem(`${COURSE_ID}_${quizId}_completed`, 'true');

        // Kirim status ke backend (simulasi)
        fetch(`${API_URL}/complete-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseId: COURSE_ID, quizId: quizId, score: score }),
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Backend quiz submission failed (simulated).');
            }
        })
        .catch(error => {
            console.error('Error during fetch:', error);
        });
    } else {
        resultElement.textContent = `Anda mendapatkan skor ${score}%. Silakan ulangi materi atau coba lagi!`;
        resultElement.style.backgroundColor = '#f8d7da'; // Danger/Fail
        resultElement.style.color = '#721c24';
    }

    updateProgressDisplay();
}

// Inisialisasi: Panggil saat halaman dimuat
document.addEventListener('DOMContentLoaded', updateProgressDisplay);