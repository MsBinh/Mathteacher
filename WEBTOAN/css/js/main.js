// ===== MAIN APPLICATION FILE =====
// Contains all JavaScript logic for the Toán Thầy Bình system

// ===== GLOBAL VARIABLES =====
let examList = [];
let currentExam = null;
let currentQuestions = [];
let db = null;
// auth được khởi tạo trong config.js
let auth = window.auth;
let currentSessionId = null;
let isTeacherLoggedIn = false;
let currentUser = null;
let pollChart = null;
let studentListeners = {};
let sessionCode = '';

// Score system
window.isScoreCalculated = false;
window.studentAnswers = {};
window.correctAnswers = {};

// Student management
let studentCodesMap = new Map();
let inactiveStudents = new Set();

// Modal system
let activeModal = null;

// Scroll tracking
let scrollObserver = null;

// 🎯 BIẾN MỚI: Lưu trữ điểm số tự động
let autoScoreData = {
    tn_correct: 0,      // Số câu TN đúng
    tn_total: 0,        // Tổng số câu TN
    tn_score: 0,        // Điểm phần TN
    tf_correct: 0,      // Số mệnh đề Đúng/Sai đúng
    tf_total: 0,        // Tổng số mệnh đề Đúng/Sai
    tf_score: 0,        // Điểm phần Đúng/Sai
    sa_correct: 0,      // Số câu TLN đúng
    sa_total: 0,        // Tổng số câu TLN
    sa_score: 0,        // Điểm phần TLN
    total_score: 0,     // Tổng điểm
    lastUpdate: null    // Thời gian cập nhật
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Hệ thống Lớp Toán Thầy Bình khởi động (Scroll Mode)...");
    
    if (initializeFirebase()) {
        // Load exam list
        loadExamList();
        
        // Setup all systems
        setupModalSystem();
        setupAuthentication();
        setupSessionManagement();
        setupPollSystem();
        setupStudentInteraction();
        
        // Setup scroll tracking
        setupScrollTracking();
        
        // Setup controls
        setupModalControls();
        setupSlideMenu();
        setupCanvas();
        setupFullscreen();
        
        // Setup class management
        setupClassManagement();
        setupStudentCodeManagement();
        
        // Setup exam selection
        document.getElementById('selectExam').addEventListener('change', handleExamSelection);
        
        // Setup score button
        document.getElementById('scoreBtn').addEventListener('click', function() {
            window.isScoreCalculated = false;
            window.calculateFinalScore();
        });
        
        // URL session parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlSessionCode = urlParams.get('session');
        if (urlSessionCode) {
            sessionCode = urlSessionCode.toUpperCase();
            document.getElementById('monitor-session-code').textContent = sessionCode;
        }
        
        // Show welcome screen
        showWelcomeScreen();
        
        showNotification('✅ Hệ thống đã sẵn sàng! Vui lòng đăng nhập và chọn đề thi.', 'info');
        
        console.log("✅ Hệ thống khởi động thành công với chế độ cuộn");
        
    } else {
        showNotification('❌ Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.', 'error');
    }
});

// ===== FIREBASE INITIALIZATION =====
function initializeFirebase() {
    try {
        // Firebase đã được khởi tạo trong config.js
        db = window.database;
        
        console.log("✅ Firebase initialized successfully");
        
        // Giữ nguyên phần connection status
        db.ref('.info/connected').on('value', snap => {
            const statusElement = document.getElementById('firebaseStatus');
            if (snap.val() === true) {
                statusElement.innerHTML = "✅ Firebase: Đã kết nối";
                statusElement.className = "firebase-status firebase-connected";
            } else {
                statusElement.innerHTML = '<span class="loading-spinner"></span> Firebase: Đang kết nối...';
                statusElement.className = "firebase-status firebase-disconnected";
            }
        });
        
        return true;
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        showNotification('Lỗi khởi tạo Firebase: ' + error.message, 'error');
        return false;
    }
}

// ===== SCROLL TRACKING SYSTEM =====
function setupScrollTracking() {
    // IntersectionObserver to track active section
    scrollObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Remove active from all sections
                    document.querySelectorAll('.slide-section').forEach(section => {
                        section.classList.remove('active-section');
                    });
                    
                    // Add active to current section
                    entry.target.classList.add('active-section');
                    
                    // Update menu
                    updateActiveSlideInMenu(entry.target);
                    
                    // Update scroll progress
                    updateScrollProgress();
                    
                    // Update student progress
                    if (!isTeacherLoggedIn && sessionCode && currentUser) {
                        updateStudentProgressFromScroll(entry.target);
                    }
                }
            });
        },
        {
            root: document.querySelector('.page-container'),
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        }
    );
    
    // Scroll event for progress bar
    const pageContainer = document.querySelector('.page-container');
    if (pageContainer) {
        pageContainer.addEventListener('scroll', updateScrollProgress);
    }
}

function updateScrollProgress() {
    const pageContainer = document.querySelector('.page-container');
    if (!pageContainer) return;
    
    const scrollTop = pageContainer.scrollTop;
    const scrollHeight = pageContainer.scrollHeight - pageContainer.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    
    document.getElementById('scrollProgress').style.width = scrollPercentage + '%';
}

function updateStudentProgressFromScroll(section) {
    if (!sessionCode || !currentUser || isTeacherLoggedIn) return;
    
    const sections = document.querySelectorAll('.slide-section');
    const sectionIndex = Array.from(sections).indexOf(section);
    const totalSections = sections.length;
    const progress = Math.round((sectionIndex / (totalSections - 1)) * 100);
    
    db.ref(`sessions/${sessionCode}/students/${currentUser.uid}`).update({
        currentSlide: sectionIndex, 
        progress, 
        lastActivity: firebase.database.ServerValue.TIMESTAMP
    });
}

// ===== EXAM MANAGEMENT =====
async function loadExamList() {
    try {
        // Đổi tên file từ 12Hk1.json sang matrix_exams.json
        const response = await fetch('matrix_exams.json'); 
        if (!response.ok) {
            // Fallback: thử tải file cũ
            const fallbackResponse = await fetch('12Hk1.json');
            if (!fallbackResponse.ok) throw new Error('Không tìm thấy file đề thi');
            const data = await fallbackResponse.json();
            examList = data.exams;
            showNotification('⚠️ Đang dùng danh sách đề cũ', 'warning');
        } else {
            const data = await response.json();
            examList = data.exams; // Lưu danh sách đề (bao gồm cả đề tĩnh và đề ma trận)
            console.log('✅ Đã tải danh sách đề ma trận:', examList.length, 'đề');
        }
        
        const selectMenu = document.getElementById('selectExam');
        selectMenu.innerHTML = '<option value="">-- Chọn đề --</option>';
        
        examList.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.id;
            option.textContent = exam.name + (exam.type === 'random_matrix' ? ' 🎲' : ' 📄');
            option.title = exam.type === 'random_matrix' ? 'Đề ma trận ngẫu nhiên' : 'Đề tĩnh';
            selectMenu.appendChild(option);
        });

    } catch (error) {
        console.error("❌ Lỗi tải danh sách đề:", error);
        showNotification('Lỗi tải danh sách đề!', 'error');
    }
}
async function handleExamSelection() {
    const selectMenu = document.getElementById('selectExam');
    const selectedId = selectMenu.value;
    
    // Nếu chưa chọn đề, quay về màn hình chào
    if (!selectedId) {
        resetToWelcomeScreen();
        return;
    }

    // Tìm thông tin đề thi trong danh sách đã tải
    currentExam = examList.find(exam => exam.id === selectedId);
    if (!currentExam) return;

    try {
        showNotification(`🎲 Đang khởi tạo đề: ${currentExam.name}...`, 'info');
        let finalQuestions = [];

        // === TRƯỜNG HỢP 1: ĐỀ MA TRẬN CHUẨN BỘ 2025 (12-4-6) ===
        if (currentExam.type === 'moet_matrix_strict' && currentExam.config) {
            let part1_Final = []; // Chứa 12 câu TN (Nhận biết)
            let part2_Final = []; // Chứa 4 câu Đ/S (Thông hiểu)
            let part3_Final = []; // Chứa 6 câu TLN (Vận dụng)

            for (const item of currentExam.config) {
                try {
                    const response = await fetch(item.file);
                    if (!response.ok) throw new Error(`Không thể tải file ${item.file}`);
                    
                    const data = await response.json();
                    
                    // Lấy mảng câu hỏi (xử lý cả trường hợp file chỉ là mảng)
                    const rawQuestions = Array.isArray(data) ? data : (data.questions || []);

                    const questions = rawQuestions.map(q => ({
                        ...q,
                        chapter: data.name || item.file.replace('.json', ''),
                        chapterName: data.name || item.file
                    }));

                    // 1. Lấy theo định mức Phần 1: Trắc nghiệm (TN) - Nhận biết
                    const quotaP1 = item.matrix.p1_nb || 0;
                    if (quotaP1 > 0) {
                        let pool = questions.filter(q => q.type === 'multiple_choice' && q.level === 'nhan_biet');
                        let picked = pool.sort(() => 0.5 - Math.random()).slice(0, quotaP1);
                        part1_Final = part1_Final.concat(picked);
                    }

                    // 2. Lấy theo định mức Phần 2: Đúng/Sai (TF) - Thông hiểu
                    const quotaP2 = item.matrix.p2_th || 0;
                    if (quotaP2 > 0) {
                        let pool = questions.filter(q => q.type === 'true_false' && q.level === 'thong_hieu');
                        let picked = pool.sort(() => 0.5 - Math.random()).slice(0, quotaP2);
                        part2_Final = part2_Final.concat(picked);
                    }

                    // 3. Lấy theo định mức Phần 3: Trả lời ngắn (SA) - Vận dụng
                    const quotaP3 = item.matrix.p3_vd || 0;
                    if (quotaP3 > 0) {
                        let pool = questions.filter(q => q.type === 'short_answer' && (q.level === 'van_dung' || q.level === 'van_dung_cao'));
                        let picked = pool.sort(() => 0.5 - Math.random()).slice(0, quotaP3);
                        part3_Final = part3_Final.concat(picked);
                    }

                } catch (err) {
                    console.error(`❌ Lỗi tải chương ${item.file}:`, err);
                }
            }

            // Trộn nội bộ từng phần
            part1_Final = part1_Final.sort(() => 0.5 - Math.random());
            part2_Final = part2_Final.sort(() => 0.5 - Math.random());
            part3_Final = part3_Final.sort(() => 0.5 - Math.random());

            finalQuestions = [...part1_Final, ...part2_Final, ...part3_Final];

            // Đánh số lại ID
            finalQuestions.forEach((q, index) => {
                q.id = q.id || `Q${index + 1}`;
                q.title = `Câu ${index + 1}`;
            });
            
            currentQuestions = finalQuestions;
        } 
        
        // === TRƯỜNG HỢP 2: ĐỀ MA TRẬN CŨ (RANDOM POOL) ===
        else if (currentExam.type === 'random_matrix' && currentExam.config) {
            let allQuestions = [];
            for (const item of currentExam.config) {
                try {
                    const response = await fetch(item.file);
                    const data = await response.json();
                    const rawQuestions = Array.isArray(data) ? data : (data.questions || []);

                    ['nhan_biet', 'thong_hieu', 'van_dung'].forEach(lv => {
                        if (item[lv] > 0) {
                            let pool = rawQuestions.filter(q => q.level === lv);
                            if (pool.length > 0) {
                                let picked = pool.sort(() => 0.5 - Math.random()).slice(0, item[lv]);
                                picked = picked.map(q => ({ ...q, chapter: data.name }));
                                allQuestions = allQuestions.concat(picked);
                            }
                        }
                    });
                } catch (error) { console.error(error); }
            }
            currentQuestions = allQuestions.sort(() => 0.5 - Math.random());
            currentQuestions.forEach((q, i) => { q.id = q.id || `Q${i+1}`; q.title = `Câu ${i+1}:`; });
        } 
        
        // === TRƯỜNG HỢP 3: ĐỀ CỐ ĐỊNH (STATIC) - ĐÃ FIX LỖI ===
        else {
            const response = await fetch(currentExam.file);
            if (!response.ok) throw new Error(`Không tải được file ${currentExam.file}`);
            
            const data = await response.json();
            
            // FIX QUAN TRỌNG: Kiểm tra xem data là Mảng [] hay Object {questions: []}
            // Code cũ của bạn hỗ trợ cả 2, đoạn này khôi phục lại tính năng đó
            currentQuestions = Array.isArray(data) ? data : (data.questions || []);

            // FIX BỔ SUNG: Gán giá trị mặc định cho đề cũ nếu thiếu
            if (currentQuestions.length > 0) {
                currentQuestions.forEach((q, idx) => {
                    // Nếu thiếu ID, tự sinh ID
                    if (!q.id) q.id = `Q_STATIC_${idx}`;
                    // Nếu thiếu level, gán mặc định Nhận biết
                    if (!q.level) q.level = 'nhan_biet';
                    // Nếu thiếu type, đoán là trắc nghiệm
                    if (!q.type) q.type = 'multiple_choice';
                });
            }
        }

        // === KẾT THÚC XỬ LÝ ===

        renderContent(currentQuestions);
        
        // Đồng bộ Firebase (nếu cần)
        if (currentUser && sessionCode && !isTeacherLoggedIn) {
            db.ref(`sessions/${sessionCode}/students/${currentUser.uid}/currentExamData`).set({
                examId: selectedId,
                examName: currentExam.name,
                questionIds: currentQuestions.map(q => q.id),
                questionCount: currentQuestions.length,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }

        document.title = `${currentExam.name} - Lớp Toán Thầy Bình`;
        
        // Thông báo kết quả
        if (currentQuestions.length > 0) {
            showNotification(`✅ Đã tải thành công ${currentQuestions.length} câu hỏi`, 'success');
        } else {
            showNotification('⚠️ File đề thi trống hoặc sai định dạng!', 'warning');
        }

    } catch (error) {
        console.error("❌ Lỗi quy trình chọn đề:", error);
        showNotification(`Lỗi: ${error.message}`, 'error');
        resetToWelcomeScreen();
    }
}

// ===== CONTENT RENDERING =====
function showWelcomeScreen() {
    const slidesContainer = document.getElementById('slides-container');
    if (!slidesContainer) return;
    
    slidesContainer.innerHTML = `
        <section class="slide-section active-section" id="section-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="color: white; border: none; font-size: 3em; margin-bottom: 20px;">🧮 LỚP TOÁN THẦY BÌNH</h1>
            <h3 style="color: white; margin-bottom: 40px;">Hệ Thống Dạy Học Trực Tuyến Toàn Diện</h3>
            
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; max-width: 800px; margin: 0 auto;">
                <h4 style="color: white; margin-bottom: 20px;">📚 HƯỚNG DẪN SỬ DỤNG</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                        <div style="font-size: 2em; margin-bottom: 10px;">🔑</div>
                        <h5 style="color: white; margin-bottom: 10px;">1. Đăng nhập</h5>
                        <p style="color: rgba(255,255,255,0.9); font-size: 0.9em;">Nhấn nút "Đăng nhập" và nhập mã học sinh/giáo viên</p>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                        <div style="font-size: 2em; margin-bottom: 10px;">📝</div>
                        <h5 style="color: white; margin-bottom: 10px;">2. Chọn đề</h5>
                        <p style="color: rgba(255,255,255,0.9); font-size: 0.9em;">Chọn đề thi từ menu "Chọn đề" trên thanh công cụ</p>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                        <div style="font-size: 2em; margin-bottom: 10px;">🎯</div>
                        <h5 style="color: white; margin-bottom: 10px;">3. Làm bài</h5>
                        <p style="color: rgba(255,255,255,0.9); font-size: 0.9em;">Làm bài và kiểm tra đáp án trực tiếp trên hệ thống</p>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <p style="color: rgba(255,255,255,0.9); font-size: 0.9em;">
                        <strong>Giáo viên:</strong> Có thể quản lý lớp, tạo poll, đồng bộ slide<br>
                        <strong>Học sinh:</strong> Có thể tương tác, xem điểm, tham gia poll
                    </p>
                </div>
            </div>
        </section>
    `;
    
    setTimeout(createSlideList, 100);
}

function resetToWelcomeScreen() {
    const slidesContainer = document.getElementById('slides-container');
    slidesContainer.innerHTML = `
        <section class="slide-section active-section" id="section-0">
            <h2 style="text-align: center; color: #666; margin-top: 50px;">
                🧮 LỚP TOÁN THẦY BÌNH
            </h2>
            <p style="text-align: center; color: #888; font-size: 1.2em;">
                Vui lòng chọn một đề từ menu để bắt đầu.
            </p>
        </section>
    `;
    
    setTimeout(createSlideList, 100);
}

// ===== COMPLETE CONTENT RENDERER =====
function renderContent(contentData) {
    const slidesContainer = document.getElementById('slides-container');
    slidesContainer.innerHTML = '';

    // Nếu dữ liệu rỗng hoặc lỗi
    if (!contentData || !Array.isArray(contentData) || contentData.length === 0) {
        slidesContainer.innerHTML = `
            <section class="slide-section active-section">
                <h2 style="color: #dc3545; text-align: center; margin-top: 50px;">⚠️ Không có câu hỏi nào</h2>
                <p style="text-align: center;">Vui lòng kiểm tra lại file dữ liệu hoặc cấu hình ma trận.</p>
            </section>`;
        return;
    }

    // Biến để theo dõi việc chèn tiêu đề phần
    let currentPart = 0; // 0: chưa bắt đầu, 1: TN, 2: ĐS, 3: TLN

    contentData.forEach((item, index) => {
        const section = document.createElement('section');
        section.className = 'slide-section';
        section.id = `section-${index}`;
        
        let headerHtml = '';

        // Tự động chèn tiêu đề Phần dựa trên loại câu hỏi và thứ tự
        // Logic: Phần 1 (TN - 12 câu đầu), Phần 2 (ĐS - 4 câu tiếp), Phần 3 (TLN - 6 câu cuối)
        // Hoặc dựa vào item.type để linh hoạt hơn
        
        let newPart = 0;
        if (item.type === 'multiple_choice') newPart = 1;
        else if (item.type === 'true_false') newPart = 2;
        else if (item.type === 'short_answer') newPart = 3;

        if (newPart > currentPart) {
            currentPart = newPart;
            let partTitle = '';
            let partDesc = '';
            
            if (currentPart === 1) {
                partTitle = 'PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN';
                partDesc = 'Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi chỉ chọn một phương án.';
            } else if (currentPart === 2) {
                partTitle = 'PHẦN II. TRẮC NGHIỆM ĐÚNG SAI';
                partDesc = 'Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.';
            } else if (currentPart === 3) {
                partTitle = 'PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN';
                partDesc = 'Thí sinh trả lời từ câu 1 đến câu 6.';
            }

            if (partTitle) {
                headerHtml = `
                    <div style="background: #e3f2fd; padding: 15px; border-left: 5px solid #2196f3; margin-bottom: 20px; border-radius: 4px;">
                        <h3 style="margin: 0; color: #0d47a1;">${partTitle}</h3>
                        <p style="margin: 5px 0 0 0; color: #546e7a;"><i>${partDesc}</i></p>
                    </div>
                `;
            }
        }

        let contentHtml = '';
        switch(item.type) {
            case 'multiple_choice':
                contentHtml = renderMultipleChoiceQuestion(item);
                break;
            case 'true_false':
                contentHtml = renderTrueFalseQuestion(item);
                break;
            case 'short_answer':
                contentHtml = renderShortAnswerQuestion(item);
                break;
            default:
                contentHtml = `<div class="question">Loại câu hỏi không hỗ trợ: ${item.type}</div>`;
        }

        section.innerHTML = headerHtml + contentHtml;
        slidesContainer.appendChild(section);
    });
    
    // Kích hoạt lại các tính năng bổ trợ
    setTimeout(() => {
        // Observe scroll
        document.querySelectorAll('.slide-section').forEach(sec => {
            if (scrollObserver) scrollObserver.observe(sec);
        });
        
        // Active section đầu tiên
        const firstSection = document.querySelector('.slide-section');
        if (firstSection) firstSection.classList.add('active-section');

        // Render MathJax
        if (window.MathJax) MathJax.typesetPromise();

        // Tạo lại menu bên phải
        createSlideList();
    }, 100);
}

// ===== RENDER FUNCTIONS FOR EACH CONTENT TYPE =====

function renderLessonCollection(lessonData) {
    const slidesContainer = document.getElementById('slides-container');
    let html = '';
    
    // 1. Cover Page
    html += `
        <section class="slide-section active-section" style="background: linear-gradient(135deg, #1a237e, #3949ab); color: white; text-align: center;">
            <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: white; border: none; font-size: 2.5em; margin-bottom: 20px;">
                    ${lessonData.title || 'Chuyên đề Toán học'}
                </h1>
                <h3 style="color: rgba(255,255,255,0.9); font-weight: normal;">
                    ${lessonData.description || ''}
                </h3>
                
                <div style="margin-top: 40px; background: rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; text-align: left;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        ${lessonData.author ? `
                        <div>
                            <strong>👨‍🏫 Tác giả:</strong><br>
                            ${lessonData.author}
                        </div>
                        ` : ''}
                        
                        ${lessonData.metadata?.total_questions ? `
                        <div>
                            <strong>📝 Số câu hỏi:</strong><br>
                            ${lessonData.metadata.total_questions}
                        </div>
                        ` : ''}
                        
                        ${lessonData.metadata?.estimated_completion_time ? `
                        <div>
                            <strong>⏱️ Thời lượng:</strong><br>
                            ${lessonData.metadata.estimated_completion_time}
                        </div>
                        ` : ''}
                        
                        ${lessonData.metadata?.target_audience ? `
                        <div>
                            <strong>🎯 Đối tượng:</strong><br>
                            ${lessonData.metadata.target_audience}
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 40px;">
                    <button onclick="scrollToSection(1)" style="padding: 15px 30px; background: white; color: #1a237e; border: none; border-radius: 10px; font-size: 1.1em; font-weight: bold; cursor: pointer;">
                        🚀 Bắt đầu học
                    </button>
                </div>
            </div>
        </section>
    `;
    
    // 2. Render each section
    if (lessonData.sections && Array.isArray(lessonData.sections)) {
        lessonData.sections.forEach((section, sectionIndex) => {
            html += renderCollectionSection(section, sectionIndex + 1);
        });
    }
    
    slidesContainer.innerHTML = html;
    
    // Initialize
    setTimeout(() => {
        document.querySelectorAll('.slide-section').forEach(section => {
            if (scrollObserver) {
                scrollObserver.observe(section);
            }
        });
        
        MathJax.typesetPromise();
        createSlideList();
    }, 100);
}

function renderCollectionSection(section, sectionNumber) {
    let html = `
        <section class="slide-section" id="section-${sectionNumber}">
            <div style="background: linear-gradient(135deg, #f8f9ff, #eef1ff); padding: 20px; border-radius: 15px; margin-bottom: 25px;">
                <h2 style="color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 10px;">
                    ${sectionNumber}. ${section.title || `Chương ${sectionNumber}`}
                </h2>
                ${section.description ? `<p style="color: #666; font-size: 1.1em; margin-top: 10px;">${section.description}</p>` : ''}
            </div>
    `;
    
    // Render content items
    if (section.content && Array.isArray(section.content)) {
        section.content.forEach((item, itemIndex) => {
            const uniqueId = `s${sectionNumber}-i${itemIndex}`;
            html += renderCollectionContentItem(item, uniqueId);
        });
    }
    
    html += `</section>`;
    return html;
}

function renderCollectionContentItem(item, uniqueId) {
    let html = '<div style="margin-bottom: 30px;">';
    
    switch(item.type) {
        case 'definition':
            html += `
                <div class="theory-box" style="background: #e8f4f8; padding: 20px; border-radius: 12px; border-left: 5px solid #17a2b8;">
                    <h4 style="color: #17a2b8; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <span>📘</span> ${processContent(item.title || 'Định nghĩa')}
                    </h4>
                    <div style="line-height: 1.6;">
                        ${processContent(item.content || '')}
                        ${item.formula ? `<div style="text-align: center; margin: 15px 0; font-size: 1.1em;">${processContent(item.formula)}</div>` : ''}
                        ${item.note ? `<div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 8px; margin-top: 10px;"><strong>Chú ý:</strong> ${processContent(item.note)}</div>` : ''}
                    </div>
                </div>
            `;
            break;
            
        case 'theorem':
            html += `
                <div class="theory-box" style="background: #f0f7ff; padding: 20px; border-radius: 12px; border-left: 5px solid #4dabf7;">
                    <h4 style="color: #1c7ed6; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <span>📖</span> ${processContent(item.title || 'Định lý')}
                    </h4>
                    ${item.content ? `<p style="margin-bottom: 15px;">${processContent(item.content)}</p>` : ''}
                    
                    ${item.statements && Array.isArray(item.statements) ? `
                        <div style="margin: 15px 0;">
                            ${item.statements.map((stmt, idx) => `
                                <div style="margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px;">
                                    <strong>${idx + 1}.</strong> ${processContent(stmt.content)}
                                    ${stmt.proof ? `<div style="margin-top: 8px; padding-left: 20px; color: #666; font-size: 0.95em;"><em>Chứng minh:</em> ${processContent(stmt.proof)}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${item.note ? `<div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 8px; margin-top: 15px;"><strong>Nhận xét:</strong> ${processContent(item.note)}</div>` : ''}
                </div>
            `;
            break;
            
        case 'true_false_quiz':
            html += renderTrueFalseQuizItem(item, uniqueId);
            break;
            
        case 'multiple_choice':
            html += renderMultipleChoiceSetItem(item, uniqueId);
            break;
            
        case 'short_answer':
            html += renderShortAnswerSetItem(item, uniqueId);
            break;
            
        case 'method':
            html += renderMethodItem(item, uniqueId);
            break;
            
        case 'mixed_quiz':
            html += renderMixedQuizItem(item, uniqueId);
            break;
            
        default:
            html += `<div style="color: #666; padding: 20px; text-align: center; background: #f8f9fa; border-radius: 10px;">
                Không thể hiển thị loại nội dung: ${item.type}
            </div>`;
    }
    
    html += '</div>';
    return html;
}

// ===== INDIVIDUAL RENDER FUNCTIONS =====

function renderWelcomeSection(item) {
    return `
        <div style="text-align: center; padding: 40px 20px;">
            <h1 style="color: ${item.color || '#1a237e'}; border: none; font-size: 2.5em;">
                ${item.title || 'Chào mừng'}
            </h1>
            <h3 style="color: ${item.color || '#3949ab'};">${item.subtitle || ''}</h3>
            <div style="margin-top: 30px; font-size: 1.1em;">
                ${item.content || ''}
            </div>
            ${item.extraContent || ''}
        </div>
    `;
}

function renderMultipleChoiceQuestion(item) {
    // Tạo badge mức độ
    const levelMap = {
        'nhan_biet': { class: 'nb', text: 'NB' },
        'thong_hieu': { class: 'th', text: 'TH' },
        'van_dung': { class: 'vd', text: 'VD' },
        'van_dung_cao': { class: 'vdc', text: 'VDC' }
    };
    
    const levelInfo = levelMap[item.level] || { class: 'nb', text: 'NB' };
    const chapterBadge = item.chapter ? `<span class="chapter-badge">${item.chapter}</span>` : '';
    
    let optionsHtml = '';
    for (const [key, value] of Object.entries(item.options || {})) {
        optionsHtml += `
            <div class="option-row">
                <input type="radio" name="${item.id}" value="${key}" id="${item.id}${key}" 
                       onchange="handleAutoScore('${item.id}', 'multiple_choice', '${item.correct}', this.value)">
                <label for="${item.id}${key}">${key}. ${processContent(value)}</label>
                <span class="option-icon" id="icon-${item.id}-${key}"></span>
            </div>
        `;
    }
    
    let solutionHtml = '';
    if (item.solution) {
        solutionHtml = `
            <button onclick="toggleSolution('${item.id}')" style="margin-top: 10px; padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                👁️ Xem giải
            </button>
            <div id="solution-${item.id}" class="solution-box" style="display: none;">
                <div class="solution-title">Hướng dẫn giải ${item.title}</div>
                <div class="solution-content">${processContent(item.solution)}</div>
            </div>
        `;
    }
    
    return `
        <div class="question" id="${item.id}">
            <p class="question-title">
                <strong>${item.title}</strong>
                <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                ${chapterBadge}
                ${processContent(item.text)}
            </p>
            ${(function(){
    // Hỗ trợ trường hợp nhiều ảnh (mảng)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        return `<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 15px 0;">
            ${item.images.map(src => `<img src="${src}" style="max-width: 48%; border-radius: 8px; border: 1px solid #ddd;">`).join('')}
        </div>`;
    } 
    // Hỗ trợ tương thích ngược (file cũ chỉ có 1 string image)
    else if (item.image) {
        return `<img src="${item.image}" style="max-width: 100%; margin: 15px 0; border-radius: 10px;">`;
    }
    return '';
})()}
            <div class="options">${optionsHtml}</div>
            <div class="answer-check">
                <button onclick="checkAnswer('${item.id}', '${item.correct}')">✅ Kiểm tra</button>
                <span id="result-${item.id}"></span>
            </div>
            ${solutionHtml}
        </div>
    `;
}

function renderTrueFalseQuestion(item) {
    // Tạo badge mức độ
    const levelMap = {
        'nhan_biet': { class: 'nb', text: 'NB' },
        'thong_hieu': { class: 'th', text: 'TH' },
        'van_dung': { class: 'vd', text: 'VD' },
        'van_dung_cao': { class: 'vdc', text: 'VDC' }
    };
    
    const levelInfo = levelMap[item.level] || { class: 'nb', text: 'NB' };
    const chapterBadge = item.chapter ? `<span class="chapter-badge">${item.chapter}</span>` : '';
    
    // --- XỬ LÝ 1: ẢNH ĐỀ BÀI (Hỗ trợ cả 1 ảnh cũ và nhiều ảnh mới) ---
    let questionImagesHtml = '';
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        // Trường hợp nhiều ảnh: Xếp ngang
        questionImagesHtml = `
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 15px 0;">
                ${item.images.map(src => `<img src="${src}" style="max-width: 48%; border-radius: 8px; border: 1px solid #ddd;">`).join('')}
            </div>`;
    } else if (item.image) {
        // Trường hợp cũ 1 ảnh
        questionImagesHtml = `<img src="${item.image}" style="max-width: 100%; margin: 15px 0; border-radius: 10px;" onerror="this.style.display='none'">`;
    }

    // --- XỬ LÝ 2: MỆNH ĐỀ (Hỗ trợ ảnh trong phương án) ---
    let statementsHtml = '';
    if (Array.isArray(item.statements)) {
        item.statements.forEach((stmt, idx) => {
            const letter = String.fromCharCode(97 + idx); // a, b, c, d
            
            // Logic mới: Kiểm tra xem stmt là CHUỖI hay ĐỐI TƯỢNG
            let stmtText = '';
            let stmtImage = '';

            if (typeof stmt === 'object' && stmt !== null) {
                // Nếu JSON ghi dạng: { "text": "Nội dung...", "image": "link_anh.png" }
                stmtText = stmt.text || '';
                if (stmt.image) {
                    stmtImage = `<div style="margin-top:5px;"><img src="${stmt.image}" style="max-height: 150px; border-radius: 5px;"></div>`;
                }
            } else {
                // Nếu JSON ghi dạng chuỗi bình thường: "Nội dung..."
                stmtText = stmt;
            }

            statementsHtml += `
                <div class="option-row">
                    <div style="flex: 1;">
                        <strong>${letter})</strong> ${processContent(stmtText)}
                        ${stmtImage} 
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="${item.id}_${letter}" value="True"
                                   onchange="handleAutoScoreForStatement('${item.id}', ${idx}, 'True')">
                            <span style="color: #28a745; font-weight: bold;">Đúng</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="${item.id}_${letter}" value="False"
                                   onchange="handleAutoScoreForStatement('${item.id}', ${idx}, 'False')">
                            <span style="color: #dc3545; font-weight: bold;">Sai</span>
                        </label>
                    </div>
                </div>
            `;
        });
    }

    // Tạo phần xem lời giải
    let solutionHtml = '';
    if (item.solution) {
        solutionHtml = `
            <button onclick="toggleSolution('${item.id}')" 
                style="margin-top: 10px; padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                👁️ Xem giải chi tiết
            </button>
            <div id="solution-${item.id}" class="solution-box" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-left: 4px solid #17a2b8;">
                <div class="solution-title" style="font-weight:bold; margin-bottom:5px;">Hướng dẫn giải:</div>
                <div class="solution-content">${processContent(item.solution)}</div>
            </div>
        `;
    }

    // ĐÁP ÁN JSON
    const answersArray = JSON.stringify(item.answers);  

    return `
        <div class="question" id="${item.id}" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div class="question-header" style="margin-bottom: 10px;">
                <strong style="color: #0d47a1; font-size: 1.1em;">${item.title}</strong>
                <span class="status-tag ${levelInfo.class}" style="margin-left:5px; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; color: white;">${levelInfo.text}</span>
                ${chapterBadge}
            </div>
            
            <div class="question-text" style="margin-bottom: 10px;">
                ${processContent(item.text)}
            </div>

            ${questionImagesHtml}

            <div class="options" style="border-top: 1px solid #eee; padding-top: 10px;">
                ${statementsHtml}
            </div>

            <div class="answer-check" style="margin-top: 15px; display: flex; align-items: center; gap: 10px;">
                <button onclick='checkTrueFalseAnswer("${item.id}", ${answersArray})' 
                        style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ✅ Kiểm tra
                </button>
                <span id="result-${item.id}" style="font-weight: bold;"></span>
            </div>

            ${solutionHtml}
        </div>
    `;
}

function renderShortAnswerQuestion(item) {
    // 1. Tạo badge mức độ
    const levelMap = {
        'nhan_biet': { class: 'nb', text: 'NB' },
        'thong_hieu': { class: 'th', text: 'TH' },
        'van_dung': { class: 'vd', text: 'VD' },
        'van_dung_cao': { class: 'vdc', text: 'VDC' }
    };
    
    const levelInfo = levelMap[item.level] || { class: 'nb', text: 'NB' };
    const chapterBadge = item.chapter ? `<span class="chapter-badge">${item.chapter}</span>` : '';
    
    // 2. XỬ LÝ ẢNH (Tách logic ra ngoài để an toàn hơn)
    let imagesHtml = '';

    // Ưu tiên 1: JSON mới (mảng images)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imagesHtml = `
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 15px 0;">
                ${item.images.map(src => 
                    `<img src="${src}" 
                          style="max-width: 48%; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
                          onerror="this.style.display='none'" 
                          alt="Hình ảnh câu hỏi">`
                ).join('')}
            </div>`;
    } 
    // Ưu tiên 2: JSON cũ (string image) - Tương thích ngược
    else if (item.image) {
        imagesHtml = `
            <div style="text-align: center; margin: 15px 0;">
                <img src="${item.image}" 
                     style="max-width: 100%; border-radius: 10px; border: 1px solid #ddd;" 
                     onerror="this.style.display='none'" 
                     alt="Hình ảnh câu hỏi">
            </div>`;
    }

    // 3. Render HTML
    return `
        <div class="question" id="${item.id}" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <div class="question-header" style="margin-bottom: 10px;">
                <strong style="color: #2c3e50; font-size: 1.1em;">${item.title}</strong>
                <span class="status-tag ${levelInfo.class}" style="margin-left:5px;">${levelInfo.text}</span>
                ${chapterBadge}
            </div>
            
            <div class="question-content" style="margin-bottom: 15px; font-size: 1.05em;">
                ${processContent(item.text)}
            </div>

            ${imagesHtml} <div class="answer-check" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input id="input-${item.id}" 
                           placeholder="${item.placeholder || 'Nhập đáp án (VD: 5.5)'}" 
                           type="text"
                           style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1em;"
                           onchange="handleAutoScore('${item.id}', 'short_answer', '${item.answer || ''}', this.value)"/>
                    
                    <button onclick="checkShortAnswer('${item.id}', '${item.answer || ''}')"
                            style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        ✅ Kiểm tra
                    </button>
                </div>
                <span id="icon-${item.id}" style="display: block; margin-top: 10px;"></span>
            </div>

            <div id="result-${item.id}"></div>

            ${item.solution ? `
                <button onclick="toggleSolution('${item.id}')" 
                        style="margin-top: 15px; padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    👁️ Xem lời giải chi tiết
                </button>
                <div id="solution-${item.id}" class="solution-box" style="display: none; margin-top: 15px; padding: 15px; background: #e0f7fa; border-left: 4px solid #17a2b8; border-radius: 4px;">
                    <div class="solution-title" style="font-weight: bold; color: #006064; margin-bottom: 8px;">Hướng dẫn giải:</div>
                    <div class="solution-content">${processContent(item.solution)}</div>
                </div>
            ` : ''}
        </div>
    `;
}
function renderTheorySection(item) {
    // Tạo badge mức độ
    const levelMap = {
        'nhan_biet': { class: 'nb', text: 'NB' },
        'thong_hieu': { class: 'th', text: 'TH' },
        'van_dung': { class: 'vd', text: 'VD' },
        'van_dung_cao': { class: 'vdc', text: 'VDC' }
    };
    
    const levelInfo = levelMap[item.level] || { class: 'nb', text: 'NB' };
    const chapterBadge = item.chapter ? `<span class="chapter-badge">${item.chapter}</span>` : '';
    
    return `
        <div class="question" id="${item.id}">
            <h3 style="color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 10px;">
                ${item.title}
                <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                ${chapterBadge}
            </h3>
            <div style="font-size: 1.1em; line-height: 1.6; margin-top: 20px;">
                ${processContent(item.content)}
            </div>
            ${item.example ? `
                <div class="solution-box" style="margin-top: 30px;">
                    <div class="solution-title">📚 Ví dụ minh họa</div>
                    <div class="solution-content">${processContent(item.example)}</div>
                </div>
            ` : ''}
        </div>
    `;
}

// ===== NEW FORMAT RENDERERS =====

function renderTrueFalseQuizItem(quizData, uniqueId) {
    let questionsHtml = '';
    
    quizData.questions.forEach((q, qIndex) => {
        // Tạo badge mức độ cho từng câu
        const levelMap = {
            'nhan_biet': { class: 'nb', text: 'NB' },
            'thong_hieu': { class: 'th', text: 'TH' },
            'van_dung': { class: 'vd', text: 'VD' }
        };
        
        const levelInfo = levelMap[q.level] || { class: 'nb', text: 'NB' };
        
        questionsHtml += `
            <div class="tf-question" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span style="background: #1a237e; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${qIndex + 1}
                            </span>
                            <strong style="font-size: 1.05em;">${processContent(q.statement)}</strong>
                            <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                        </div>
                        
                        <div style="display: flex; gap: 20px; margin: 15px 0 0 40px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 15px; background: white; border-radius: 8px; border: 2px solid #e0e0e0;">
                                <input type="radio" name="tf-${uniqueId}-${q.id}" value="true" style="transform: scale(1.2);"
                                       onchange="handleAutoScore('${uniqueId}-${q.id}', 'true_false', ${q.answer}, 'true')">
                                <span style="font-weight: bold; color: #28a745;">ĐÚNG</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 15px; background: white; border-radius: 8px; border: 2px solid #e0e0e0;">
                                <input type="radio" name="tf-${uniqueId}-${q.id}" value="false" style="transform: scale(1.2);"
                                       onchange="handleAutoScore('${uniqueId}-${q.id}', 'true_false', ${q.answer}, 'false')">
                                <span style="font-weight: bold; color: #dc3545;">SAI</span>
                            </label>
                        </div>
                    </div>
                    
                    <button onclick="checkSingleTrueFalse('${uniqueId}', '${q.id}', ${q.answer})" 
                            style="margin-left: 15px; padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; white-space: nowrap;">
                        Kiểm tra
                    </button>
                </div>
                
                <div id="tf-result-${uniqueId}-${q.id}" style="margin-top: 15px; min-height: 24px;"></div>
                
                <div id="tf-solution-${uniqueId}-${q.id}" style="display: none; margin-top: 15px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
                    <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">📝 Giải thích:</div>
                    <div>${processContent(q.explanation)}</div>
                    ${q.proof ? `<div style="margin-top: 10px;"><em>Chứng minh:</em> ${processContent(q.proof)}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    return `
        <div class="question" id="tf-quiz-${uniqueId}">
            <div style="background: linear-gradient(135deg, #f0f7ff, #e6f0ff); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h4 style="color: #1a237e; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span>❓</span> ${processContent(quizData.title || 'Câu hỏi đúng/sai')}
                </h4>
                <p style="color: #666;">${processContent(quizData.instructions || 'Xác định tính đúng/sai của các mệnh đề sau:')}</p>
            </div>
            
            ${questionsHtml}
            
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="checkAllTrueFalse('${uniqueId}', ${JSON.stringify(quizData.questions.map(q => q.answer))})"
                        style="padding: 12px 30px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 1.1em; cursor: pointer;">
                    ✅ Kiểm tra tất cả (${quizData.questions.length} câu)
                </button>
                
                ${quizData.scoring ? `
                    <div style="margin-top: 15px; color: #666; font-size: 0.9em;">
                        <em>Điểm: ${quizData.scoring.points_per_correct}/câu đúng | Tổng: ${quizData.scoring.total_points} điểm</em>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderMultipleChoiceSetItem(item, uniqueId) {
    let html = `
        <div class="question" id="mc-set-${uniqueId}">
            <div style="background: linear-gradient(135deg, #f8f9ff, #eef1ff); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h4 style="color: #1a237e; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span>📝</span> ${item.title || 'Bài tập trắc nghiệm'}
                </h4>
            </div>
    `;
    
    if (item.questions && Array.isArray(item.questions)) {
        item.questions.forEach((q, qIndex) => {
            // Tạo badge mức độ cho từng câu
            const levelMap = {
                'nhan_biet': { class: 'nb', text: 'NB' },
                'thong_hieu': { class: 'th', text: 'TH' },
                'van_dung': { class: 'vd', text: 'VD' },
                'van_dung_cao': { class: 'vdc', text: 'VDC' }
            };
            
            const levelInfo = levelMap[q.level] || { class: 'nb', text: 'NB' };
            
            let optionsHtml = '';
            for (const [key, value] of Object.entries(q.options || {})) {
                optionsHtml += `
                    <div style="margin: 8px 0; padding: 10px; background: white; border-radius: 8px; border: 2px solid #e0e0e0; cursor: pointer;"
                         onclick="selectMCOption(this, '${uniqueId}-${q.id}', '${key}')">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="background: #f0f0f0; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${key}
                            </span>
                            <span>${value}</span>
                        </div>
                        <span id="icon-${uniqueId}-${q.id}-${key}" style="margin-left: auto;"></span>
                    </div>
                `;
            }
            
            html += `
                <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                    <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                        <span style="background: #1a237e; color: white; min-width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${qIndex + 1}
                        </span>
                        <div style="flex: 1; font-size: 1.05em;">
                            ${q.question}
                            <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                            ${q.difficulty ? `<span style="font-size: 0.8em; padding: 2px 8px; background: ${getDifficultyColor(q.difficulty)}; color: white; border-radius: 10px; margin-left: 10px;">${q.difficulty}</span>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-left: 50px;">
                        ${optionsHtml}
                    </div>
                    
                    <div style="margin-top: 15px; margin-left: 50px;">
                        <button onclick="checkMCQuestion('${uniqueId}-${q.id}', '${q.correct}', '${q.solution || ''}')"
                                style="padding: 8px 20px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Kiểm tra câu này
                        </button>
                        <span id="result-${uniqueId}-${q.id}" style="margin-left: 15px;"></span>
                    </div>
                    
                    ${q.solution ? `
                        <div id="solution-${uniqueId}-${q.id}" style="display: none; margin-top: 15px; margin-left: 50px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
                            <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">📖 Hướng dẫn giải:</div>
                            <div>${q.solution}</div>
                            ${q.step_by_step ? `
                                <div style="margin-top: 10px;">
                                    <strong>Các bước giải:</strong>
                                    <ol style="margin: 5px 0 0 20px;">
                                        ${q.step_by_step.map(step => `<li>${step}</li>`).join('')}
                                    </ol>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }
    
    html += `</div>`;
    return html;
}

function renderShortAnswerSetItem(item, uniqueId) {
    let html = `
        <div class="question" id="sa-set-${uniqueId}">
            <div style="background: linear-gradient(135deg, #f0f7ff, #e6f0ff); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h4 style="color: #1a237e; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span>✍️</span> ${processContent(item.title || 'Bài tập tự luận ngắn')}
                </h4>
            </div>
    `;
    
    if (item.questions && Array.isArray(item.questions)) {
        item.questions.forEach((q, qIndex) => {
            // Tạo badge mức độ cho từng câu
            const levelMap = {
                'nhan_biet': { class: 'nb', text: 'NB' },
                'thong_hieu': { class: 'th', text: 'TH' },
                'van_dung': { class: 'vd', text: 'VD' }
            };
            
            const levelInfo = levelMap[q.level] || { class: 'nb', text: 'NB' };
            
            html += `
                <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                    <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                        <span style="background: #1a237e; color: white; min-width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${qIndex + 1}
                        </span>
                        <div style="flex: 1; font-size: 1.05em;">
                            ${processContent(q.question)}
                            <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                        </div>
                    </div>
                    
                    <div style="margin-left: 50px;">
                        <input type="text" id="input-${uniqueId}-${q.id}" 
                               placeholder="${q.placeholder || 'Nhập câu trả lời...'}"
                               style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;"
                               onchange="handleAutoScore('${uniqueId}-${q.id}', 'short_answer', '${q.answer}', this.value)">
                        
                        ${q.hint ? `
                            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; color: #856404;">
                                <strong>💡 Gợi ý:</strong> ${processContent(q.hint)}
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
                            <button onclick="checkSAQuestion('${uniqueId}-${q.id}', '${q.answer}', ${JSON.stringify(q.accept_variations || [])}, '${q.solution || ''}')"
                                    style="padding: 10px 25px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Kiểm tra
                            </button>
                            <span id="result-${uniqueId}-${q.id}" style="margin-left: 10px;"></span>
                        </div>
                    </div>
                    
                    ${q.solution ? `
                        <div id="solution-${uniqueId}-${q.id}" style="display: none; margin-top: 15px; margin-left: 50px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
                            <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">📖 Lời giải:</div>
                            <div>${processContent(q.solution)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }
    
    html += `</div>`;
    return html;
}

function renderMethodItem(item, uniqueId) {
    let stepsHtml = '';
    if (item.steps && Array.isArray(item.steps)) {
        item.steps.forEach((step, idx) => {
            stepsHtml += `
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 10px; border-left: 4px solid #4dabf7;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="background: #4dabf7; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${idx + 1}
                        </span>
                        <strong style="color: #1a237e;">${step.title}</strong>
                    </div>
                    <div style="margin-left: 40px;">
                        <div><strong>Công thức/bước:</strong> ${step.content}</div>
                        ${step.explanation ? `<div style="margin-top: 8px; color: #666;">${step.explanation}</div>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    let exampleHtml = '';
    if (item.example) {
        exampleHtml = `
            <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 12px;">
                <h5 style="color: #17a2b8; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span>📚</span> Ví dụ minh họa
                </h5>
                <div style="margin-bottom: 15px;">
                    <strong>Bài toán:</strong> ${item.example.problem}
                </div>
                <div>
                    <strong>Lời giải:</strong>
                    ${Array.isArray(item.example.solution_steps) ? 
                        `<ol style="margin: 10px 0 0 20px;">${item.example.solution_steps.map(step => `<li>${step}</li>`).join('')}</ol>` :
                        `<div style="margin-top: 10px;">${item.example.solution_steps}</div>`
                    }
                </div>
                ${item.example.graph_characteristics ? `
                    <div style="margin-top: 15px;">
                        <strong>Đặc điểm đồ thị:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            ${Object.entries(item.example.graph_characteristics).map(([key, value]) => 
                                `<li><strong>${key}:</strong> ${value}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return `
        <div class="theory-box" style="background: #f0f7ff; padding: 25px; border-radius: 12px; border: 2px solid #4dabf7;">
            <h4 style="color: #1a237e; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <span>🔧</span> ${item.title || 'Phương pháp giải'}
            </h4>
            
            ${item.problem_type ? `
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px;">
                    <strong>Dạng toán:</strong> ${item.problem_type}
                </div>
            ` : ''}
            
            <div style="margin: 20px 0;">
                <h5 style="color: #3949ab; margin-bottom: 15px;">📋 Các bước giải:</h5>
                ${stepsHtml}
            </div>
            
            ${exampleHtml}
        </div>
    `;
}

function renderMixedQuizItem(item, uniqueId) {
    let html = `
        <div class="question" id="mixed-${uniqueId}">
            <div style="background: linear-gradient(135deg, #f8f9ff, #eef1ff); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h4 style="color: #1a237e; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span>🎯</span> ${processContent(item.title || 'Bài tập tổng hợp')}
                </h4>
            </div>
    `;
    
    if (item.questions && Array.isArray(item.questions)) {
        item.questions.forEach((q, qIndex) => {
            // Tạo badge mức độ cho từng câu
            const levelMap = {
                'nhan_biet': { class: 'nb', text: 'NB' },
                'thong_hieu': { class: 'th', text: 'TH' },
                'van_dung': { class: 'vd', text: 'VD' }
            };
            
            const levelInfo = levelMap[q.level] || { class: 'nb', text: 'NB' };
            
            if (q.type === 'true_false') {
                html += `
                    <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                        <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                            <span style="background: #1a237e; color: white; min-width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${qIndex + 1}
                            </span>
                            <div style="flex: 1; font-size: 1.05em;">
                                ${processContent(q.statement)}
                                <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                            </div>
                        </div>
                        
                        <div style="margin-left: 50px; display: flex; gap: 20px;">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="mixed-${uniqueId}-${q.id}" value="true"
                                       onchange="handleAutoScore('${uniqueId}-${q.id}', 'true_false', ${q.answer}, 'true')"> Đúng
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="mixed-${uniqueId}-${q.id}" value="false"
                                       onchange="handleAutoScore('${uniqueId}-${q.id}', 'true_false', ${q.answer}, 'false')"> Sai
                            </label>
                            <button onclick="checkMixedTF('${uniqueId}', '${q.id}', ${q.answer})"
                                    style="margin-left: auto; padding: 6px 15px; background: #17a2b8; color: white; border: none; border-radius: 6px;">
                                Kiểm tra
                            </button>
                        </div>
                        <div id="mixed-result-${uniqueId}-${q.id}" style="margin-top: 10px; margin-left: 50px;"></div>
                    </div>
                `;
            } else if (q.type === 'multiple_choice') {
                let optionsHtml = '';
                for (const [key, value] of Object.entries(q.options || {})) {
                    optionsHtml += `
                        <div style="margin: 8px 0; padding: 10px; background: white; border-radius: 8px; border: 2px solid #e0e0e0; cursor: pointer;"
                             onclick="selectMixedMCOption(this, '${uniqueId}-${q.id}', '${key}')">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: #f0f0f0; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                    ${key}
                                </span>
                                <span>${processContent(value)}</span>
                            </div>
                        </div>
                    `;
                }
                
                html += `
                    <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                        <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                            <span style="background: #1a237e; color: white; min-width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${qIndex + 1}
                            </span>
                            <div style="flex: 1; font-size: 1.05em;">
                                ${processContent(q.question)}
                                <span class="status-tag ${levelInfo.class}">${levelInfo.text}</span>
                            </div>
                        </div>
                        
                        <div style="margin-left: 50px;">
                            ${optionsHtml}
                        </div>
                        
                        <div style="margin-top: 15px; margin-left: 50px;">
                            <button onclick="checkMixedMC('${uniqueId}', '${q.id}', '${q.correct}')"
                                    style="padding: 6px 15px; background: #17a2b8; color: white; border: none; border-radius: 6px;">
                                Kiểm tra
                            </button>
                            <span id="mixed-result-${uniqueId}-${q.id}" style="margin-left: 15px;"></span>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    html += `</div>`;
    return html;
}

// ===== HELPER FUNCTIONS =====

function getDifficultyColor(difficulty) {
    switch(difficulty.toLowerCase()) {
        case 'easy': return '#28a745';
        case 'medium': return '#ffc107';
        case 'hard': return '#dc3545';
        default: return '#6c757d';
    }
}

// Scroll helper
window.scrollToSection = function(sectionNumber) {
    const section = document.getElementById(`section-${sectionNumber}`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// 🎯 MỚI: Hàm tự động tính điểm khi chọn đáp án
window.handleAutoScore = function(questionId, questionType, correctAnswer, userAnswer) {
    if (!currentUser || !sessionCode || isTeacherLoggedIn) return;
    
    console.log(`🎯 Tự động tính điểm: ${questionId}`, { questionType, correctAnswer, userAnswer });
    
    // Kiểm tra tính đúng/sai
    let isCorrect = false;
    let points = 0;
    
    switch(questionType) {
        case 'multiple_choice':
            // Trắc nghiệm nhiều lựa chọn
            isCorrect = String(userAnswer).toUpperCase() === String(correctAnswer).toUpperCase();
            points = isCorrect ? calculateTNPoints() : 0;
            break;
            
        case 'true_false':
            // Đúng/Sai đơn lẻ
            const expectedBool = Boolean(correctAnswer);
            const userBool = userAnswer === 'true';
            isCorrect = userBool === expectedBool;
            points = isCorrect ? 0.25 : 0; // Mỗi mệnh đề đúng được 0.25 điểm
            break;
            
        case 'short_answer':
            // Trả lời ngắn
            const normalizedUser = String(userAnswer).trim().toLowerCase().replace(/\s+/g, '');
            const normalizedCorrect = String(correctAnswer).trim().toLowerCase().replace(/\s+/g, '');
            isCorrect = normalizedUser === normalizedCorrect;
            points = isCorrect ? calculateSAPoints() : 0;
            break;
    }
    
    // Lưu kết quả tạm thời
    if (window.studentAnswers) {
        window.studentAnswers[questionId] = userAnswer;
    }
    
    // Cập nhật autoScoreData
    updateAutoScoreData(questionType, isCorrect);
    
    // Lưu lên Firebase ngay lập tức
    saveAutoScoreToFirebase(questionId, questionType, userAnswer, correctAnswer, isCorrect, points);
    
    // Hiển thị thông báo nhỏ
    if (isCorrect) {
        showNotification(`✅ Câu ${questionId}: +${points.toFixed(2)} điểm`, 'success', 2000);
    }
};

// 🎯 MỚI: Xử lý cho từng mệnh đề trong câu Đúng/Sai (4 mệnh đề)
window.handleAutoScoreForStatement = function(questionId, statementIndex, userAnswer) {
    if (!currentUser || !sessionCode || isTeacherLoggedIn) return;
    
    console.log(`🎯 Đúng/Sai mệnh đề: ${questionId}[${statementIndex}] = ${userAnswer}`);
    
    // Lấy đáp án đúng từ dữ liệu câu hỏi
    const questionElement = document.getElementById(questionId);
    if (!questionElement) return;
    
    // Tìm nút kiểm tra để lấy đáp án
    const checkButton = questionElement.querySelector('button[onclick*="checkTrueFalseAnswer"]');
    if (!checkButton) return;
    
    // Parse đáp án đúng từ onclick attribute
    const onclickStr = checkButton.getAttribute('onclick');
    const match = onclickStr.match(/checkTrueFalseAnswer\(['"][^'"]+['"]\s*,\s*(\[[^\]]+\])/);
    if (!match) return;
    
    try {
        const correctAnswers = JSON.parse(match[1].replace(/'/g, '"'));
        if (Array.isArray(correctAnswers) && statementIndex < correctAnswers.length) {
            const correctAnswer = Boolean(correctAnswers[statementIndex]);
            const userBool = userAnswer === 'True';
            const isCorrect = userBool === correctAnswer;
            
            // Cập nhật điểm cho câu hỏi này
            if (!window.tfScores) window.tfScores = {};
            if (!window.tfScores[questionId]) window.tfScores[questionId] = [];
            window.tfScores[questionId][statementIndex] = isCorrect ? 0.25 : 0;
            
            // Tính tổng điểm cho câu hỏi này
            const totalPoints = calculateTFPointsForQuestion(window.tfScores[questionId]);
            
            // Cập nhật autoScoreData
            updateAutoScoreData('true_false_multi', isCorrect);
            
            // Lưu lên Firebase
            saveAutoScoreToFirebase(
                `${questionId}_${statementIndex}`, 
                'true_false_statement',
                userAnswer,
                correctAnswer,
                isCorrect,
                isCorrect ? 0.25 : 0
            );
        }
    } catch (error) {
        console.error('Lỗi parse đáp án Đúng/Sai:', error);
    }
};

// 🎯 MỚI: Tính điểm phần Trắc nghiệm
function calculateTNPoints() {
    // Đếm tổng số câu TN trong đề
    if (!currentQuestions) return 0;
    
    const tnCount = currentQuestions.filter(q => q.type === 'multiple_choice').length;
    if (tnCount === 0) return 0;
    
    // Theo quy định Bộ GD&ĐT: 3 điểm / tổng số câu TN
    return 3.0 / tnCount;
}

// 🎯 MỚI: Tính điểm phần Trả lời ngắn
function calculateSAPoints() {
    // Đếm tổng số câu TLN trong đề
    if (!currentQuestions) return 0;
    
    const saCount = currentQuestions.filter(q => q.type === 'short_answer').length;
    if (saCount === 0) return 0;
    
    // Theo quy định Bộ GD&ĐT: 3 điểm / tổng số câu TLN
    return 3.0 / saCount;
}

// 🎯 MỚI: Tính điểm cho câu Đúng/Sai (4 mệnh đề)
function calculateTFPointsForQuestion(scoresArray) {
    if (!Array.isArray(scoresArray)) return 0;
    
    // Đếm số mệnh đề đúng
    const correctCount = scoresArray.filter(score => score > 0).length;
    
    // Tính điểm theo thang 0-1
    if (correctCount === 1) return 0.25;
    if (correctCount === 2) return 0.50;
    if (correctCount === 3) return 0.75;
    if (correctCount === 4) return 1.00;
    return 0;
}

// 🎯 MỚI: Cập nhật dữ liệu điểm tự động
function updateAutoScoreData(questionType, isCorrect) {
    switch(questionType) {
        case 'multiple_choice':
            autoScoreData.tn_total++;
            if (isCorrect) autoScoreData.tn_correct++;
            autoScoreData.tn_score = (autoScoreData.tn_correct / autoScoreData.tn_total) * 3;
            break;
            
        case 'true_false':
        case 'true_false_statement':
        case 'true_false_multi':
            autoScoreData.tf_total++;
            if (isCorrect) autoScoreData.tf_correct++;
            // Tính điểm theo thang 0-1 cho 4 mệnh đề
            const tfScoreMultiplier = 1.0; // 1 điểm cho câu 4 mệnh đề đầy đủ
            autoScoreData.tf_score = (autoScoreData.tf_correct / 4) * tfScoreMultiplier;
            break;
            
        case 'short_answer':
            autoScoreData.sa_total++;
            if (isCorrect) autoScoreData.sa_correct++;
            autoScoreData.sa_score = (autoScoreData.sa_correct / autoScoreData.sa_total) * 3;
            break;
    }
    
    // Tính tổng điểm và làm tròn đến 0.25
    autoScoreData.total_score = autoScoreData.tn_score + autoScoreData.tf_score + autoScoreData.sa_score;
    autoScoreData.total_score = Math.round(autoScoreData.total_score * 4) / 4; // Làm tròn đến 0.25
    
    autoScoreData.lastUpdate = new Date().toISOString();
    
    console.log('📊 Cập nhật điểm tự động:', autoScoreData);
}

// 🎯 MỚI: Lưu điểm tự động lên Firebase
async function saveAutoScoreToFirebase(questionId, questionType, userAnswer, correctAnswer, isCorrect, points) {
    if (!currentUser || !sessionCode || isTeacherLoggedIn) return;
    
    try {
        // Lưu từng câu trả lời
        await db.ref(`submissions/${sessionCode}/${currentUser.uid}/answers/${questionId}`).set({
            questionId: questionId,
            questionType: questionType,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            points: points,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Cập nhật tổng điểm
        await db.ref(`submissions/${sessionCode}/${currentUser.uid}/score`).set({
            tn_correct: autoScoreData.tn_correct,
            tn_total: autoScoreData.tn_total,
            tn_score: autoScoreData.tn_score.toFixed(2),
            tf_correct: autoScoreData.tf_correct,
            tf_total: autoScoreData.tf_total,
            tf_score: autoScoreData.tf_score.toFixed(2),
            sa_correct: autoScoreData.sa_correct,
            sa_total: autoScoreData.sa_total,
            sa_score: autoScoreData.sa_score.toFixed(2),
            total: autoScoreData.total_score.toFixed(2),
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log('✅ Đã lưu điểm tự động lên Firebase');
        
        // Cập nhật điểm trong session monitoring
        await db.ref(`sessions/${sessionCode}/students/${currentUser.uid}`).update({
            score: parseFloat(autoScoreData.total_score.toFixed(2)),
            lastActivity: firebase.database.ServerValue.TIMESTAMP
        });
        
    } catch (error) {
        console.error('❌ Lỗi lưu điểm tự động:', error);
    }
}

// ===== SLIDE MENU =====
function setupSlideMenu() {
    const slideMenu = document.getElementById('slideMenu');
    const slideMenuBtn = document.getElementById('slideMenuBtn');
    const closeSlideMenuBtn = document.getElementById('closeSlideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    function toggleSlideMenu() {
        slideMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    }
    slideMenuBtn.addEventListener('click', toggleSlideMenu);
    closeSlideMenuBtn.addEventListener('click', toggleSlideMenu);
    menuOverlay.addEventListener('click', toggleSlideMenu);
    
    createSlideList();
}

function createSlideList() {
    const slideList = document.getElementById('slideList');
    const sections = document.querySelectorAll('.slide-section');
    
    if (sections.length === 0) {
        slideList.innerHTML = `<div class="slide-item">Chưa có nội dung</div>`;
        return;
    }
    
    slideList.innerHTML = Array.from(sections).map((section, index) => {
        const title = section.querySelector('h2, h3, .question-title')?.textContent.substring(0, 30) || 
                     section.querySelector('p')?.textContent.substring(0, 30) || 
                     `Bài ${index + 1}`;
        return `<div class="slide-item" data-section-index="${index}">
                    <span class="slide-number">${index + 1}</span>${title}
                </div>`;
    }).join('');

    slideList.querySelectorAll('.slide-item').forEach(item => {
        item.addEventListener('click', () => {
            const sectionIndex = parseInt(item.dataset.sectionIndex);
            const section = document.getElementById(`section-${sectionIndex}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.getElementById('slideMenu').classList.remove('active');
                document.getElementById('menuOverlay').classList.remove('active');
            }
        });
    });
    
    updateActiveSlideInMenu();
}

function updateActiveSlideInMenu(section = null) {
    if (!section) {
        section = document.querySelector('.slide-section.active-section');
    }
    
    if (!section) return;
    
    const sectionIndex = Array.from(document.querySelectorAll('.slide-section')).indexOf(section);
    
    document.querySelectorAll('.slide-item').forEach((item, index) => {
        item.classList.toggle('active', index === sectionIndex);
    });
}

// ===== MODAL SYSTEM =====
function setupModalSystem() {
    const modals = document.querySelectorAll('.modal, .confirm-modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this);
            }
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeModal) {
            hideModal(activeModal);
        }
    });
    
    document.querySelectorAll('.modal-close, .confirm-no').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal, .confirm-modal');
            if (modal) hideModal(modal);
        });
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (activeModal) {
            hideModal(activeModal);
        }
        
        modal.classList.add('active');
        activeModal = modal;
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        if (modal === activeModal) {
            activeModal = null;
        }
    }
}

function hideAllModals() {
    document.querySelectorAll('.modal.active, .confirm-modal.active').forEach(modal => {
        hideModal(modal);
    });
}

function setupModalControls() {
    document.getElementById('loginBtn').addEventListener('click', () => { showModal('login-modal'); });
    document.getElementById('teacherMonitorBtn').addEventListener('click', () => {
        if (isTeacherLoggedIn) showModal('teacher-monitor');
        else showNotification('Chỉ giáo viên mới có quyền truy cập!', 'error');
    });
    document.getElementById('closeMonitor').addEventListener('click', () => { hideModal(document.getElementById('teacher-monitor')); });
}

// ===== AUTHENTICATION =====
function setupAuthentication() {
    document.getElementById('code-login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const code = document.getElementById('login-code').value.trim();
        const name = document.getElementById('student-name').value.trim() || 'Học sinh';
        
        if (!code) {
            showNotification('Vui lòng nhập mã đăng nhập', 'error');
            return;
        }

        try {
            if (code === 'admin79') {
                await loginAsTeacher(name);
            } else if (code.startsWith('HS')) {
                await loginAsStudent(code, name);
            } else {
                showNotification('Mã đăng nhập không hợp lệ', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Lỗi đăng nhập: ' + error.message, 'error');
        }
    });
}

async function loginAsTeacher(name) {
    isTeacherLoggedIn = true;
    currentUser = { uid: 'teacher_admin_79', name, role: 'teacher', code: 'admin79' };
    
    try {
        await db.ref('users/' + currentUser.uid).set({ 
            name, 
            role: 'teacher', 
            lastLogin: firebase.database.ServerValue.TIMESTAMP 
        });
    } catch (error) {
        console.warn("Không thể lưu teacher vào DB, vẫn tiếp tục...");
    }
    
    document.body.classList.add('teacher-role');
    document.body.classList.remove('student-role');
    document.body.classList.remove('not-logged-in');
    
    showNotification(`✅ Đăng nhập thành công - GV: ${name}`, 'success');
    updateUIAfterLogin();
}

async function loginAsStudent(code, name) {
    try {
        const studentSnapshot = await db.ref(`studentCodes/${code}`).once('value');
        const studentData = studentSnapshot.val();
        
        if (!studentData) {
            showNotification('Mã học sinh không tồn tại!', 'error');
            return;
        }
        
        if (studentData.name !== name) {
            showNotification('Họ tên không khớp với mã học sinh!', 'error');
            return;
        }

        // Cập nhật last login
        try {
            await db.ref(`studentCodes/${code}`).update({
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.warn("Không thể cập nhật lastLogin");
        }

        isTeacherLoggedIn = false;
        currentUser = { 
            uid: 'student_' + code + '_' + Date.now(), 
            name, 
            role: 'student', 
            code,
            classCode: studentData.classCode,
            className: studentData.className
        };
        
        // Lưu vào users
        try {
            await db.ref('users/' + currentUser.uid).set({ 
                name, 
                role: 'student', 
                code, 
                lastLogin: firebase.database.ServerValue.TIMESTAMP 
            });
        } catch (error) {
            console.warn("Không thể lưu student vào users");
        }
        
        document.body.classList.add('student-role');
        document.body.classList.remove('teacher-role');
        document.body.classList.remove('not-logged-in');
        
        showNotification(`✅ Đăng nhập thành công - HS: ${name}`, 'success');
        updateUIAfterLogin();
        
        // Hỏi mã lớp
        const sessionToJoin = prompt("Nhập mã lớp học để tham gia (bỏ trống nếu không có):");
        if (sessionToJoin && sessionToJoin.trim() !== '') {
            sessionCode = sessionToJoin.toUpperCase();
            joinSessionAsStudent();
            
            // 🎯 MỚI: Khởi tạo autoScoreData khi tham gia session
            initializeAutoScoreData();
        }
        
    } catch (error) {
        console.error('Student login error:', error);
        showNotification('Lỗi đăng nhập học sinh: ' + error.message, 'error');
    }
}

// 🎯 MỚI: Khởi tạo dữ liệu điểm tự động
function initializeAutoScoreData() {
    if (!currentQuestions) return;
    
    // Đếm số lượng câu hỏi theo từng loại
    const tnCount = currentQuestions.filter(q => q.type === 'multiple_choice').length;
    const tfCount = currentQuestions.filter(q => q.type === 'true_false').length * 4; // Mỗi câu có 4 mệnh đề
    const saCount = currentQuestions.filter(q => q.type === 'short_answer').length;
    
    autoScoreData = {
        tn_correct: 0,
        tn_total: tnCount,
        tn_score: 0,
        tf_correct: 0,
        tf_total: tfCount,
        tf_score: 0,
        sa_correct: 0,
        sa_total: saCount,
        sa_score: 0,
        total_score: 0,
        lastUpdate: null
    };
    
    console.log('📊 Khởi tạo autoScoreData:', autoScoreData);
}

function updateUIAfterLogin() {
    hideModal(document.getElementById('login-modal'));
    
    const loginBtn = document.getElementById('loginBtn');
    if (isTeacherLoggedIn) {
        loginBtn.innerHTML = '👨‍🏫 ' + currentUser.name;
        loginBtn.style.background = '#28a745';
        document.getElementById('teacherMonitorBtn').style.display = 'inline-block';
        document.getElementById('classManagementBtn').style.display = 'inline-block';
    } else {
        loginBtn.innerHTML = '👤 ' + currentUser.name;
        document.getElementById('studentInteractBtn').style.display = 'inline-block';
    }
}

// ===== SESSION MANAGEMENT =====
function setupSessionManagement() {
    // This function is kept for compatibility
}

function generateSessionCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function createNewSession() {
    if (!isTeacherLoggedIn) return showNotification('Chỉ giáo viên mới có thể tạo lớp học', 'error');
    sessionCode = generateSessionCode();
    try {
        await db.ref('sessions/' + sessionCode).set({
            created: firebase.database.ServerValue.TIMESTAMP,
            teacher: currentUser.name,
            status: 'active',
            currentSlide: 0
        });
        document.getElementById('monitor-session-code').textContent = sessionCode;
        showNotification(`✅ Đã tạo lớp học! Mã lớp: <strong>${sessionCode}</strong>`, 'success');
        startMonitoringSession();
    } catch (error) {
        console.error('Error creating session:', error);
        showNotification('Lỗi tạo lớp học: ' + error.message, 'error');
    }
}

function joinSessionAsStudent() {
    if (!sessionCode || !currentUser) return showNotification('Vui lòng đăng nhập và có mã lớp học', 'error');
    const studentRef = db.ref('sessions/' + sessionCode + '/students/' + currentUser.uid);
    studentRef.set({
        name: currentUser.name, code: currentUser.code,
        joined: firebase.database.ServerValue.TIMESTAMP,
        status: 'active', score: 0, progress: 0, currentSlide: 0,
        lastActivity: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        showNotification(`✅ Đã tham gia lớp học: ${sessionCode}`, 'success');
        listenToSessionChanges();
    }).catch(error => {
        console.error('Error joining session:', error);
        showNotification('Lỗi tham gia lớp học: ' + error.message, 'error');
    });
}

function listenToSessionChanges() {
    db.ref('sessions/' + sessionCode + '/currentSlide').on('value', snapshot => {
        const slideIndex = snapshot.val();
        if (slideIndex !== null && slideIndex !== undefined) {
            // Scroll to the section
            const section = document.getElementById(`section-${slideIndex}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
    
    db.ref('sessions/' + sessionCode + '/poll').on('value', snapshot => {
        const pollData = snapshot.val();
        if (pollData && pollData.active) showPoll(pollData);
        else hidePoll();
    });
}

function syncSlidesWithStudents() {
    if (!isTeacherLoggedIn || !sessionCode) return showNotification('Vui lòng tạo lớp học trước', 'error');
    
    // Get current active section
    const activeSection = document.querySelector('.slide-section.active-section');
    if (!activeSection) return;
    
    const sections = document.querySelectorAll('.slide-section');
    const slideIndex = Array.from(sections).indexOf(activeSection);
    
    db.ref('sessions/' + sessionCode + '/currentSlide').set(slideIndex)
        .then(() => showNotification(`✅ Đã đồng bộ bài ${slideIndex + 1}`, 'success'))
        .catch(error => showNotification('Lỗi đồng bộ bài: ' + error.message, 'error'));
}

// ===== CLASS MANAGEMENT =====
function setupClassManagement() {
    console.log("🔧 Khởi tạo quản lý lớp...");
    
    document.getElementById('classManagementBtn').addEventListener('click', () => {
        if (!isTeacherLoggedIn) {
            showNotification('Chỉ giáo viên mới có quyền quản lý lớp!', 'error');
            return;
        }
        showModal('class-management-modal');
        loadClassesList();
        loadStudentsList();
    });

    document.getElementById('create-class-btn').addEventListener('click', () => {
        showModal('create-class-modal');
    });

    document.getElementById('create-class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewClass();
    });

    document.getElementById('refresh-classes-btn').addEventListener('click', () => {
        loadClassesList();
        loadStudentsList();
    });

    // Search and filter
    document.getElementById('search-student-global').addEventListener('input', loadStudentsList);
    document.getElementById('filter-class').addEventListener('change', loadStudentsList);
    
    // Additional buttons
    document.getElementById('class-poll-btn').addEventListener('click', startClassPoll);
    document.getElementById('class-sync-btn').addEventListener('click', syncClassSlides);
    document.getElementById('view-poll-results-btn').addEventListener('click', viewClassPollResults);
    document.getElementById('view-interactions-btn').addEventListener('click', viewClassInteractions);
}

async function createNewClass() {
    const className = document.getElementById('class-name').value.trim();
    const classDescription = document.getElementById('class-description').value.trim();

    if (!className) {
        showNotification('Vui lòng nhập tên lớp!', 'error');
        return;
    }

    try {
        const classCode = generateClassCode();
        const classData = {
            name: className,
            description: classDescription,
            code: classCode,
            teacher: currentUser.name,
            teacherId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            studentCount: 0,
            status: 'active'
        };

        await db.ref(`classes/${classCode}`).set(classData);
        
        hideModal(document.getElementById('create-class-modal'));
        document.getElementById('create-class-form').reset();
        
        showNotification(`✅ Đã tạo lớp "${className}" với mã: ${classCode}`, 'success');
        loadClassesList();
        
    } catch (error) {
        console.error('Lỗi tạo lớp:', error);
        showNotification('❌ Lỗi khi tạo lớp!', 'error');
    }
}

function generateClassCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

async function loadClassesList() {
    try {
        const snapshot = await db.ref('classes').orderByChild('createdAt').once('value');
        const classes = snapshot.val() || {};
        
        const tbody = document.getElementById('classes-list-body');
        let html = '';
        
        Object.entries(classes).forEach(([classCode, classData]) => {
            if (classData.teacherId !== currentUser.uid) return;
            
            const createDate = classData.createdAt ? 
                new Date(classData.createdAt).toLocaleDateString('vi-VN') : 'N/A';
            
            html += `
                <tr>
                    <td>
                        <strong>${classData.name}</strong>
                        ${classData.description ? `<br><small style="color: #666;">${classData.description}</small>` : ''}
                    </td>
                    <td><code style="background: #1a237e; color: white; padding: 4px 8px; border-radius: 4px;">${classCode}</code></td>
                    <td style="text-align: center;">
                        <span style="font-weight: bold; color: #1a237e;">${classData.studentCount || 0}</span>
                    </td>
                    <td>${createDate}</td>
                    <td style="text-align: center;">
                        <span class="status-active">🟢 Hoạt động</span>
                    </td>
                    <td style="text-align: center;">
                        <button onclick="viewClassDetails('${classCode}')" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin: 2px;">
                            👁️ Xem
                        </button>
                        <button onclick="confirmDeleteClass('${classCode}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin: 2px;">
                            🗑️ Xóa
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html || `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: #666;">
                    Chưa có lớp học nào. Hãy tạo lớp đầu tiên!
                </td>
            </tr>
        `;
        
        updateClassFilter(classes);
        
    } catch (error) {
        console.error('Lỗi tải danh sách lớp:', error);
        document.getElementById('classes-list-body').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: #dc3545;">
                    ❌ Lỗi khi tải danh sách lớp
                </td>
            </tr>
        `;
    }
}

function confirmDeleteClass(classCode) {
    document.getElementById('confirm-delete-message').textContent = 
        `Bạn có chắc chắn muốn xóa lớp này? Hành động này không thể hoàn tác.`;
    
    document.getElementById('confirm-delete-yes').onclick = function() {
        deleteClass(classCode);
        hideModal(document.getElementById('confirm-delete-modal'));
    };
    
    showModal('confirm-delete-modal');
}

async function deleteClass(classCode) {
    try {
        await db.ref(`classes/${classCode}`).remove();
        showNotification('✅ Đã xóa lớp thành công!', 'success');
        loadClassesList();
    } catch (error) {
        console.error('Lỗi xóa lớp:', error);
        showNotification('❌ Lỗi khi xóa lớp!', 'error');
    }
}

function updateClassFilter(classes) {
    const filterSelect = document.getElementById('filter-class');
    let options = '<option value="all">Tất cả lớp</option>';
    
    Object.entries(classes).forEach(([classCode, classData]) => {
        if (classData.teacherId === currentUser.uid) {
            options += `<option value="${classCode}">${classData.name} (${classCode})</option>`;
        }
    });
    
    filterSelect.innerHTML = options;
}

// ===== STUDENT CODE MANAGEMENT =====
function setupStudentCodeManagement() {
    console.log("🔧 Khởi tạo quản lý mã học sinh...");
    
    document.getElementById('assign-student-btn-main').addEventListener('click', () => {
        if (!isTeacherLoggedIn) {
            showNotification('Chỉ giáo viên mới có quyền cấp mã!', 'error');
            return;
        }
        showModal('assign-student-modal');
        loadClassesForAssignment();
        generateStudentCode();
    });

    document.getElementById('view-student-codes-btn').addEventListener('click', () => {
        showModal('student-codes-modal');
        loadStudentCodesList();
    });

    document.getElementById('generate-student-code-btn').addEventListener('click', generateStudentCode);
    document.getElementById('assign-student-btn').addEventListener('click', assignStudentCode);
}

async function loadClassesForAssignment() {
    try {
        const snapshot = await db.ref('classes').once('value');
        const classes = snapshot.val() || {};
        const select = document.getElementById('select-class-for-student');
        
        let options = '<option value="">-- Chọn lớp --</option>';
        
        Object.entries(classes).forEach(([classCode, classData]) => {
            if (classData.teacherId === currentUser.uid) {
                options += `<option value="${classCode}">${classData.name} (${classCode})</option>`;
            }
        });
        
        select.innerHTML = options;
        
    } catch (error) {
        console.error('Lỗi tải danh sách lớp:', error);
    }
}

function generateStudentCode() {
    const prefix = 'HS';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const studentCode = `${prefix}${randomNum}`;
    
    document.getElementById('generated-student-code').textContent = studentCode;
    return studentCode;
}

function generatePassword(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
}

async function assignStudentCode() {
    const classCode = document.getElementById('select-class-for-student').value;
    const studentName = document.getElementById('student-fullname').value.trim();
    const studentCode = document.getElementById('generated-student-code').textContent;

    if (!classCode) {
        showNotification('Vui lòng chọn lớp!', 'error');
        return;
    }

    if (!studentName) {
        showNotification('Vui lòng nhập họ tên học sinh!', 'error');
        return;
    }

    try {
        const password = generatePassword();
        
        const studentCodeData = {
            code: studentCode,
            name: studentName,
            classCode: classCode,
            className: await getClassName(classCode),
            password: password,
            teacherId: currentUser.uid,
            teacherName: currentUser.name,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: 'active'
        };

        await db.ref(`studentCodes/${studentCode}`).set(studentCodeData);
        await updateStudentCountInClass(classCode);

        showNotification(`✅ Đã cấp mã ${studentCode} cho ${studentName} trong lớp`, 'success');
        loadStudentCodesList();
        loadStudentsList();
        
        document.getElementById('student-fullname').value = '';
        document.getElementById('student-fullname').focus();
        generateStudentCode();

    } catch (error) {
        console.error('Lỗi cấp mã học sinh:', error);
        showNotification('❌ Lỗi khi cấp mã học sinh!', 'error');
    }
}

async function getClassName(classCode) {
    try {
        const snapshot = await db.ref(`classes/${classCode}/name`).once('value');
        return snapshot.val() || 'Unknown Class';
    } catch (error) {
        return 'Unknown Class';
    }
}

async function updateStudentCountInClass(classCode) {
    try {
        const snapshot = await db.ref('studentCodes').orderByChild('classCode').equalTo(classCode).once('value');
        const students = snapshot.val() || {};
        const studentCount = Object.keys(students).length;
        
        await db.ref(`classes/${classCode}/studentCount`).set(studentCount);
    } catch (error) {
        console.error('Lỗi cập nhật số lượng học sinh:', error);
    }
}

async function loadStudentCodesList() {
    try {
        const snapshot = await db.ref('studentCodes').once('value');
        const studentCodes = snapshot.val() || {};
        
        const tbody = document.getElementById('student-codes-list');
        let html = '';
        
        Object.entries(studentCodes).forEach(([code, data]) => {
            if (data.teacherId !== currentUser.uid) return;
            
            const createDate = data.createdAt ? 
                new Date(data.createdAt).toLocaleDateString('vi-VN') : 'N/A';
            
            const status = '<span class="status-active">Hoạt động</span>';
            
            html += `
                <tr>
                    <td><strong>${code}</strong></td>
                    <td>${data.name}</td>
                    <td>${data.classCode}</td>
                    <td>${createDate}</td>
                    <td>${status}</td>
                    <td>${data.password}</td>
                    <td>
                        <button onclick="revokeStudentCode('${code}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            🔒 Khóa
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html || `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    Chưa có mã học sinh nào được cấp
                </td>
            </tr>
        `;
        
    } catch (error) {
        console.error('Lỗi tải danh sách mã học sinh:', error);
    }
}

async function revokeStudentCode(codeId) {
    try {
        await db.ref(`studentCodes/${codeId}/status`).set('revoked');
        showNotification(`✅ Đã thu hồi mã ${codeId}!`, 'success');
        loadStudentCodesList();
    } catch (error) {
        console.error('Lỗi thu hồi mã học sinh:', error);
        showNotification('❌ Lỗi khi thu hồi mã!', 'error');
    }
}

// ===== STUDENT LIST =====
async function loadStudentsList() {
    try {
        const searchTerm = document.getElementById('search-student-global').value.toLowerCase();
        const selectedClass = document.getElementById('filter-class').value;
        
        const [studentCodesSnapshot, usersSnapshot, attemptsSnapshot] = await Promise.all([
            db.ref('studentCodes').once('value'),
            db.ref('users').once('value'),
            db.ref('attempts').once('value')
        ]);
        
        const studentCodes = studentCodesSnapshot.val() || {};
        const allUsers = usersSnapshot.val() || {};
        const allAttempts = attemptsSnapshot.val() || {};
        
        const tbody = document.getElementById('students-list-body');
        let html = '';
        let studentCount = 0;

        const synchronizedStudents = new Map();

        // From studentCodes
        Object.entries(studentCodes).forEach(([code, codeData]) => {
            if (codeData.teacherId !== currentUser.uid) return;
            
            const studentId = `student_${code}`;
            synchronizedStudents.set(code, {
                code: code,
                name: codeData.name,
                classCode: codeData.classCode,
                className: codeData.className || 'Chưa có lớp',
                status: codeData.status || 'active',
                createdAt: codeData.createdAt,
                lastLogin: null,
                attempts: [],
                totalScore: 0
            });
        });

        // From users
        Object.entries(allUsers).forEach(([userId, userData]) => {
            if (userData.role === 'student' && userData.code) {
                const code = userData.code;
                if (synchronizedStudents.has(code)) {
                    const student = synchronizedStudents.get(code);
                    student.lastLogin = userData.lastLogin;
                    student.status = userData.status || student.status;
                }
            }
        });

        // From attempts
        Object.values(allAttempts).forEach(sessionAttempts => {
            Object.entries(sessionAttempts).forEach(([studentId, attempt]) => {
                const code = attempt.code;
                if (synchronizedStudents.has(code)) {
                    const student = synchronizedStudents.get(code);
                    student.attempts.push(attempt);
                    student.totalScore += parseFloat(attempt.score) || 0;
                    
                    if (attempt.createdAt > (student.lastActivity || 0)) {
                        student.lastActivity = attempt.createdAt;
                    }
                }
            });
        });

        // Display
        synchronizedStudents.forEach((student, code) => {
            if (searchTerm && 
                !student.name.toLowerCase().includes(searchTerm) && 
                !student.code.toLowerCase().includes(searchTerm)) {
                return;
            }
            
            if (selectedClass !== 'all' && student.classCode !== selectedClass) {
                return;
            }
            
            studentCount++;
            
            const attemptCount = student.attempts.length;
            const avgScore = attemptCount > 0 ? (student.totalScore / attemptCount).toFixed(2) : '0.00';
            const lastActivity = student.lastActivity ? getTimeAgo(student.lastActivity) : 
                              student.lastLogin ? getTimeAgo(student.lastLogin) : 'Chưa hoạt động';
            
            html += `
                <tr>
                    <td><strong>${student.code}</strong></td>
                    <td>${student.name}</td>
                    <td>
                        ${student.classCode}
                        ${student.className !== 'Chưa có lớp' ? `<br><small style="color: #666;">${student.className}</small>` : ''}
                    </td>
                    <td>${lastActivity}</td>
                    <td style="text-align: center;">
                        <span style="font-weight: bold; color: #1a237e;">${attemptCount}</span>
                    </td>
                    <td style="text-align: center;">
                        <span style="font-weight: bold; color: ${getScoreColor(parseFloat(avgScore))}">
                            ${avgScore}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <button onclick="viewStudentProfile('${code}')" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin: 2px;">
                            📊
                        </button>
                        <button onclick="editStudent('${code}')" style="padding: 6px 12px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin: 2px;">
                            ✏️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html || `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    Không tìm thấy học sinh nào.
                </td>
            </tr>
        `;
        
    } catch (error) {
        console.error('Lỗi tải danh sách học sinh:', error);
        document.getElementById('students-list-body').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #dc3545;">
                    ❌ Lỗi khi tải danh sách học sinh
                </td>
            </tr>
        `;
    }
}

function getTimeAgo(timestamp) {
    if (!timestamp) return '--:--';
    
    const now = Date.now();
    const time = typeof timestamp === 'number' ? timestamp : timestamp;
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
}

function getScoreColor(score) {
    if (score >= 8) return '#28a745';
    if (score >= 5) return '#ffc107';
    return '#dc3545';
}

async function viewStudentProfile(studentId) {
    try {
        const userSnapshot = await db.ref(`users/${studentId}`).once('value');
        const userData = userSnapshot.val();
        
        const attemptsSnapshot = await db.ref('attempts').once('value');
        const allAttempts = attemptsSnapshot.val() || {};
        
        let studentAttempts = [];
        Object.values(allAttempts).forEach(sessionAttempts => {
            if (sessionAttempts[studentId]) {
                studentAttempts.push(sessionAttempts[studentId]);
            }
        });
        
        const totalAttempts = studentAttempts.length;
        const totalScore = studentAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score || 0), 0);
        const avgScore = totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : '0.00';
        const bestScore = Math.max(...studentAttempts.map(a => parseFloat(a.score || 0)));
        const lastAttempt = studentAttempts.length > 0 ? 
            new Date(studentAttempts[studentAttempts.length - 1].createdAt).toLocaleDateString('vi-VN') : 'Chưa có';
        
        const message = `
            👤 <b>Hồ sơ Học sinh</b>
            📛 Tên: ${userData?.name || 'N/A'}
            🆔 Mã: ${userData?.code || 'N/A'}
            
            📊 <b>Thống kê:</b>
            📝 Tổng bài làm: ${totalAttempts}
            🎯 Điểm trung bình: ${avgScore}
            🏆 Điểm cao nhất: ${bestScore.toFixed(2)}
            ⏰ Lần cuối làm bài: ${lastAttempt}
        `;
        
        showNotification(message, 'info');
        
    } catch (error) {
        console.error('Lỗi xem hồ sơ học sinh:', error);
        showNotification('❌ Lỗi khi tải thông tin học sinh!', 'error');
    }
}

async function editStudent(studentCode) {
    try {
        const snapshot = await db.ref(`studentCodes/${studentCode}`).once('value');
        const studentData = snapshot.val();
        
        if (!studentData) {
            showNotification('Không tìm thấy học sinh!', 'error');
            return;
        }

        const newName = prompt('Nhập tên mới cho học sinh:', studentData.name);
        if (!newName || newName.trim() === '') return;

        const newClassCode = prompt('Nhập mã lớp mới:', studentData.classCode);
        if (!newClassCode) return;

        await db.ref(`studentCodes/${studentCode}`).update({
            name: newName.trim(),
            classCode: newClassCode,
            className: await getClassName(newClassCode)
        });

        const userId = `student_${studentCode}`;
        await db.ref(`users/${userId}`).update({
            name: newName.trim(),
            classCode: newClassCode
        });

        await updateStudentCountInClass(studentData.classCode);
        await updateStudentCountInClass(newClassCode);

        showNotification(`✅ Đã cập nhật thông tin học sinh ${studentCode}`, 'success');
        loadStudentsList();
        
    } catch (error) {
        console.error('Lỗi chỉnh sửa học sinh:', error);
        showNotification('❌ Lỗi khi cập nhật thông tin học sinh!', 'error');
    }
}

// ===== ANSWER CHECKING FUNCTIONS =====
window.toggleSolution = function(questionId) {
    const solution = document.getElementById('solution-' + questionId);
    if (solution) {
        solution.style.display = solution.style.display === 'none' ? 'block' : 'none';
    }
};

window.checkAnswer = function(qid, correct) {
    try {
        const container = document.getElementById(qid);
        if (!container) {
            console.error(`Không tìm thấy container cho câu hỏi: ${qid}`);
            showNotification('Lỗi: Không tìm thấy câu hỏi!', 'error');
            return;
        }

        container.querySelectorAll('.option-icon').forEach(el => el.textContent = '');

        const chosen = container.querySelector(`input[name="${qid}"]:checked`);
        if (!chosen) {
            showNotification("Hãy chọn một đáp án!", 'warning');
            playSound('wrong');
            return;
        }

        const chosenVal = chosen.value;
        const resultArea = container.querySelector(".answer-check");

        let feedback = resultArea.querySelector(".result");
        if (!feedback) {
            feedback = document.createElement("div");
            feedback.className = "result";
            feedback.style.marginTop = "10px";
            feedback.style.padding = "12px";
            feedback.style.background = "rgba(255,255,255,0.9)";
            feedback.style.borderRadius = "8px";
            feedback.style.border = "1px solid #e0e0e0";
            feedback.style.fontSize = "0.95em";
            resultArea.appendChild(feedback);
        }

        if (chosenVal === correct) {
            const userOption = chosen.closest('.option-row');
            const icon = userOption.querySelector('.option-icon');
            if (icon) icon.textContent = '✅';
            
            feedback.innerHTML = `
                <div style="color: #28a745; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    <span>✅</span>
                    <span><b>Chính xác!</b></span>
                </div>
                <div style="margin-top: 8px; padding: 8px; background: #d4edda; border-radius: 6px;">
                    Đáp án của bạn: <b>${chosenVal}</b>
                </div>
            `;
            
            container.querySelectorAll('.option-row').forEach(row => {
                const radio = row.querySelector('input[type="radio"]');
                radio.disabled = true;
                if (radio.value === correct) {
                    row.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                    row.style.borderColor = '#28a745';
                }
            });
            
            playSound('correct');
            
            if (currentUser && sessionCode) {
                savePartial(qid, chosenVal, correct, true);
            }
            
            showNotification(`✅ Câu ${qid}: Chính xác! (+0.25 điểm)`, 'success');
            
        } else {
            const userOption = chosen.closest('.option-row');
            const correctOption = container.querySelector(`input[value="${correct}"]`).closest('.option-row');
            
            const userIcon = userOption?.querySelector('.option-icon');
            const correctIcon = correctOption?.querySelector('.option-icon');
            
            if (userIcon) userIcon.textContent = '❌';
            if (correctIcon) correctIcon.textContent = '✅';
            
            feedback.innerHTML = `
                <div style="color: #dc3545; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    <span>❌</span>
                    <span><b>Sai rồi.</b></span>
                </div>
                <div style="margin-top: 8px; padding: 8px; background: #f8d7da; border-radius: 6px;">
                    Bạn chọn: <b>${chosenVal}</b>
                </div>
                <div style="margin-top: 5px; padding: 8px; background: #d4edda; border-radius: 6px;">
                    Đáp án đúng: <b style="color: #28a745">${correct}</b>
                </div>
            `;
            
            container.querySelectorAll('.option-row').forEach(row => {
                const radio = row.querySelector('input[type="radio"]');
                radio.disabled = true;
                const value = radio.value;
                if (value === correct) {
                    row.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                    row.style.borderColor = '#28a745';
                } else if (value === chosenVal) {
                    row.style.background = 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
                    row.style.borderColor = '#dc3545';
                }
            });
            
            playSound('wrong');
            
            if (currentUser && sessionCode) {
                savePartial(qid, chosenVal, correct, false);
            }
            
            showNotification(`❌ Câu ${qid}: Chưa chính xác`, 'error');
        }
        
    } catch (error) {
        console.error('Lỗi trong checkAnswer:', error);
        showNotification('Có lỗi xảy ra khi kiểm tra đáp án!', 'error');
    }
};

window.checkTrueFalseAnswer = function(questionId, correctAnswers) {
    console.log("🔍 === KIỂM TRA TRUE/FALSE ===");
    console.log("Question:", questionId);
    console.log("Answers param:", correctAnswers);
    
    // 1. Tìm container
    const container = document.getElementById(questionId);
    if (!container) {
        console.error("❌ Không tìm thấy container với ID:", questionId);
        showNotification("Không tìm thấy câu hỏi!", "error");
        return;
    }
    console.log("✅ Found container");
    
    // 2. Parse answers
    let answers = [];
    try {
        if (typeof correctAnswers === 'string') {
            // Xử lý chuỗi như "[True, True, True, False]"
            const clean = correctAnswers
                .replace(/^\[|\]$/g, '') // Bỏ []
                .replace(/"/g, '')       // Bỏ "
                .replace(/'/g, '');      // Bỏ '
            
            answers = clean.split(',').map(item => {
                const trimmed = item.trim().toLowerCase();
                return trimmed === 'true' || trimmed === 'đúng';
            });
        } else if (Array.isArray(correctAnswers)) {
            answers = correctAnswers.map(ans => {
                if (typeof ans === 'boolean') return ans;
                if (typeof ans === 'string') {
                    return ans.toLowerCase() === 'true' || ans === 'Đúng';
                }
                return Boolean(ans);
            });
        }
    } catch (e) {
        console.error("❌ Parse answers error:", e);
        showNotification("Lỗi xử lý đáp án!", "error");
        return;
    }
    
    console.log("Parsed answers:", answers);
    
    // 3. Tìm các option rows
    const optionRows = container.querySelectorAll(".option-row");
    console.log("Found option rows:", optionRows.length);
    
    if (optionRows.length === 0) {
        console.error("❌ Không tìm thấy .option-row trong container");
        console.log("Container children:", container.children);
        return;
    }
    
    // 4. Kiểm tra từng câu
    let allCorrect = true;
    let correctCount = 0;
    let feedbackHtml = '';
    
    optionRows.forEach((row, idx) => {
        console.log(`--- Row ${idx} ---`);
        
        // Tìm các radio buttons trong row
        const radios = row.querySelectorAll('input[type="radio"]');
        console.log(`Radio buttons found: ${radios.length}`);
        
        let selectedValue = null;
        radios.forEach(radio => {
            console.log(`  Radio: name="${radio.name}", value="${radio.value}", checked=${radio.checked}`);
            if (radio.checked) selectedValue = radio.value;
        });
        
        const expectedAnswer = idx < answers.length ? answers[idx] : false;
        const expectedText = expectedAnswer ? "True" : "False";
        const letter = String.fromCharCode(97 + idx); // a, b, c, d
        
        console.log(`Selected: ${selectedValue}, Expected: ${expectedText}`);
        
        if (selectedValue === null) {
            feedbackHtml += `<div style="color: #ffc107; margin: 5px 0;">${letter}) ⭕ Chưa chọn</div>`;
            allCorrect = false;
        } else if (selectedValue === expectedText) {
            correctCount++;
            feedbackHtml += `<div style="color: #28a745; margin: 5px 0;">${letter}) ✅ Đúng (${selectedValue})</div>`;
            
            // Highlight correct
            radios.forEach(radio => {
                if (radio.value === selectedValue) {
                    radio.parentElement.style.color = '#28a745';
                    radio.parentElement.style.fontWeight = 'bold';
                }
            });
        } else {
            feedbackHtml += `<div style="color: #dc3545; margin: 5px 0;">
                ${letter}) ❌ Sai (Chọn: ${selectedValue}, Đáp án: ${expectedText})
            </div>`;
            allCorrect = false;
            
            // Highlight wrong and correct
            radios.forEach(radio => {
                if (radio.checked) {
                    radio.parentElement.style.color = '#dc3545';
                }
                if (radio.value === expectedText) {
                    radio.parentElement.style.color = '#28a745';
                    radio.parentElement.style.fontWeight = 'bold';
                }
            });
        }
        
        // Disable radios
        radios.forEach(radio => radio.disabled = true);
    });
    
    // 5. Hiển thị kết quả
    const score = correctCount * 0.25;
    const resultDiv = document.createElement('div');
    resultDiv.innerHTML = `
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
            <h4 style="color: #1a237e; margin-bottom: 10px;">📊 Kết quả:</h4>
            ${feedbackHtml}
            <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Đúng:</strong> ${correctCount}/4 câu<br>
                <strong>Điểm:</strong> <span style="color: ${allCorrect ? '#28a745' : '#ffc107'}">${score.toFixed(2)}/1.00</span><br>
                <strong>Kết quả:</strong> ${allCorrect ? '🎉 Hoàn hảo!' : 'Cần cố gắng hơn!'}
            </div>
        </div>
    `;
    
    // Xóa kết quả cũ nếu có
    const oldResult = container.querySelector('.true-false-result');
    if (oldResult) oldResult.remove();
    
    resultDiv.className = 'true-false-result';
    container.appendChild(resultDiv);
    
    // 6. Thông báo
    console.log(`✅ Check completed: ${correctCount}/4 correct, score: ${score}`);
    if (allCorrect) {
        showNotification(`🎉 Hoàn toàn chính xác! (${correctCount}/4)`, 'success');
    } else {
        showNotification(`Đúng ${correctCount}/4 mệnh đề`, 'warning');
    }
};

window.checkShortAnswer = function(qid, correct) {
    const input = document.getElementById(`input-${qid}`);
    const icon = document.getElementById(`icon-${qid}`);
    const resultBox = input?.closest(".answer-check");

    if (!input) return;

    const userAnswer = input.value.trim();

    let feedback = resultBox.querySelector(".result");
    if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "result";
        feedback.style.marginTop = "10px";
        feedback.style.padding = "12px";
        feedback.style.borderRadius = "8px";
        feedback.style.background = "rgba(255,255,255,0.9)";
        feedback.style.border = "1px solid #e0e0e0";
        feedback.style.fontSize = "0.95em";
        resultBox.appendChild(feedback);
    }

    if (userAnswer === "") {
        icon.textContent = "⚠️";
        feedback.innerHTML = "❗ <b>Báo thầy kiểm trực tiếp vì chưa giải.</b>";
        playSound('wrong');
        return;
    }

    const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, '');
    const normalizedCorrect = correct.trim().toLowerCase().replace(/\s+/g, '');

    if (normalizedUser === normalizedCorrect) {
        icon.textContent = "✅";
        feedback.innerHTML = `
            <div style="color: #28a745; font-weight: bold;">
                🎯 <b>Đúng rồi!</b>
            </div>
            <div style="margin-top: 5px;">Đáp án của bạn: <b>${userAnswer}</b></div>
        `;
        input.style.borderColor = '#28a745';
        input.style.background = '#d4edda';
        input.disabled = true;
        
        if (currentUser && sessionCode) {
            try { savePartial(qid, userAnswer, correct, true); } catch(e){}
        }
        playSound('correct');
        showNotification(`✅ Câu ${qid}: Chính xác!`, 'success');
    } else {
        icon.textContent = "❌";
        feedback.innerHTML = `
            <div style="color: #dc3545; font-weight: bold;">
                ❌ <b>Sai rồi.</b>
            </div>
            <div style="margin-top: 5px;">Đáp án của bạn: <b>${userAnswer}</b></div>
            <div>Đáp án đúng là: <b style="color: #28a745">${correct}</b></div>
        `;
        input.style.borderColor = '#dc3545';
        input.style.background = '#f8d7da';
        input.disabled = true;
        
        if (currentUser && sessionCode) {
            try { savePartial(qid, userAnswer, correct, false); } catch(e){}
        }
        playSound('wrong');
        showNotification(`❌ Câu ${qid}: Chưa chính xác`, 'error');
    }
};

function playSound(type) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = type === 'correct' ? 'Chính xác!' : (type === 'partial' ? 'Gần đúng rồi' : 'Sai rồi!');
        utterance.lang = 'vi-VN';
        utterance.volume = 0.7;
        utterance.rate = 1.2;
        speechSynthesis.speak(utterance);
    }
}

// =========== HỆ THỐNG LƯU VÀ TÍNH ĐIỂM HOÀN CHỈNH ===========
window.savePartial = async function(questionId, userAnswer, correctAnswer, isCorrect) {
    if (!currentUser || !currentExam) return;
    
    const studentCode = currentUser.code; 
    const examId = currentExam.id;
    
    if (!studentCode || !examId) {
        console.warn("Thiếu mã học sinh hoặc mã đề thi");
        return;
    }

    // CẤU TRÚC SẠCH: homeworkResults/{examId}/{studentCode}/{questionId}
    const dbPath = `homeworkResults/${examId}/${studentCode}/${questionId}`;
    
    try {
        await db.ref(dbPath).set({
            questionId: questionId,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            studentCode: studentCode,
            studentName: currentUser.name,
            examId: examId,
            examName: currentExam.name,
            className: currentUser.className || 'Chưa có lớp',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log(`✅ Đã lưu: ${studentCode} - Câu ${questionId}`);
        
    } catch (err) {
        console.error("Lỗi lưu bài tập:", err);
    }
};

window.saveAttempt = async function(examId, studentAnswers, correctAnswers, totalScore) {
    if (!currentUser || !examId) return;
    
    const studentCode = currentUser.code;
    
    // Tạo ID duy nhất: exam_student_timestamp
    const attemptId = `${examId}_${studentCode}_${Date.now()}`;
    
    const attemptData = {
        attemptId: attemptId,
        studentCode: studentCode,
        studentName: currentUser.name,
        examId: examId,
        examName: currentExam?.name || examId,
        totalScore: parseFloat(totalScore),
        totalQuestions: Object.keys(correctAnswers).length,
        answeredQuestions: Object.keys(studentAnswers).filter(k => 
            studentAnswers[k] && studentAnswers[k] !== '' && 
            !(Array.isArray(studentAnswers[k]) && studentAnswers[k].every(item => item === null))
        ).length,
        studentAnswers: studentAnswers,
        correctAnswers: correctAnswers,
        className: currentUser.className || 'Chưa có lớp',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        source: 'calculateFinalScore'
    };
    
    try {
        // LƯU VÀO 2 NƠI QUAN TRỌNG NHẤT:
        
        // 1. attempts/{attemptId} - để query tất cả kết quả
        await db.ref(`attempts/${attemptId}`).set(attemptData);
        
        // 2. students/{studentCode}/attempts/{attemptId} - để query theo học sinh
        await db.ref(`students/${studentCode}/attempts/${attemptId}`).set({
            examId: examId,
            examName: attemptData.examName,
            totalScore: attemptData.totalScore,
            timestamp: attemptData.timestamp
        });
        
        console.log(`✅ Đã lưu kết quả: ${studentCode} - ${totalScore} điểm`);
        showNotification(`✅ Đã lưu kết quả: ${totalScore} điểm`, 'success');
        
    } catch (err) {
        console.error("Lỗi lưu kết quả:", err);
        showNotification('❌ Lỗi khi lưu kết quả', 'error');
    }
};

window.calculateFinalScore = async function() {
    console.log("🎯 Bắt đầu tính điểm...");
    
    // [SỬA 1] Tạm khóa dòng này để Giáo viên có thể test
    // if (isTeacherLoggedIn) { showNotification("Giáo viên không tính điểm.", "info"); return; }
    
    if (!currentUser || !currentExam) {
        showNotification("Vui lòng đăng nhập và chọn đề thi.", "error");
        return;
    }
    
    if (!currentQuestions || currentQuestions.length === 0) {
        showNotification("Không tìm thấy dữ liệu đề thi.", "error");
        return;
    }

    // === BƯỚC 1: CHUẨN BỊ DỮ LIỆU ===
    const correctAnswers = {};
    const studentAnswers = {};
    let totalAnswered = 0;
    
    currentQuestions.forEach(q => {
        if (!q.id) return;
        
        // 1. Lấy đáp án ĐÚNG
        switch (q.type) {
            case 'multiple_choice':
                correctAnswers[q.id] = q.correct || '';
                break;
            case 'true_false':
                if (Array.isArray(q.answers)) {
                    correctAnswers[q.id] = q.answers.map(ans => String(ans).trim().toLowerCase() === 'true');
                } else {
                    correctAnswers[q.id] = [];
                }
                break;
            case 'short_answer':
                correctAnswers[q.id] = q.answer || '';
                break;
        }
        
        // 2. Lấy đáp án HỌC SINH
        let userAnswer = '';
        if (q.type === 'multiple_choice') {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            userAnswer = selected ? selected.value.trim() : '';
            
        } else if (q.type === 'true_false') {
            const subAnswers = [];
            const questionElement = document.getElementById(q.id);
            if (questionElement) {
                // Duyệt qua 4 ý a,b,c,d
                ['a', 'b', 'c', 'd'].forEach(char => {
                    const selected = document.querySelector(`input[name="${q.id}_${char}"]:checked`);
                    subAnswers.push(selected ? (selected.value.trim().toLowerCase() === 'true') : null);
                });
            }
            userAnswer = subAnswers;
            
        } else if (q.type === 'short_answer') {
            const input = document.getElementById(`input-${q.id}`);
            userAnswer = input ? input.value.trim() : '';
        }
        
        studentAnswers[q.id] = userAnswer;
        
        // Đếm số câu đã trả lời
        if (q.type === 'true_false') {
            if (userAnswer.some(x => x !== null)) totalAnswered++;
        } else if (userAnswer && userAnswer !== '') {
            totalAnswered++;
        }
    });

    // === BƯỚC 2: TÍNH ĐIỂM TỔNG (Logic mới 2025) ===
    let totalScore = 0;
    
    for (const qId in correctAnswers) {
        const userAns = studentAnswers[qId];
        const correctAns = correctAnswers[qId];
        const question = currentQuestions.find(q => q.id === qId);
        
        if (!question) continue;
        
        switch (question.type) {
            case 'multiple_choice':
                if (String(userAns).toUpperCase() === String(correctAns).toUpperCase()) {
                    totalScore += 0.25;
                }
                break;
                
            case 'short_answer':
                if (userAns) {
                    const normUser = String(userAns).replace(',', '.').trim().toLowerCase();
                    const normCorrect = String(correctAns).replace(',', '.').trim().toLowerCase();
                    if (normUser === normCorrect) totalScore += 0.5; // [CHUẨN] TLN là 0.5 điểm
                }
                break;
                
            case 'true_false':
                if (Array.isArray(userAns) && Array.isArray(correctAns)) {
                    let correctCount = 0;
                    for (let i = 0; i < 4; i++) {
                        if (userAns[i] !== null && correctAns[i] !== undefined && userAns[i] === correctAns[i]) {
                            correctCount++;
                        }
                    }
                    // [SỬA 2] Thang điểm bậc thang 2025
                    if (correctCount === 1) totalScore += 0.1;
                    else if (correctCount === 2) totalScore += 0.25;
                    else if (correctCount === 3) totalScore += 0.5;
                    else if (correctCount === 4) totalScore += 1.0;
                }
                break;
        }
    }
    
    const finalScore = Math.min(parseFloat(totalScore.toFixed(2)), 10.00);

    // === BƯỚC 3: LƯU KẾT QUẢ ===
    // Lưu chi tiết từng câu (chạy ngầm không cần await để nhanh hơn)
    for (const qId in studentAnswers) {
        if (studentAnswers[qId]) {
            // Logic tính isCorrect cơ bản để lưu log
            let isCorrect = false; 
            // (Bạn có thể thêm logic xác định isCorrect ở đây nếu cần thiết cho log)
            window.savePartial(qId, studentAnswers[qId], correctAnswers[qId], isCorrect).catch(()=>{});
        }
    }

    // Lưu tổng kết
    await window.saveAttempt(currentExam.id, studentAnswers, correctAnswers, finalScore);

    // === BƯỚC 4: HIỂN THỊ ===
    showFinalScoreResult(finalScore, totalAnswered, currentQuestions.length);
    console.log(`📊 Kết quả: ${finalScore}`);
};
function showFinalScoreResult(score, answered, total) {
    // Xóa kết quả cũ nếu có
    const oldResult = document.getElementById('score-result-final');
    if (oldResult) oldResult.remove();
    
    // Tạo container mới
    const resultBox = document.createElement('div');
    resultBox.id = 'score-result-final';
    resultBox.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #1a237e, #3949ab);
        color: white;
        padding: 25px;
        border-radius: 15px;
        z-index: 10000;
        width: 320px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideIn 0.5s ease;
        font-family: 'Segoe UI', sans-serif;
        border: 3px solid #4a6bff;
    `;
    
    // Thêm CSS animation
    if (!document.querySelector('#score-animation')) {
        const style = document.createElement('style');
        style.id = 'score-animation';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Xác định màu và icon theo điểm
    let scoreColor = '#ff6b6b';
    let scoreIcon = '❌';
    let message = 'Cần cố gắng thêm!';
    
    if (score >= 8) {
        scoreColor = '#4cd964';
        scoreIcon = '🏆';
        message = 'Xuất sắc!';
    } else if (score >= 5) {
        scoreColor = '#ffd166';
        scoreIcon = '✅';
        message = 'Đạt yêu cầu!';
    }
    
    // Tạo nội dung
    resultBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 1.3em; display: flex; align-items: center; gap: 10px;">
                ${scoreIcon} KẾT QUẢ BÀI LÀM
            </h3>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 1.5em; cursor: pointer;">
                ×
            </button>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 3.5em; font-weight: bold; color: ${scoreColor}; 
                       animation: pulse 2s infinite;">
                ${score.toFixed(2)}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 1.1em;">/ 10.00 điểm</div>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Tổng số câu:</span>
                <strong>${total}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Đã làm:</span>
                <strong>${answered}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Tỉ lệ hoàn thành:</span>
                <strong>${Math.round((answered/total)*100)}%</strong>
            </div>
        </div>
        
        <div style="text-align: center; padding: 12px; background: ${scoreColor}; 
                   border-radius: 8px; font-weight: bold; font-size: 1.1em;">
            ${message}
        </div>
        
        <div style="margin-top: 15px; text-align: center; font-size: 0.9em; color: rgba(255,255,255,0.7);">
            ✅ Kết quả đã được lưu tự động
        </div>
    `;
    
    document.body.appendChild(resultBox);
    
    // Tự động ẩn sau 15 giây
    setTimeout(() => {
        resultBox.style.opacity = '0.7';
        setTimeout(() => {
            if (resultBox.parentNode) {
                resultBox.style.transform = 'translateX(100%)';
                resultBox.style.opacity = '0';
                setTimeout(() => resultBox.remove(), 500);
            }
        }, 3000);
    }, 15000);
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info', duration = 6000) {
    const notification = document.getElementById('notification');
    notification.innerHTML = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => { notification.classList.remove('show'); }, duration);
}

// ===== CANVAS DRAWING =====
function setupCanvas() {
    const canvas = document.getElementById("drawCanvas");
    const ctx = canvas.getContext("2d");
    const toggleBtn = document.getElementById("toggleMenu");
    const toolbar = document.getElementById("drawToolbar");
    const exitBtn = document.getElementById("exitBtn");

    let isDrawMode = false;
    let isDrawing = false;
    let history = [];
    let currentTool = "pen";
    let startX, startY, lastX, lastY;
    let imageBeforeShape;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    toggleBtn.onclick = () => {
        isDrawMode = !isDrawMode;
        canvas.style.display = isDrawMode ? "block" : "none";
        toolbar.style.display = isDrawMode ? "flex" : "none";
        canvas.style.pointerEvents = isDrawMode ? "auto" : "none";
    };
    exitBtn.onclick = toggleBtn.onclick;

    document.getElementById("tool").onchange = e => currentTool = e.target.value;
    document.getElementById("clearBtn").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = [];
    };
    document.getElementById("saveBtn").onclick = () => {
        const link = document.createElement("a");
        link.download = "ban_ve.png";
        link.href = canvas.toDataURL();
        link.click();
    };
    document.getElementById("undoBtn").onclick = () => {
        if (history.length > 0) ctx.putImageData(history.pop(), 0, 0);
    };

    const getPos = e => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches && e.touches[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const clientY = touch ? touch.clientY : e.clientY;
        return { 
            x: (clientX - rect.left) * (canvas.width / rect.width), 
            y: (clientY - rect.top) * (canvas.height / rect.height) 
        };
    };

    const startDraw = e => {
        if (!isDrawMode) return;
        e.preventDefault();
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        isDrawing = true;
        const pos = getPos(e);
        startX = lastX = pos.x;
        startY = lastY = pos.y;
        if (currentTool !== 'pen') {
            imageBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        ctx.beginPath();
    };

    const drawMove = e => {
        if (!isDrawing || !isDrawMode) return;
        e.preventDefault();
        ctx.strokeStyle = document.getElementById("colorPicker").value;
        ctx.lineWidth = document.getElementById("draw-width").value;
        const pos = getPos(e);
        
        if (currentTool !== "pen" && imageBeforeShape) {
            ctx.putImageData(imageBeforeShape, 0, 0);
        }

        ctx.beginPath();
        switch (currentTool) {
            case "pen":
                ctx.moveTo(lastX, lastY); 
                ctx.lineTo(pos.x, pos.y); 
                ctx.stroke();
                [lastX, lastY] = [pos.x, pos.y];
                break;
            case "line":
                ctx.moveTo(startX, startY); 
                ctx.lineTo(pos.x, pos.y); 
                ctx.stroke();
                break;
            case "dashedLineBtn":
                ctx.setLineDash([8, 6]); 
                ctx.moveTo(startX, startY); 
                ctx.lineTo(pos.x, pos.y); 
                ctx.stroke(); 
                ctx.setLineDash([]);
                break;
            case "rect":
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                break;
            case "circle":
                ctx.arc(startX, startY, Math.hypot(pos.x - startX, pos.y - startY), 0, Math.PI * 2); 
                ctx.stroke();
                break;
            case "ellipseBtn":
                ctx.ellipse(startX, startY, Math.abs(pos.x - startX), Math.abs(pos.y - startY), 0, 0, Math.PI * 2); 
                ctx.stroke();
                break;
            case "parallelogram":
                const width_p = pos.x - startX, height_p = pos.y - startY, offset_p = width_p * 0.3;
                ctx.moveTo(startX + offset_p, startY); 
                ctx.lineTo(startX + width_p + offset_p, startY);
                ctx.lineTo(startX + width_p - offset_p, startY + height_p); 
                ctx.lineTo(startX - offset_p, startY + height_p);
                ctx.closePath(); 
                ctx.stroke();
                break;
            case "box":
                const w = pos.x - startX, h = pos.y - startY, d = Math.min(Math.abs(w), Math.abs(h)) * 0.4;
                ctx.strokeRect(startX, startY, w, h); 
                ctx.strokeRect(startX + d, startY - d, w, h);
                [[startX, startY, startX + d, startY - d], 
                 [startX + w, startY, startX + w + d, startY - d],
                 [startX, startY + h, startX + d, startY + h - d], 
                 [startX + w, startY + h, startX + w + d, startY + h - d]].forEach(c => {
                    ctx.moveTo(c[0], c[1]); 
                    ctx.lineTo(c[2], c[3]);
                });
                ctx.stroke();
                break;
            case "pyramid3":
                const baseLeft = { x: startX, y: pos.y }; 
                const baseRight = { x: pos.x, y: pos.y };
                const apex = { x: (startX + pos.x) / 2, y: startY };
                ctx.moveTo(apex.x, apex.y); 
                ctx.lineTo(baseLeft.x, baseLeft.y); 
                ctx.lineTo(baseRight.x, baseRight.y); 
                ctx.closePath(); 
                ctx.stroke();
                break;
            case "pyramid4":
                const w4 = pos.x - startX, h4 = pos.y - startY;
                const apex4 = {x: startX + w4 / 2, y: startY - h4 };
                ctx.strokeRect(startX, startY, w4, h4);
                [[startX, startY], [startX+w4, startY], [startX, startY+h4], [startX+w4, startY+h4]].forEach(([bx,by]) => {
                    ctx.moveTo(apex4.x, apex4.y); 
                    ctx.lineTo(bx,by);
                });
                ctx.stroke();
                break;
            case "sphere":
                const rs = Math.abs(pos.x-startX);
                ctx.arc(startX, startY, rs, 0, Math.PI * 2); 
                ctx.stroke();
                ctx.beginPath(); 
                ctx.setLineDash([6,4]);
                ctx.ellipse(startX, startY, rs, rs / 2.5, 0, 0, Math.PI*2); 
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }
    };

    const endDraw = () => { 
        if(isDrawing) { 
            isDrawing = false; 
            ctx.beginPath();
        }
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", drawMove);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", drawMove, { passive: false });
    canvas.addEventListener("touchend", endDraw);
}

// ===== FULLSCREEN =====
function setupFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    document.addEventListener('fullscreenchange', updateFullscreenButton);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function updateFullscreenButton() {
    const btn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        btn.textContent = '📺 Exit';
    } else {
        btn.textContent = '📺 Fullscreen';
    }
}

// F11 shortcut
document.addEventListener('keydown', function(e) {
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

// ===== DARK MODE =====
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleStyleBtn");
    let isDark = localStorage.getItem('darkMode') === "True";

    if (isDark) {
        document.documentElement.classList.add("dark-mode");
        toggleBtn.textContent = "☀️ Chế độ sáng";
    }

    toggleBtn.addEventListener("click", () => {
        isDark = !isDark;
        document.documentElement.classList.toggle("dark-mode", isDark);
        toggleBtn.textContent = isDark ? "☀️ Chế độ sáng" : "🌙 Chế độ tối";
        
        localStorage.setItem('darkMode', isDark);

        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    });
});

// ===== POLL SYSTEM =====
function setupPollSystem() {
    document.getElementById('poll-submit-btn').addEventListener('click', submitPollResponse);
}

function startPoll() {
    if (!isTeacherLoggedIn || !sessionCode) return showNotification('Vui lòng đăng nhập GV và tạo lớp', 'error');
    const question = prompt('Nhập câu hỏi khảo sát:');
    if (!question) return;
    const options = prompt('Nhập các lựa chọn, cách nhau bởi dấu phẩy (vd: A,B,C):')?.split(',') || [];
    if (options.length < 2) return showNotification('Cần ít nhất 2 lựa chọn!', 'error');

    const pollData = {
        question, 
        options: options.map(o => o.trim()), 
        active: true,
        created: firebase.database.ServerValue.TIMESTAMP
    };
    
    db.ref('sessions/' + sessionCode + '/poll').set(pollData)
        .then(() => showNotification('✅ Khảo sát đã bắt đầu!', 'success'));
}

function showPoll(pollData) {
    document.getElementById('poll-title').textContent = pollData.question;
    const optionsDiv = document.getElementById('poll-options');
    optionsDiv.innerHTML = pollData.options.map((option, index) =>
        `<div class="poll-option" data-index="${index}">${String.fromCharCode(65 + index)}. ${option}</div>`
    ).join('');
    
    optionsDiv.querySelectorAll('.poll-option').forEach(el => {
        el.onclick = () => {
            optionsDiv.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
        };
    });
    showModal('poll-modal');
}

function hidePoll() {
    hideModal(document.getElementById('poll-modal'));
}

function submitPollResponse() {
    const selectedOption = document.querySelector('.poll-option.selected');
    if (!selectedOption) return showNotification('Vui lòng chọn một phương án!', 'warning');
    if (!sessionCode || !currentUser) return showNotification('Vui lòng đăng nhập!', 'error');

    const responseIndex = parseInt(selectedOption.dataset.index);
    db.ref(`sessions/${sessionCode}/poll/responses/${currentUser.uid}`).set({
        name: currentUser.name, choice: responseIndex
    }).then(() => {
        showNotification('✅ Đã gửi phản hồi!', 'success');
        hidePoll();
    });
}

// ===== STUDENT INTERACTION =====
function setupStudentInteraction() {
    document.getElementById('studentInteractBtn').addEventListener('click', () => {
        if (!currentUser || !sessionCode) return showNotification('Vui lòng đăng nhập và vào lớp!', 'error');
        const choice = prompt(`Chọn tương tác:\n1-✋ Giơ tay\n2-❓ Đặt câu hỏi\n3-🆘 Cần hỗ trợ`);
        if (choice === '1') sendInteraction('hand_raised');
        else if (choice === '2') {
            const question = prompt('Nhập câu hỏi của bạn:');
            if (question) sendInteraction('question', question);
        } else if (choice === '3') sendInteraction('need_help');
    });
}

function sendInteraction(type, content = '') {
    const interactionData = { 
        student: currentUser.name, 
        type, 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    };
    if (content) interactionData.content = content;
    
    db.ref('sessions/' + sessionCode + '/interactions').push(interactionData)
        .then(() => showNotification('✅ Đã gửi tương tác!', 'success'));
}

// ===== TEACHER MONITORING =====
function startMonitoringSession() {
    if (!sessionCode) return;
    db.ref('sessions/' + sessionCode + '/students').on('value', snapshot => updateStudentMonitor(snapshot.val()));
    db.ref('sessions/' + sessionCode + '/interactions').on('child_added', snapshot => showInteractionAlert(snapshot.val()));
}

function updateStudentMonitor(students) {
    const tbody = document.getElementById('student-results-body');
    const stats = {
        total: document.getElementById('stats-total'),
        completed: document.getElementById('stats-completed'),
        average: document.getElementById('stats-average'),
        failed: document.getElementById('stats-failed')
    };
    const liveCount = document.getElementById('live-student-count');
    
    if (!students || Object.keys(students).length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">Chưa có học sinh nào tham gia.</td></tr>`;
        Object.values(stats).forEach(el => el.textContent = '0');
        liveCount.textContent = '0';
        return;
    }
    
    let html = '';
    let total = 0, completed = 0, totalScore = 0, failed = 0;
    
    Object.entries(students).forEach(([studentId, student]) => {
        total++;
        const studentScore = student.score || 0;
        if (student.status === 'finished') {
             completed++;
             totalScore += studentScore;
        }
        if (studentScore < 1) failed++;
        
        const timeSpent = student.joined && student.finished ? calculateTimeSpent(student.joined, student.finished) : '--:--';
        
        let status = student.status || 'not-started';
        let statusText = getStatusText(status);
        
        if (inactiveStudents.has(studentId)) {
            statusText = '❌ Không hoạt động';
        }
        
        // Thêm thông tin đề thi nếu có
        const examInfo = student.currentExamData ? 
            `<br><small style="color: #666;">Đề: ${student.currentExamData.examName || student.currentExamData.examId} (${student.currentExamData.questionCount || 0} câu)</small>` : 
            '';
        
        html += `
            <tr>
                <td>
                    <strong>${student.name}</strong>
                    ${examInfo}
                    <br><small>${student.code}</small>
                </td>
                <td style="text-align: center;"><span class="status-${status}">${statusText}</span></td>
                <td style="text-align: center; font-weight: bold;">${studentScore.toFixed(2)}</td>
                <td style="text-align: center;">${timeSpent}</td>
                <td style="text-align: center;">
                    <div style="background: #e0e0e0; border-radius: 5px; height: 8px;"><div style="background: linear-gradient(135deg, #1a237e, #3949ab); height: 100%; border-radius: 5px; width: ${student.progress || 0}%;"></div></div>
                    <small>${student.progress || 0}%</small>
                </td>
                <td style="text-align: center;"><button onclick="viewStudentDetail('${studentId}')" style="padding: 5px 10px; border: none; background: #17a2b8; color: white; border-radius: 5px; cursor: pointer;">📊</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    stats.total.textContent = total;
    stats.completed.textContent = completed;
    stats.average.textContent = completed > 0 ? (totalScore / completed).toFixed(1) : '0.0';
    stats.failed.textContent = failed;
    liveCount.textContent = total;
}

function getStatusText(status) {
    return { 
        'active': 'Đang làm', 
        'finished': 'Đã nộp', 
        'not-started': 'Chưa bắt đầu' 
    }[status] || '...';
}

function calculateTimeSpent(startTime, endTime) {
    const diff = endTime - startTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function showInteractionAlert(interaction) {
    if (!isTeacherLoggedIn) return;
    
    let message = '';
    let type = 'warning';
    
    switch(interaction.type) {
        case 'hand_raised': 
            message = `✋ ${interaction.student} đang giơ tay!`;
            type = 'info';
            break;
        case 'question': 
            message = `❓ ${interaction.student}: ${interaction.content}`;
            type = 'warning';
            break;
        case 'need_help': 
            message = `🆘 ${interaction.student} cần hỗ trợ gấp!`;
            type = 'error';
            break;
        default: return;
    }
    
    showNotification(message, type);
    
    if (document.getElementById('class-management-modal').classList.contains('active')) {
        setTimeout(viewClassInteractions, 1000);
    }
}

window.viewStudentDetail = function(studentId) {
    showNotification('Tính năng xem chi tiết học sinh đang được phát triển.', 'info');
};

// ===== ADDITIONAL FUNCTIONS =====

// Start monitoring session button
document.getElementById('monitor-create-session').addEventListener('click', createNewSession);
document.getElementById('monitor-start-poll').addEventListener('click', startPoll);
document.getElementById('monitor-sync-slides').addEventListener('click', syncSlidesWithStudents);

// Cancel buttons
document.getElementById('cancel-create-class-btn').addEventListener('click', function() {
    hideModal(document.getElementById('create-class-modal'));
});

// Export codes button
document.getElementById('export-codes-btn').addEventListener('click', function() {
    showNotification('Tính năng xuất Excel đang được phát triển!', 'info');
});

// Class poll functions (simplified versions)
async function startClassPoll() {
    showNotification('Tính năng poll lớp đang được phát triển', 'info');
}

async function syncClassSlides() {
    showNotification('Tính năng đồng bộ lớp đang được phát triển', 'info');
}

async function viewClassPollResults() {
    showNotification('Tính năng xem kết quả poll đang được phát triển', 'info');
}

async function viewClassInteractions() {
    showNotification('Tính năng xem tương tác đang được phát triển', 'info');
}

// Fallback saveAttempt function
window.saveAttempt = async function(testId, detailsOrScore, maybeScore) {
    if (!currentUser || !sessionCode) {
        console.warn("⚠️ Vui lòng đăng nhập trước khi lưu!");
        return;
    }

    let answers = {};
    let totalScore = 0;

    if (typeof detailsOrScore === 'object' && maybeScore !== undefined) {
        answers = detailsOrScore.studentAnswers || {};
        totalScore = parseFloat(maybeScore);
    } else {
        totalScore = parseFloat(detailsOrScore);
    }

    try {
        // Lưu vào attempts
        await db.ref(`attempts/${sessionCode}/${currentUser.uid}`).set({
            code: currentUser.code,
            name: currentUser.name,
            testId,
            score: totalScore,
            answers,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            sessionCode: sessionCode,
            testName: currentExam?.name
        });
        
        console.log("✅ Đã lưu điểm:", totalScore);
        showNotification(`✅ Đã lưu kết quả: ${totalScore.toFixed(2)} điểm`, 'success');
        
    } catch (err) {
        console.error("❌ Lỗi lưu:", err);
        showNotification('❌ Lỗi khi lưu kết quả', 'error');
    }
};

// ===== TEXT PROCESSING HELPERS =====
function processContent(text) {
    if (!text || typeof text !== 'string') return '';
    
    // 1. Dùng Placeholder để bảo vệ bảng LaTeX trước khi xử lý text
    const placeholders = [];
    const tableRegex = /\\begin\{tabular\}\s*\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g;
    
    text = text.replace(tableRegex, function(match, colSpecs, content) {
        const htmlTable = convertSingleTableToHTML(colSpecs, content);
        placeholders.push(htmlTable);
        return `___TABLE_PLACEHOLDER_${placeholders.length - 1}___`;
    });

    // 2. Xử lý ký tự đặc biệt trong công thức Toán ($...$)
    text = text.replace(/\$([^$]+)\$/g, function(match, mathContent) {
        let safeMath = mathContent
            .replace(/</g, ' \\lt ')
            .replace(/>/g, ' \\gt ')
            .replace(/&/g, ' \\& ');
        return '$' + safeMath + '$';
    });
    
    // 3. Xử lý ký tự đặc biệt ngoài công thức (HTML Entities)
    text = text.replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, '&amp;');
    
    // 4. Trả lại bảng HTML từ kho chứa
    placeholders.forEach((htmlTable, index) => {
        text = text.replace(`___TABLE_PLACEHOLDER_${index}___`, htmlTable);
    });
    
    return text;
}

function convertSingleTableToHTML(colSpecs, content) {
    try {
        let cleanContent = content
            .replace(/\\hline/g, '')
            .replace(/\\cline\{[^}]*\}/g, '')
            .trim();
            
        cleanContent = cleanContent.replace(/^[|}\s{c]+/, '').trim();

        let rows = cleanContent.split('\\\\').filter(r => r.trim() !== '');
        
        let htmlRows = rows.map(row => {
            let cells = [];
            let currentCell = '';
            let inMath = false;
            let braceCount = 0;
            
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (char === '\\' && row[i+1] === '$') { 
                    currentCell += '\\$'; i++; continue;
                }

                if (char === '$') {
                    inMath = !inMath;
                    currentCell += char;
                } else if (char === '{') {
                    braceCount++;
                    currentCell += char;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount < 0) braceCount = 0; 
                    currentCell += char;
                } else if (char === '&' && !inMath && braceCount === 0) {
                    cells.push(currentCell);
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
            cells.push(currentCell);
            
            let htmlCells = cells.map(cell => {
                let c = cell.trim();
                c = c.replace(/\\multicolumn\{[^}]*\}\{[^}]*\}\{([^}]*)\}/g, '$1')
                     .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
                
                c = c.replace(/^[|]+/, '');
                
                return `<td style="border: 1px solid #ddd; padding: 8px;">${c}</td>`;
            }).join('');
            
            return `<tr>${htmlCells}</tr>`;
        }).join('');

        return `<div class="table-responsive">
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        ${htmlRows}
                    </table>
                </div>`;
    } catch (e) {
        console.error("Lỗi convert bảng LaTeX:", e);
        return `<div style="color:red">Lỗi hiển thị bảng: ${e.message}</div>`;
    }
}

// ===== NEW TRUE/FALSE FUNCTIONS FOR LESSON COLLECTION =====

window.checkSingleTrueFalse = function(uniqueId, questionId, correctAnswer) {
    const selected = document.querySelector(`input[name="tf-${uniqueId}-${questionId}"]:checked`);
    const resultEl = document.getElementById(`tf-result-${uniqueId}-${questionId}`);
    const solutionEl = document.getElementById(`tf-solution-${uniqueId}-${questionId}`);
    
    if (!selected) {
        resultEl.innerHTML = '<span style="color: #ffc107;">⚠️ Hãy chọn Đúng hoặc Sai</span>';
        return;
    }
    
    const userAnswer = selected.value === 'true';
    const isCorrect = userAnswer === correctAnswer;
    
    if (isCorrect) {
        resultEl.innerHTML = '<span style="color: #28a745;">✅ Chính xác!</span>';
        selected.parentElement.style.color = '#28a745';
        selected.parentElement.style.fontWeight = 'bold';
        selected.parentElement.style.borderColor = '#28a745';
    } else {
        resultEl.innerHTML = `<span style="color: #dc3545;">❌ Sai! Đáp án: ${correctAnswer ? 'ĐÚNG' : 'SAI'}</span>`;
        selected.parentElement.style.color = '#dc3545';
        selected.parentElement.style.borderColor = '#dc3545';
    }
    
    if (solutionEl) {
        solutionEl.style.display = 'block';
    }
    
    selected.disabled = true;
    
    if (currentUser) {
        savePartial(`tf-${uniqueId}-${questionId}`, userAnswer, correctAnswer, isCorrect);
    }
    
    playSound(isCorrect ? 'correct' : 'wrong');
};

window.checkAllTrueFalse = function(uniqueId, correctAnswers) {
    const quizEl = document.getElementById(`tf-quiz-${uniqueId}`);
    if (!quizEl) return;
    
    const questions = quizEl.querySelectorAll('.tf-question');
    let score = 0;
    let total = questions.length;
    
    questions.forEach((questionEl, index) => {
        const radioName = `tf-${uniqueId}-${index}`;
        const selected = questionEl.querySelector(`input[name="${radioName}"]:checked`);
        const resultEl = questionEl.querySelector(`[id^="tf-result"]`);
        const solutionEl = questionEl.querySelector(`[id^="tf-solution"]`);
        
        if (selected) {
            const userAnswer = selected.value === 'true';
            const isCorrect = userAnswer === correctAnswers[index];
            
            if (isCorrect) {
                score++;
                if (resultEl) {
                    resultEl.innerHTML = '<span style="color: #28a745;">✅ Đúng</span>';
                }
                selected.parentElement.style.color = '#28a745';
                selected.parentElement.style.fontWeight = 'bold';
            } else {
                if (resultEl) {
                    resultEl.innerHTML = `<span style="color: #dc3545;">❌ Sai (Đáp án: ${correctAnswers[index] ? 'Đúng' : 'Sai'})</span>`;
                }
                selected.parentElement.style.color = '#dc3545';
            }
            
            if (solutionEl) {
                solutionEl.style.display = 'block';
            }
            
            questionEl.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.disabled = true;
            });
        } else {
            if (resultEl) {
                resultEl.innerHTML = '<span style="color: #ffc107;">⭕ Chưa chọn</span>';
            }
        }
    });
    
    const percentage = (score / total * 100).toFixed(1);
    const finalScoreDiv = document.createElement('div');
    finalScoreDiv.innerHTML = `
        <div style="margin-top: 30px; padding: 20px; background: ${score === total ? '#d4edda' : '#fff3cd'}; border-radius: 12px; border: 2px solid ${score === total ? '#28a745' : '#ffc107'};">
            <h4 style="color: ${score === total ? '#155724' : '#856404'}; margin-bottom: 15px;">📊 KẾT QUẢ:</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: #1a237e;">${score}/${total}</div>
                    <div style="font-size: 0.9em; color: #666;">Số câu đúng</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: ${getScoreColor(percentage)}">${percentage}%</div>
                    <div style="font-size: 0.9em; color: #666;">Tỉ lệ đúng</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: ${score === total ? '#28a745' : '#ffc107'}">${(score * 0.25).toFixed(2)}</div>
                    <div style="font-size: 0.9em; color: #666;">Điểm số</div>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                ${score === total ? 
                    '<span style="color: #28a745; font-weight: bold;">🎉 Xuất sắc! Tất cả đều đúng!</span>' :
                    score >= total * 0.7 ?
                    '<span style="color: #ffc107; font-weight: bold;">👍 Khá tốt! Hãy ôn lại các câu sai.</span>' :
                    '<span style="color: #dc3545; font-weight: bold;">💪 Cần cố gắng hơn! Xem lại lý thuyết.</span>'
                }
            </div>
        </div>
    `;
    
    const existingScore = quizEl.querySelector('.score-display');
    if (existingScore) existingScore.remove();
    
    finalScoreDiv.classList.add('score-display');
    quizEl.appendChild(finalScoreDiv);
    
    if (currentUser) {
        const answers = {};
        questions.forEach((q, idx) => {
            const selected = q.querySelector(`input[name="tf-${uniqueId}-${idx}"]:checked`);
            answers[`q${idx}`] = selected ? (selected.value === 'true') : null;
        });
        
        savePartial(`tf-quiz-${uniqueId}`, answers, correctAnswers, score === total);
    }
    
    if (score === total) {
        playSound('correct');
        showNotification(`🎉 Hoàn hảo! ${score}/${total} câu đúng!`, 'success');
    } else if (score >= total * 0.7) {
        playSound('partial');
        showNotification(`👍 Tốt lắm! Đúng ${score}/${total} câu`, 'warning');
    } else {
        playSound('wrong');
        showNotification(`💪 Cố gắng nhé! Đúng ${score}/${total} câu`, 'error');
    }
};

// Helper function for score color
function getScoreColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 50) return '#ffc107';
    return '#dc3545';
}

// ===== INITIALIZE =====
console.log("🚀 Hệ thống Lớp Toán Thầy Bình với Ma trận đề đã sẵn sàng!");