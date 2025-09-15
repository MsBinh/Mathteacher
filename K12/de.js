/* de.js
   Toàn bộ JS dùng chung: check, score, toggleSolution, saveAttempt (Firestore),
   canvas vẽ, blackboard, menu.
   Copy nguyên file này vào de.js và chèn <script src="de.js"></script> trong HTML.
*/

/* ------------------------
   Biến toàn cục
   ------------------------ */
window.studentAnswers = window.studentAnswers || {};
window.checkedQuestions = window.checkedQuestions || {};
window.isScoreCalculated = window.isScoreCalculated || false;
window.allowShowSolution = window.allowShowSolution || false;

/* ------------------------
   Hỗ trợ hiển thị icon
   ------------------------ */
function showOptionIcon(questionId, selectedValue, correctAnswer) {
  if (!window.checkedQuestions[questionId]) return;
  ['A','B','C','D'].forEach(letter=>{
    const span = document.getElementById(`icon-${questionId}-${letter}`);
    if (span) span.innerHTML = '';
  });
  const icon = selectedValue === correctAnswer ? '✅' : '❌';
  const selectedSpan = document.getElementById(`icon-${questionId}-${selectedValue}`);
  if (selectedSpan) selectedSpan.innerHTML = icon;
}
function showTFOptionIcon(name, selectedValue, correctValue, questionId){
  if (!window.checkedQuestions[questionId]) return;
  const icon = selectedValue === correctValue ? '✅' : '❌';
  const span = document.getElementById(`icon-${name}`);
  if (span) span.innerHTML = icon;
}
function lockQuestionInputs(questionId){
  const radios = document.querySelectorAll(`input[name="${questionId}"]`);
  radios.forEach(i=>i.disabled=true);
}
function addSolutionLink(questionId, url){
  if (!window.checkedQuestions[questionId]) return;
  const container = document.getElementById(`feedback-${questionId}`);
  if (container && !container.querySelector('a')){
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.style.marginLeft = '10px'; a.textContent = 'Xem lời giải';
    container.appendChild(a);
  }
}

/* ------------------------
   Check answers API (global)
   ------------------------ */
function checkAnswer(questionId, correctAnswer){
  if (window.checkedQuestions[questionId]) return;
  const inputs = document.getElementsByName(questionId);
  let selected = null;
  for (let i of inputs) if (i.checked){ selected = i.value; break; }
  window.studentAnswers[questionId] = selected;
  autoSave('de');
  window.checkedQuestions[questionId] = true;
  lockQuestionInputs(questionId);
  showOptionIcon(questionId, selected, correctAnswer);
  addSolutionLink(questionId, `giai/${questionId}.html`);
}
function checkTrueFalseAnswer(questionId, correctAnswers){
  for (let i = 0; i < correctAnswers.length; i++){
    const name = questionId + String.fromCharCode(97 + i);
    const inputs = document.getElementsByName(name);
    let selected = '';
    for (let ip of inputs) if (ip.checked){ selected = ip.value; break; }
    const iconId = `icon-${name}`;
    let icon = document.getElementById(iconId);
    if (!icon && inputs.length){
      icon = document.createElement('span');
      icon.id = iconId; icon.className = 'option-icon';
      inputs[0].parentNode.appendChild(icon);
    }
    if (icon) icon.innerHTML = selected === correctAnswers[i] ? '✅' : '❌';
  }
  autoSave('de');

}
function checkShortAnswer(questionId, correctAnswer){
  if (window.checkedQuestions[questionId]) return; autoSave('de');

  const input = document.getElementById('input-' + questionId);
  const feedback = document.getElementById('feedback-' + questionId);
  let icon = document.getElementById('icon-' + questionId);
  if (!icon && input){
    icon = document.createElement('span'); icon.id = 'icon-' + questionId; icon.className = 'option-icon';
    input.insertAdjacentElement('afterend', icon);
  }
  if (!input){
    if (feedback){ feedback.innerHTML = 'Lỗi: Không tìm thấy input cho câu hỏi!'; feedback.className='answer-feedback incorrect'; }
    return;
  }
  const value = input.value.trim();
  if (value === ''){
    if (feedback){ feedback.innerHTML='Vui lòng nhập đáp án!'; feedback.className='answer-feedback incorrect'; }
    if (icon) icon.innerHTML = '';
    return;
  }
  if (!isNaN(correctAnswer)){
    const numeric = parseFloat(value);
    if (isNaN(numeric)){ if (feedback){ feedback.innerHTML='Vui lòng nhập một số hợp lệ!'; feedback.className='answer-feedback incorrect'; } if (icon) icon.innerHTML=''; return; }
    const correct = parseFloat(correctAnswer);
    if (Math.abs(numeric - correct) < 0.001){
      if (feedback){ feedback.innerHTML='Đúng!'; feedback.className='answer-feedback correct'; }
      window.studentAnswers[questionId] = numeric;
      if (icon) icon.innerHTML = '✅';
    } else {
      if (feedback){ feedback.innerHTML='Sai!'; feedback.className='answer-feedback incorrect'; }
      window.studentAnswers[questionId] = numeric;
      if (icon) icon.innerHTML = '❌';
    }
  } else {
    if (value === correctAnswer){
      if (feedback){ feedback.innerHTML='Đúng'; feedback.className='answer-feedback correct'; }
      window.studentAnswers[questionId] = value;
      if (icon) icon.innerHTML = '✅';
    } else {
      if (feedback){ feedback.innerHTML='Sai!'; feedback.className='answer-feedback incorrect'; }
      window.studentAnswers[questionId] = value; 
      autoSave('de');

      if (icon) icon.innerHTML = '❌';
    }
  }
}

/* ------------------------
   Tính điểm (linh hoạt theo window.correctAnswers)
   ------------------------ */
function calculateScore(){
  if (window.isScoreCalculated) return;
  const correctAnswers = window.correctAnswers || {};
  const studentAns = {};
  let totalScore = 0;

  for (const key in correctAnswers){
    const correct = correctAnswers[key];
    let userAns = null;

    if (typeof correct === 'string' && /^[A-D]$/.test(correct)){
      const sel = document.querySelector(`input[name="${key}"]:checked`);
      userAns = sel ? sel.value.trim() : '';
      if (userAns === correct) totalScore += 0.25;
    } else if (Array.isArray(correct)){
      const arr = [];
      ['a','b','c','d'].forEach(letter=>{
        const sel = document.querySelector(`input[name="${key}${letter}"]:checked`);
        arr.push(sel ? sel.value.trim() : '');
      });
      userAns = arr;
      let correctCount = 0;
      for (let j = 0; j < correct.length; j++) if (arr[j] === correct[j]) correctCount++;
      if (correctCount === 1) totalScore += 0.1;
      else if (correctCount === 2) totalScore += 0.25;
      else if (correctCount === 3) totalScore += 0.5;
      else if (correctCount === 4) totalScore += 1;
    } else {
      const el = document.getElementById('input-' + key);
      userAns = el ? el.value.trim().replace(',', '.') : '';
      const userVal = parseFloat(userAns);
      const corVal = parseFloat((correct||'').toString().replace(',', '.'));
      if (!isNaN(userVal) && !isNaN(corVal) && Math.abs(userVal - corVal) < 0.001) totalScore += 0.5;
    }

    studentAns[key] = userAns;
  }

  const scoreElement = document.getElementById('score-result');
  if (scoreElement) {
    scoreElement.textContent = `Tổng điểm của bạn: ${totalScore.toFixed(2)} / 10`;
    scoreElement.className = (totalScore >= 5 ? 'correct' : 'incorrect');
  }
  window.isScoreCalculated = true;

  const studentName = document.getElementById('student-name') ? document.getElementById('student-name').value.trim() : '';

  // Gọi lưu (nếu có)
  if (typeof window.saveAttempt === 'function') {
    try { window.saveAttempt('de', studentAns, totalScore, studentName); }
    catch(e){ console.warn('Lưu thất bại:', e); }
  }
}

/* ------------------------
   Show video solution (kiểm soát bởi allowShowSolution)
   ------------------------ */
function showVideoSolution(url, qid) {
  if (!window.allowShowSolution && !localStorage.getItem('studentCode')) {
    alert('Lời giải đang bị khóa. Liên hệ giáo viên để mở.');
    document.getElementById('login-modal')?.classList.remove('hidden');
    return;
  }
  window.open(url, '_blank');
}

/* ------------------------
   Toggle xem lời giải (global)
   ------------------------ */
function toggleSolution(solutionId) {
  const el = document.getElementById(solutionId);
  if (!el) return;
  const studentCode = localStorage.getItem('studentCode');
  if (studentCode) {
    el.classList.toggle('visible');
  } else {
    // show login modal
    const m = document.getElementById('login-modal');
    if (m) m.classList.remove('hidden');
    else alert('Vui lòng đăng nhập để xem lời giải');
  }
}

/* ------------------------
   saveAttempt wrapper (gọi hàm _firebaseSaveAttempt nếu module đã nạp)
   ------------------------ */
window.saveAttempt = async function(testId, answersObject, score, studentName){
  if (typeof window._firebaseSaveAttempt === 'function') {
    return window._firebaseSaveAttempt(testId, answersObject, score, studentName);
  }
  // fallback: nếu chưa cài firebase module, yêu cầu đăng nhập (hoặc hiện thông báo)
  const studentCode = localStorage.getItem('studentCode') || null;
  if (!studentCode) {
    alert('⚠️ Vui lòng nhập mã trước khi lưu kết quả!');
    return;
  }
  // nếu module chưa nạp thì thông báo
  alert('Chức năng lưu tạm thời chưa sẵn sàng (firebase chưa nạp).');
};

/* ------------------------
   Nạp Firebase bằng module script động (không cần edit HTML)
   - gán window._firebaseSaveAttempt(...) và xử lý login form
   ------------------------ */
(function injectFirebaseModule(){
  try {
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = `
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDACFZgZazMOnjzmGM_lrKswVcsoTFHxA",
  authDomain: "veonline-3bcbf.firebaseapp.com",
  projectId: "veonline-3bcbf",
  storageBucket: "veonline-3bcbf.appspot.com",
  messagingSenderId: "83902304195",
  appId: "1:83902304195:web:2f9ec1ee0c23d6e21bb776"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hàm lưu thực tế
window._firebaseSaveAttempt = async function(testId, answersObject, score, studentName){
  const studentCode = localStorage.getItem('studentCode') || null;
  if (!studentCode) {
    throw new Error('Chưa đăng nhập (studentCode)');
  }
  await addDoc(collection(db, 'attempts'), {
    name: studentName || localStorage.getItem('studentName') || null,
    code: studentCode,
    testId: testId || 'unknown',
    answers: answersObject || {},
    score: score,
    createdAt: serverTimestamp()
  });
  console.log('✅ Đã lưu bài làm (Firestore)');
};

// Init login form xử lý (gắn event)
(function initLogin(){
  const codeForm = document.getElementById('code-login-form');
  if (!codeForm) return;
  codeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('login-code')?.value?.trim() || '';
  const nameInput = document.getElementById('student-name');
  const name = nameInput ? nameInput.value.trim() : '';

  try {
    const codesRef = collection(db, "codes");
    const q = query(codesRef, where("code", "==", code));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const codeDoc = snap.docs[0];
      const data = codeDoc.data();

      // Kiểm tra nếu mã đang active -> chặn đăng nhập thiết bị khác
      if (data.active === true) {
        document.getElementById('auth-status').textContent = '⚠️ Mã này đang được sử dụng trên thiết bị khác';
        return;
      }

      // Đánh dấu mã đang sử dụng
      await updateDoc(doc(db, "codes", codeDoc.id), {
        active: true,
        lastLogin: serverTimestamp()
      });

      // Lưu thông tin vào localStorage
      localStorage.setItem('studentName', data.name || name || 'Học sinh');
      localStorage.setItem('studentCode', code);
      localStorage.setItem('studentCodeDocId', codeDoc.id); // lưu docId để hủy khi thoát

      window.allowShowSolution = true;
      document.getElementById('auth-status').textContent = '✅ Đăng nhập thành công';
      document.getElementById('login-modal')?.classList.add('hidden');
    } else {
      document.getElementById('auth-status').textContent = '❌ Mã không hợp lệ';
    }
  } catch(err){
    console.error(err);
    document.getElementById('auth-status').textContent = '❌ Lỗi đăng nhập: ' + err.message;
  }
});

  // login-button toggle
  document.getElementById('login-button')?.addEventListener('click', (e) => {
    e.preventDefault();
    const studentCode = localStorage.getItem('studentCode');
    if (studentCode) {
      localStorage.removeItem('studentName'); localStorage.removeItem('studentCode');
      window.allowShowSolution = false;
      document.getElementById('auth-status') && (document.getElementById('auth-status').textContent = 'Đã đăng xuất');
      document.querySelectorAll('.solution').forEach(el => el.classList.remove('visible'));
    } else {
      document.getElementById('login-modal')?.classList.remove('hidden');
    }
  });

  document.getElementById('close-modal')?.addEventListener('click', ()=> {
    document.getElementById('login-modal')?.classList.add('hidden');
    document.getElementById('auth-status') && (document.getElementById('auth-status').textContent = '');
    const inp = document.getElementById('login-code'); if (inp) inp.value = '';
  });
})();
`;
    document.body.appendChild(s);
  } catch(e){
    console.warn('Không thể nạp Firebase module động:', e);
  }
})();

/* ------------------------
   Canvas vẽ & toolbar
   ------------------------ */

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('drawCanvas');
        const toolbar = document.getElementById('drawToolbar');
        const toggleBtn = document.getElementById('toggle-draw');
        const undoBtn = document.getElementById('undo-canvas');
        const clearBtn = document.getElementById('clear-canvas');
        const saveBtn = document.getElementById('save-canvas');
        const exitBtn = document.getElementById('exit-draw');
        const colorPicker = document.getElementById('colorPicker');
        const toolSelect = document.getElementById('tool');
        const widthPicker = document.getElementById('draw-width');

        if (!canvas || !toolbar || !toggleBtn || !undoBtn || !clearBtn || !saveBtn || !exitBtn || !colorPicker || !toolSelect || !widthPicker) {
            console.error('Một hoặc nhiều phần tử DOM không tìm thấy. Kiểm tra ID trong HTML.');
            return;
        }

        const ctx = canvas.getContext('2d');
        let lineWidth = parseInt(widthPicker.value) || 2;
        let isDrawing = false;
        let isDrawMode = false;
        let startX = 0, startY = 0;
        let currentTool = toolSelect.value || 'pen';
        let imageBeforeShape;
        const history = [];
        const maxHistory = 50;

        // Lưu trữ các điểm vẽ gần nhất để làm mượt nét vẽ
        let lastPoint = null;

        // --- Cải thiện 1: Lấy vị trí chuột/cảm ứng chính xác hơn ---
        function getCanvasPos(e) {
            const rect = canvas.getBoundingClientRect(); // Lấy kích thước và vị trí của canvas
            let clientX, clientY;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // Tính toán vị trí tương đối so với canvas
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        // Resize canvas
        function resizeCanvas() {
            // Lưu nội dung hiện tại của canvas trước khi thay đổi kích thước
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(canvas, 0, 0);

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Vẽ lại nội dung đã lưu
            ctx.drawImage(tempCanvas, 0, 0);
            
            // Cập nhật lịch sử nếu cần thiết (ví dụ: nếu bạn muốn scale lịch sử)
            // Hiện tại, chỉ vẽ lại nội dung cuối cùng, lịch sử sẽ bị mất tỷ lệ nếu màn hình thay đổi nhiều.
            // Để xử lý tốt hơn, bạn cần lưu trữ các lệnh vẽ hoặc vector thay vì ImageData.
            if (history.length > 0) {
                // Nếu muốn giữ nguyên hình ảnh sau resize, bạn có thể redraw từ lịch sử
                // Nhưng với ImageData, nó sẽ không scale tốt nếu tỷ lệ khung hình thay đổi.
                // ctx.putImageData(history[history.length - 1], 0, 0); 
            }
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function toggleDrawMode() {
            isDrawMode = !isDrawMode;
            if (isDrawMode) {
                canvas.style.display = 'block';
                toolbar.style.display = 'flex'; // Hiển thị trước khi animation để tránh giật
                setTimeout(() => { // Dùng setTimeout để đảm bảo display đã được cập nhật
                    toolbar.style.opacity = '1';
                    toolbar.style.transform = 'translateY(0)';
                }, 0);
            } else {
                toolbar.style.opacity = '0';
                toolbar.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    toolbar.style.display = 'none';
                    canvas.style.display = 'none';
                }, 300); // Phù hợp với thời gian transition
            }
            toggleBtn.textContent = isDrawMode ? '❌ Tắt vẽ' : '🖊️ Vẽ';
        }

        toggleBtn.addEventListener('click', toggleDrawMode);
        exitBtn.addEventListener('click', toggleDrawMode);

        toolSelect.addEventListener('change', () => {
            currentTool = toolSelect.value;
        });

        colorPicker.addEventListener('input', () => ctx.strokeStyle = colorPicker.value);
        widthPicker.addEventListener('input', () => {
            lineWidth = parseInt(widthPicker.value) || 2;
        });

        undoBtn.addEventListener('click', () => {
            history.pop();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (history.length > 0) {
                ctx.putImageData(history[history.length - 1], 0, 0);
            }
        });

        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            history.length = 0;
        });

        saveBtn.addEventListener('click', () => {
            try {
                const link = document.createElement('a');
                link.download = 'ban_ve.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error('Lỗi khi lưu canvas:', error);
                alert('Không thể lưu ảnh. Có thể trình duyệt của bạn không hỗ trợ hoặc canvas quá lớn.');
            }
        });

        function startDraw(e) {
            if (!isDrawMode) return;
            e.preventDefault(); // Ngăn hành động mặc định của trình duyệt
            const pos = getCanvasPos(e); // Lấy vị trí chính xác trên canvas
            isDrawing = true;
            startX = pos.x;
            startY = pos.y;
            lastPoint = pos; // Khởi tạo điểm cuối cùng

            if (currentTool !== 'pen') {
                imageBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
            }
        }

        function drawMove(e) {
            if (!isDrawing || !isDrawMode) return;
            e.preventDefault(); // Ngăn hành động mặc định của trình duyệt
            const pos = getCanvasPos(e); // Lấy vị trí chính xác trên canvas
            ctx.strokeStyle = colorPicker.value;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round'; // Cải thiện 2: Làm mượt các góc nối

            if (currentTool === 'pen') {
                // Cải thiện 3: Làm mượt nét vẽ bằng cách vẽ đường cong
                if (lastPoint) {
                    // Sử dụng quadraticCurveTo để tạo đường cong mượt
                    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, pos.x, pos.y);
                } else {
                    ctx.moveTo(pos.x, pos.y);
                }
                ctx.stroke();
                lastPoint = pos; // Cập nhật điểm cuối cùng
            } else {
                ctx.putImageData(imageBeforeShape, 0, 0);
                if (currentTool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.stroke();
                } else if (currentTool === 'rect') {
                    ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (currentTool === 'circle') {
                    const radius = Math.hypot(pos.x - startX, pos.y - startY);
                    ctx.beginPath();
                    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (currentTool === 'cube') {
                    let size = Math.min(Math.abs(pos.x - startX), Math.abs(pos.y - startY));
                    let xOffset = (pos.x - startX > 0) ? 0 : -size;
                    let yOffset = (pos.y - startY > 0) ? 0 : -size;

                    // Điều chỉnh để cube vẽ đúng hướng
                    let actualStartX = startX + xOffset;
                    let actualStartY = startY + yOffset;
                    
                    ctx.strokeRect(actualStartX, actualStartY, size, size);
                    ctx.strokeRect(actualStartX + size / 4, actualStartY - size / 4, size, size); // Thay 10 bằng size / 4 để scale theo kích thước
                    ctx.beginPath();
                    ctx.moveTo(actualStartX, actualStartY);
                    ctx.lineTo(actualStartX + size / 4, actualStartY - size / 4);
                    ctx.moveTo(actualStartX + size, actualStartY);
                    ctx.lineTo(actualStartX + size + size / 4, actualStartY - size / 4);
                    ctx.moveTo(actualStartX, actualStartY + size);
                    ctx.lineTo(actualStartX + size / 4, actualStartY + size - size / 4);
                    ctx.moveTo(actualStartX + size, actualStartY + size);
                    ctx.lineTo(actualStartX + size + size / 4, actualStartY + size - size / 4);
                    ctx.stroke();
                } else if (currentTool === 'cone') {
                    let radius = Math.abs(pos.x - startX);
                    let height = Math.abs(pos.y - startY);
                    ctx.beginPath();
                    ctx.ellipse(startX, startY + height, radius, radius / 4, 0, 0, Math.PI * 2); // Đế elip
                    ctx.moveTo(startX - radius, startY + height);
                    ctx.lineTo(startX, startY); // Đỉnh nón
                    ctx.lineTo(startX + radius, startY + height);
                    ctx.stroke();
                } else if (currentTool === 'cylinder') {
                    let r = Math.abs(pos.x - startX);
                    let h = Math.abs(pos.y - startY);
                    ctx.beginPath();
                    ctx.ellipse(startX, startY, r, r / 4, 0, 0, Math.PI * 2); // Nắp trên
                    ctx.moveTo(startX - r, startY);
                    ctx.lineTo(startX - r, startY + h);
                    ctx.moveTo(startX + r, startY);
                    ctx.lineTo(startX + r, startY + h);
                    ctx.ellipse(startX, startY + h, r, r / 4, 0, 0, Math.PI); // Đáy dưới (chỉ vẽ phần nhìn thấy)
                    ctx.stroke();
                } else if (currentTool === 'pyramid') {
                    let baseSize = Math.abs(pos.x - startX);
                    let pyramidHeight = Math.abs(pos.y - startY);
                    
                    ctx.beginPath();
                    // Vẽ đáy (hình vuông hoặc hình chữ nhật)
                    ctx.moveTo(startX - baseSize / 2, startY + pyramidHeight);
                    ctx.lineTo(startX + baseSize / 2, startY + pyramidHeight);
                    ctx.lineTo(startX + baseSize / 2, startY + pyramidHeight + baseSize / 4); // Tạo độ sâu
                    ctx.lineTo(startX - baseSize / 2, startY + pyramidHeight + baseSize / 4);
                    ctx.closePath();

                    // Vẽ các cạnh nối tới đỉnh
                    ctx.moveTo(startX - baseSize / 2, startY + pyramidHeight);
                    ctx.lineTo(startX, startY); // Đỉnh
                    ctx.moveTo(startX + baseSize / 2, startY + pyramidHeight);
                    ctx.lineTo(startX, startY);
                    ctx.moveTo(startX - baseSize / 2, startY + pyramidHeight + baseSize / 4); // Cạnh sau bên trái
                    ctx.lineTo(startX, startY);
                    ctx.moveTo(startX + baseSize / 2, startY + pyramidHeight + baseSize / 4); // Cạnh sau bên phải
                    ctx.lineTo(startX, startY);
                    ctx.stroke();
                } else if (currentTool === 'sphere') {
                    let r = Math.hypot(pos.x - startX, pos.y - startY);
                    ctx.beginPath();
                    ctx.arc(startX, startY, r, 0, Math.PI * 2); // Đường tròn lớn
                    ctx.ellipse(startX, startY, r, r / 2, 0, 0, Math.PI * 2); // Đường tròn nhỏ (tạo ảo giác 3D)
                    ctx.stroke();
                }
            }
        }

        function endDraw() {
            if (!isDrawMode) return;
            isDrawing = false;
            lastPoint = null; // Reset điểm cuối cùng khi kết thúc vẽ
            if (history.length >= maxHistory) history.shift();
            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            // Cải thiện 4: Vẽ lại nét bút cuối cùng nếu nó chưa hoàn chỉnh
            if (currentTool === 'pen' && ctx.strokeStyle !== 'transparent') { // Kiểm tra nếu bút không trong suốt
                 // Nét bút sẽ được hoàn thành trong drawMove nhờ quadraticCurveTo
            }
        }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', drawMove);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw); // Thêm sự kiện mouseleave

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', drawMove, { passive: false });
        canvas.addEventListener('touchend', endDraw);
        canvas.addEventListener('touchcancel', endDraw); // Thêm sự kiện touchcancel
    });


/* ------------------------
   Blackboard (mở/đóng & drag)
   ------------------------ */
document.addEventListener('DOMContentLoaded', ()=>{
  const toggleBlackboard = document.getElementById('toggle-blackboard') || document.querySelector('.blackboard-toggle');
  const blackboard = document.getElementById('blackboard') || document.querySelector('.blackboard');
  const closeBlackboard = document.getElementById('close-blackboard');

  if (!toggleBlackboard || !blackboard) return;

  let dragging = false, dragStartX=0, dragStartY=0;

  function toggleBoardMode(){
    const show = !blackboard.classList.contains('show');
    blackboard.classList.toggle('show', show);
    blackboard.style.display = show ? 'block' : 'none';
    if (show) {
      // auto bật vẽ nếu có nút
      document.getElementById('toggle-draw')?.click();
    } else {
      document.getElementById('toggle-draw')?.click();
    }
  }

  toggleBlackboard.addEventListener('click', (e)=>{
    e.stopPropagation(); toggleBoardMode();
  });

  closeBlackboard?.addEventListener('click', ()=> { blackboard.classList.remove('show'); blackboard.style.display='none'; document.getElementById('toggle-draw')?.click(); });

  blackboard.addEventListener('mousedown', (e)=>{
    if (e.target === closeBlackboard) return;
    dragging = true;
    dragStartX = e.clientX - blackboard.offsetLeft;
    dragStartY = e.clientY - blackboard.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e)=>{
    if (!dragging) return;
    blackboard.style.left = (e.clientX - dragStartX) + 'px';
    blackboard.style.top = (e.clientY - dragStartY) + 'px';
    blackboard.style.transform = 'none';
  });
  document.addEventListener('mouseup', ()=> { dragging = false; });

  blackboard.addEventListener('touchstart', (e)=>{
    if (e.target === closeBlackboard) return;
    const t = e.touches[0];
    dragging = true;
    dragStartX = t.clientX - blackboard.offsetLeft;
    dragStartY = t.clientY - blackboard.offsetTop;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', (e)=>{
    if (!dragging) return;
    const t = e.touches[0];
    blackboard.style.left = (t.clientX - dragStartX) + 'px';
    blackboard.style.top = (t.clientY - dragStartY) + 'px';
    blackboard.style.transform = 'none';
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', ()=> dragging = false);
});

/* ------------------------
   Export global APIs so HTML onclick can call them
   ------------------------ */
window.checkAnswer = checkAnswer;
window.checkTrueFalseAnswer = checkTrueFalseAnswer;
window.checkShortAnswer = checkShortAnswer;
window.calculateScore = calculateScore;
window.showVideoSolution = showVideoSolution;
window.toggleSolution = toggleSolution;
// saveAttempt is already attached to window above

window.addEventListener("beforeunload", async () => {
  const docId = localStorage.getItem("studentCodeDocId");
  if (docId) {
    try {
      const { getFirestore, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
      const db = getFirestore();
      await updateDoc(doc(db, "codes", docId), { active: false });
    } catch (err) {
      console.warn("Không thể cập nhật trạng thái khi thoát:", err);
    }
  }
  localStorage.removeItem("studentCode");
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentCodeDocId");
});


const btn = document.getElementById("fullscreen-btn");
                const content = document.getElementById("content");

                btn.addEventListener("click", async () => {
                if (!document.fullscreenElement) {
                    // Vào fullscreen
                    await document.documentElement.requestFullscreen();
                    document.body.classList.add("fullscreen-mode");
                    btn.textContent = "⛶";
                } else {
                    // Thoát fullscreen
                    await document.exitFullscreen();
                    document.body.classList.remove("fullscreen-mode");
                    btn.textContent = "⛶ ";
                }
             });
  /* ------------------------
   Auto save (mỗi lần chọn đáp án, chỉ lưu nếu đã đăng nhập)
   ------------------------ */
async function autoSave(testId){
  const studentCode = localStorage.getItem('studentCode');
  if (!studentCode) return; // ❌ chưa đăng nhập thì không lưu

  const studentName = localStorage.getItem('studentName') || 
                      (document.getElementById('student-name')?.value.trim()) || 
                      'Học sinh';

  const answersObject = window.studentAnswers || {};
  try {
    if (typeof window._firebaseSaveAttempt === 'function') {
      await window._firebaseSaveAttempt(testId, answersObject, null, studentName);
      console.log('💾 Auto-saved for', studentCode);
    }
  } catch(err){
    console.warn('❌ AutoSave lỗi:', err.message);
  }
}

/* End of de.js */