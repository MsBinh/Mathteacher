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
}
function checkShortAnswer(questionId, correctAnswer){
  if (window.checkedQuestions[questionId]) return;
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
        const data = snap.docs[0].data();
        const studentNameFromDB = data.name || name || 'Học sinh';
        localStorage.setItem('studentName', studentNameFromDB);
        localStorage.setItem('studentCode', code);
        window.allowShowSolution = true;
        document.getElementById('auth-status') && (document.getElementById('auth-status').textContent = '✅ Đăng nhập thành công');
        document.getElementById('login-modal')?.classList.add('hidden');
      } else {
        document.getElementById('auth-status') && (document.getElementById('auth-status').textContent = '❌ Mã không hợp lệ');
        document.getElementById('login-modal')?.classList.remove('hidden');
      }
    } catch(err){
      console.error(err);
      document.getElementById('auth-status') && (document.getElementById('auth-status').textContent = '❌ Lỗi đăng nhập: ' + err.message);
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
document.addEventListener('DOMContentLoaded', ()=>{
  const canvas = document.getElementById('drawCanvas');
  const toolbar = document.getElementById('drawToolbar') || document.querySelector('.toolbar');
  const toggleBtn = document.getElementById('toggle-draw');
  const undoBtn = document.getElementById('undo-canvas');
  const clearBtn = document.getElementById('clear-canvas');
  const saveBtn = document.getElementById('save-canvas');
  const exitBtn = document.getElementById('exit-draw');
  const colorPicker = document.getElementById('colorPicker');
  const toolSelect = document.getElementById('tool');
  const widthPicker = document.getElementById('draw-width');

  if (!canvas || !toolbar || !toggleBtn) {
    // không đủ UI thì thôi
    return;
  }

  const ctx = canvas.getContext('2d');
  let lineWidth = parseInt(widthPicker?.value) || 2;
  let isDrawing = false;
  let isDrawMode = false;
  let startX = 0, startY = 0;
  let currentTool = toolSelect?.value || 'pen';
  let imageBeforeShape = null;
  const history = [];
  const maxHistory = 50;

  function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; if (history.length) ctx.putImageData(history[history.length-1], 0, 0); }
  resizeCanvas(); window.addEventListener('resize', resizeCanvas);

  function setDrawMode(on){
    isDrawMode = !!on;
    canvas.style.display = isDrawMode ? 'block' : 'none';
    toolbar.style.display = isDrawMode ? 'flex' : 'none';
    toggleBtn.textContent = isDrawMode ? '❌ Tắt vẽ' : '🖊️ Vẽ';
  }

  toggleBtn.addEventListener('click', ()=> setDrawMode(!isDrawMode));
  exitBtn?.addEventListener('click', ()=> setDrawMode(false));
  toolSelect?.addEventListener('change', ()=> currentTool = toolSelect.value);
  colorPicker?.addEventListener('input', ()=> ctx.strokeStyle = colorPicker.value);
  widthPicker?.addEventListener('input', ()=> lineWidth = parseInt(widthPicker.value) || 2);

  undoBtn?.addEventListener('click', ()=>{
    history.pop(); ctx.clearRect(0,0,canvas.width,canvas.height);
    if (history.length) ctx.putImageData(history[history.length-1], 0,0);
  });
  clearBtn?.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); history.length = 0; });
  saveBtn?.addEventListener('click', ()=>{ try{ const a=document.createElement('a'); a.download='ban_ve.png'; a.href = canvas.toDataURL('image/png'); a.click(); }catch(e){console.error(e);} });

  function getPos(e){
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function startDraw(e){
    if (!isDrawMode) return;
    e.preventDefault();
    const p = getPos(e);
    isDrawing = true; startX = p.x; startY = p.y;
    if (currentTool !== 'pen') {
      imageBeforeShape = ctx.getImageData(0,0,canvas.width,canvas.height);
    } else {
      ctx.beginPath(); ctx.moveTo(startX, startY);
    }
  }

  function drawMove(e){
    if (!isDrawing || !isDrawMode) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.strokeStyle = colorPicker?.value || '#000';
    ctx.lineWidth = lineWidth; ctx.lineCap = 'round';
    if (currentTool === 'pen'){
      ctx.lineTo(p.x, p.y); ctx.stroke();
    } else {
      ctx.putImageData(imageBeforeShape, 0, 0);
      if (currentTool === 'line'){
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(p.x, p.y); ctx.stroke();
      } else if (currentTool === 'rect'){
        ctx.strokeRect(startX, startY, p.x - startX, p.y - startY);
      } else if (currentTool === 'circle'){
        const r = Math.hypot(p.x - startX, p.y - startY);
        ctx.beginPath(); ctx.arc(startX, startY, r, 0, Math.PI * 2); ctx.stroke();
      } else if (currentTool === 'cube'){
        let size = Math.min(Math.abs(p.x - startX), Math.abs(p.y - startY));
        ctx.strokeRect(startX, startY, size, size);
        ctx.strokeRect(startX + 10, startY - 10, size, size);
        ctx.beginPath();
        ctx.moveTo(startX, startY); ctx.lineTo(startX + 10, startY - 10);
        ctx.moveTo(startX + size, startY); ctx.lineTo(startX + size + 10, startY - 10);
        ctx.moveTo(startX, startY + size); ctx.lineTo(startX + 10, startY + size - 10);
        ctx.moveTo(startX + size, startY + size); ctx.lineTo(startX + size + 10, startY + size - 10);
        ctx.stroke();
      } else if (currentTool === 'cone'){
        let radius = Math.abs(p.x - startX);
        ctx.beginPath(); ctx.ellipse(startX, startY + 40, radius, 10, 0, 0, Math.PI * 2);
        ctx.moveTo(startX - radius, startY + 40); ctx.lineTo(startX, startY - 40); ctx.lineTo(startX + radius, startY + 40);
        ctx.stroke();
      } else if (currentTool === 'cylinder'){
        let r = Math.abs(p.x - startX);
        ctx.beginPath(); ctx.ellipse(startX, startY, r, 10, 0, 0, Math.PI * 2);
        ctx.moveTo(startX - r, startY); ctx.lineTo(startX - r, startY + 100);
        ctx.moveTo(startX + r, startY); ctx.lineTo(startX + r, startY + 100);
        ctx.ellipse(startX, startY + 100, r, 10, 0, 0, Math.PI);
        ctx.stroke();
      } else if (currentTool === 'pyramid'){
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(startX + 60, startY); ctx.lineTo(startX + 30, startY + 60);
        ctx.closePath(); ctx.moveTo(startX + 30, startY + 60); ctx.lineTo(startX + 30, startY - 40); ctx.stroke();
      } else if (currentTool === 'sphere'){
        let r = Math.abs(p.x - startX);
        ctx.beginPath(); ctx.arc(startX, startY, r, 0, Math.PI * 2); ctx.ellipse(startX, startY, r, r/2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function endDraw(){
    if (!isDrawMode) return;
    isDrawing = false;
    if (history.length >= maxHistory) history.shift();
    try { history.push(ctx.getImageData(0,0,canvas.width,canvas.height)); } catch(e){ /* cross-origin or memory */ }
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', drawMove);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseout', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', drawMove, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });
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

/* End of de.js */