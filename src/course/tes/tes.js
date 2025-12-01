// Section navigation
const sectionItems = document.querySelectorAll('.section-item');
const sections = {
    'text': document.getElementById('section-text'),
    'image': document.getElementById('section-image'),
    'video': document.getElementById('section-video'),
    'audio': document.getElementById('section-audio'),
    'combo': document.getElementById('section-combo'),
    'quiz': document.getElementById('section-quiz'),
    'exam': document.getElementById('section-exam')
};

// Navigation buttons
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let currentSectionIndex = 0;
const sectionArray = Array.from(sectionItems);

// Section item click handler
sectionItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        // Remove active-now class from all
        sectionItems.forEach(si => si.classList.remove('active-now'));
        
        // Add active-now to clicked
        item.classList.add('active-now');
        
        currentSectionIndex = index;
        updateNavigationButtons();
        
        // Hide all sections
        Object.values(sections).forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show section based on index (demo purpose)
        if (index === 0) sections.text.classList.remove('hidden');
        else if (index === 1) sections.image.classList.remove('hidden');
        else if (index === 2) sections.video.classList.remove('hidden');
        else if (index === 3) sections.audio.classList.remove('hidden');
        else if (index === 4) sections.combo.classList.remove('hidden');
        else if (index === 5) sections.quiz.classList.remove('hidden');
        else if (index === 6) sections.exam.classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Update navigation buttons state
function updateNavigationButtons() {
    prevBtn.disabled = currentSectionIndex === 0;
    nextBtn.disabled = currentSectionIndex === sectionArray.length - 1;
}

// Previous button
prevBtn.addEventListener('click', () => {
    if (currentSectionIndex > 0) {
        sectionArray[currentSectionIndex - 1].click();
    }
});

// Next button
/*
   [DATABASE: section_progress]
   Saat next diklik, update database:
   
   UPDATE section_progress 
   SET is_completed = 1, completed_at = NOW()
   WHERE user_id = ? AND section_id = ?
   
   Kemudian refresh centang di sidebar
*/
nextBtn.addEventListener('click', () => {
    if (currentSectionIndex < sectionArray.length - 1) {
        // [DATABASE] Simpan progress section saat ini sebagai completed
        markSectionAsCompleted(currentSectionIndex);
        
        sectionArray[currentSectionIndex + 1].click();
    }
});

// Mark section as completed (connect to database)
function markSectionAsCompleted(sectionIndex) {
    /*
       [DATABASE SAVE]
       Contoh dengan AJAX/Fetch:
       
       fetch('save_progress.php', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               user_id: getCurrentUserId(),
               course_id: getCurrentCourseId(),
               section_id: sectionIndex + 1,
               is_completed: 1
           })
       })
       .then(response => response.json())
       .then(data => {
           if(data.success) {
               // Tambahkan class completed dan centang
               sectionArray[sectionIndex].classList.add('completed');
               const checkIcon = sectionArray[sectionIndex].querySelector('.check-icon');
               if(checkIcon) {
                   checkIcon.classList.remove('empty');
                   checkIcon.textContent = '✓';
               }
           }
       });
    */
    
    // Demo: langsung tambahkan class completed
    sectionArray[currentSectionIndex].classList.add('completed');
    const checkIcon = sectionArray[currentSectionIndex].querySelector('.check-icon');
    if(checkIcon && checkIcon.classList.contains('empty')) {
        checkIcon.classList.remove('empty');
        checkIcon.textContent = '✓';
        checkIcon.style.background = '#4caf50';
        checkIcon.style.color = 'white';
        checkIcon.style.border = 'none';
    }
}

// Quiz option selection
const quizOptions = document.querySelectorAll('.quiz-option');
quizOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Remove selected class from all
        quizOptions.forEach(opt => {
            opt.style.borderColor = '#e0e0e0';
            opt.style.background = 'white';
        });
        
        // Add selected to clicked
        this.style.borderColor = '#e91e63';
        this.style.background = '#fff0f5';
    });
});

// Exam option selection
const examOptions = document.querySelectorAll('.exam-option');
examOptions.forEach(option => {
    option.addEventListener('click', function() {
        examOptions.forEach(opt => {
            opt.style.borderColor = '#e0e0e0';
            opt.style.background = 'white';
        });
        
        this.style.borderColor = '#ffa726';
        this.style.background = '#fff8f0';
    });
});

// Exam number navigation
const examNumbers = document.querySelectorAll('.exam-number');
const examPrevBtn = document.querySelector('.exam-nav-btn.prev');
const examNextBtn = document.querySelector('.exam-nav-btn.next');

let currentQuestion = 1;

examNumbers.forEach((num, index) => {
    num.addEventListener('click', () => {
        examNumbers.forEach(n => n.classList.remove('active'));
        num.classList.add('active');
        currentQuestion = index + 1;
        
        // Update question display
        const questionNumber = document.querySelector('.exam-header p');
        if(questionNumber) {
            questionNumber.textContent = `Soal ${currentQuestion} dari 10`;
        }
        
        // Update progress bar
        const progressFill = document.querySelector('.exam-progress-fill');
        if(progressFill) {
            progressFill.style.width = `${currentQuestion * 10}%`;
        }
        
        updateExamNavButtons();
    });
});

examPrevBtn.addEventListener('click', () => {
    if(currentQuestion > 1) {
        examNumbers[currentQuestion - 2].click();
    }
});

examNextBtn.addEventListener('click', () => {
    if(currentQuestion < 10) {
        examNumbers[currentQuestion].click();
    } else {
        // Submit exam
        /*
           [DATABASE SAVE: exam_results]
           
           Hitung score dan simpan ke database:
           
           INSERT INTO exam_results (user_id, course_id, score, total_questions, correct_answers, completed_at)
           VALUES (?, ?, ?, 10, ?, NOW())
           
           Atau jika sudah ada:
           UPDATE exam_results 
           SET score = ?, correct_answers = ?, completed_at = NOW()
           WHERE user_id = ? AND course_id = ?
        */
        alert('Ujian selesai! Hasil akan disimpan ke database.');
    }
});

function updateExamNavButtons() {
    examPrevBtn.disabled = currentQuestion === 1;
    if(currentQuestion === 10) {
        examNextBtn.textContent = 'Selesai';
        examNextBtn.style.background = '#4caf50';
    } else {
        examNextBtn.textContent = 'Selanjutnya →';
        examNextBtn.style.background = '#667eea';
    }
}

// Audio play button
const audioIcons = document.querySelectorAll('.audio-icon');
audioIcons.forEach(icon => {
    icon.addEventListener('click', function() {
        // Toggle play/pause
        if(this.textContent === '▶') {
            this.textContent = '⏸';
            this.style.background = '#7e57c2';
        } else {
            this.textContent = '▶';
            this.style.background = '#9b59b6';
        }
    });
});

// Video play button
const videoPlaceholder = document.querySelector('.video-placeholder');
if(videoPlaceholder) {
    videoPlaceholder.addEventListener('click', () => {
        alert('Video akan diputar (integrasi dengan video player)');
    });
}

// Combo card audio buttons
const listenBtns = document.querySelectorAll('.listen-btn');
listenBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Audio akan diputar');
    });
});

// Initialize
updateNavigationButtons();

/*
   [DATABASE INTEGRATION NOTES]
   
   1. SECTION PROGRESS (Centang di Sidebar)
      Tabel: section_progress
      Kolom: user_id, course_id, section_id, is_completed, completed_at
      
      Load saat halaman dibuka:
      SELECT section_id, is_completed 
      FROM section_progress 
      WHERE user_id = ? AND course_id = ?
      
      Untuk setiap section yang is_completed = 1:
      - Tambahkan class 'completed' pada .section-item
      - Ubah .check-icon dari empty menjadi centang (✓)
      
      Update saat Next diklik:
      UPDATE section_progress 
      SET is_completed = 1, completed_at = NOW()
      WHERE user_id = ? AND section_id = ?
   
   
   2. EXAM RESULTS (Nilai Ujian)
      Tabel: exam_results
      Kolom: result_id, user_id, course_id, score, total_questions, 
             correct_answers, completed_at
      
      Load saat halaman ujian dibuka:
      SELECT score, correct_answers, total_questions, completed_at
      FROM exam_results 
      WHERE user_id = ? AND course_id = ?
      
      Jika ada hasil:
      - Tampilkan score di .exam-score
      - Disable semua option (sudah dikerjakan)
      - Tampilkan badge/notifikasi "Ujian sudah dikerjakan"
      
      Save saat ujian selesai:
      INSERT INTO exam_results 
      (user_id, course_id, score, total_questions, correct_answers, completed_at)
      VALUES (?, ?, ?, 10, ?, NOW())
      
      ON DUPLICATE KEY UPDATE
      score = VALUES(score),
      correct_answers = VALUES(correct_answers),
      completed_at = NOW()
   
   
   3. PROGRESS BAR CALCULATION
      Di header, progress dihitung:
      
      SELECT COUNT(*) as completed 
      FROM section_progress 
      WHERE user_id = ? AND course_id = ? AND is_completed = 1
      
      Total sections bisa hardcode atau dari:
      SELECT COUNT(*) as total FROM course_sections WHERE course_id = ?
      
      Progress = (completed / total) * 100
      
      Update style:
      <div class="progress-fill-header" style="width: <?php echo $progress; ?>%"></div>
   
   
   4. EXAMPLE PHP INTEGRATION
   
   // Load section progress
   $stmt = $pdo->prepare("SELECT section_id, is_completed FROM section_progress 
                          WHERE user_id = ? AND course_id = ?");
   $stmt->execute([$_SESSION['user_id'], $course_id]);
   $progress = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
   
   // Generate sections
   for($i = 1; $i <= 6; $i++) {
       $completed = isset($progress[$i]) && $progress[$i] == 1 ? 'completed' : '';
       $checkIcon = isset($progress[$i]) && $progress[$i] == 1 ? '✓' : '○';
       $checkClass = isset($progress[$i]) && $progress[$i] == 1 ? '' : 'empty';
       
       echo "<div class='section-item $completed'>";
       echo "<span class='check-icon $checkClass'>$checkIcon</span>";
       echo "<span class='section-number'>$i.</span>";
       echo "<span class='section-title'>Section Title</span>";
       echo "</div>";
   }
   
   
   5. SAVE PROGRESS (AJAX)
   
   // save_progress.php
   $data = json_decode(file_get_contents('php://input'), true);
   
   $stmt = $pdo->prepare("INSERT INTO section_progress 
                          (user_id, course_id, section_id, is_completed, completed_at)
                          VALUES (?, ?, ?, 1, NOW())
                          ON DUPLICATE KEY UPDATE 
                          is_completed = 1, completed_at = NOW()");
   
   $result = $stmt->execute([
       $data['user_id'], 
       $data['course_id'], 
       $data['section_id']
   ]);
   
   echo json_encode(['success' => $result]);
   
   
   6. SAVE EXAM RESULTS (AJAX)
   
   // save_exam.php
   $data = json_decode(file_get_contents('php://input'), true);
   
   $stmt = $pdo->prepare("INSERT INTO exam_results 
                          (user_id, course_id, score, total_questions, correct_answers, completed_at)
                          VALUES (?, ?, ?, ?, ?, NOW())
                          ON DUPLICATE KEY UPDATE 
                          score = VALUES(score),
                          correct_answers = VALUES(correct_answers),
                          completed_at = NOW()");
   
   $result = $stmt->execute([
       $data['user_id'],
       $data['course_id'],
       $data['score'],
       $data['total_questions'],
       $data['correct_answers']
   ]);
   
   echo json_encode(['success' => $result, 'score' => $data['score']]);
*/