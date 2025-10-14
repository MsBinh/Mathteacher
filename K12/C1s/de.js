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
  // DOM
  const canvas = document.getElementById('drawCanvas');
  const toolbar = document.getElementById('drawToolbar');
  const toggleBtn = document.getElementById('toggle-draw');
    const clearBtn = document.getElementById('clear-canvas');
    const saveBtn = document.getElementById('save-canvas');
    const exitBtn = document.getElementById('exit-draw');
  const colorPicker = document.getElementById('colorPicker');
  const toolSelect = document.getElementById('tool');
  const widthPicker = document.getElementById('draw-width');

  
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // state
  let isDrawMode = false;
  let isDrawing = false;
  let currentTool = toolSelect?.value || 'pen';
  let startNorm = null;
  let lastNorm = null;
  let snapshotImg = null;      // image for shape preview
  let snapshotData = null;     // dataURL
  const history = [];
  const maxHistory = 50;

  // make sure pointer events for stylus work and browser doesn't scroll
  canvas.style.touchAction = 'none';

  // ===== Resize: CSS size = window.innerWidth/Height, buffer = css * DPR =====
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    // preserve current drawing as dataURL
    let backup = null;
    try { backup = canvas.toDataURL(); } catch (err) { backup = null; }

    // set internal buffer to device pixels, and CSS to logical pixels
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    // set transform so that drawing coordinates are in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // restore image if any
    if (backup) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = backup;
    } else {
      ctx.clearRect(0, 0, cssW, cssH);
    }
  }
  // init + on resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ===== Coordinates helpers (CSS pixels) - giống logic cũ nhưng an toàn với DPR =====
  function getPosCSS(e) {
    const rect = canvas.getBoundingClientRect(); // CSS box
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height
    };
  }

  function toNormalized(posCSS) {
    return { x: posCSS.x / posCSS.w, y: posCSS.y / posCSS.h };
  }

  function fromNormalized(norm) {
    const rect = canvas.getBoundingClientRect();
    return { x: norm.x * rect.width, y: norm.y * rect.height };
  }

  // ===== UI bindings (keep your toolbar behavior) =====
  function toggleDrawMode() {
    isDrawMode = !isDrawMode;
    if (isDrawMode) {
      canvas.style.display = 'block';
      toolbar.style.display = 'flex';
      // ensure canvas sizes correct when opening
      resizeCanvas();
    } else {
      canvas.style.display = 'none';
      toolbar.style.display = 'none';
    }
    if (toggleBtn) toggleBtn.textContent = isDrawMode ? '❌ Tắt vẽ' : '🖊️ Vẽ';
  }
  if (toggleBtn) toggleBtn.addEventListener('click', toggleDrawMode);
  if (exitBtn) exitBtn.addEventListener('click', toggleDrawMode);
  if (toolSelect) toolSelect.addEventListener('change', () => currentTool = toolSelect.value);
  if (colorPicker) colorPicker.addEventListener('input', () => ctx.strokeStyle = colorPicker.value);
  if (widthPicker) widthPicker.addEventListener('input', () => {/* width read on each stroke */});

  // undo/clear/save using dataURL snapshots (robust with DPR)
  function pushHistory() {
    try {
      if (history.length >= maxHistory) history.shift();
      history.push(canvas.toDataURL());
    } catch (err) { /* ignore */ }
  }
  if (clearBtn) clearBtn.addEventListener('click', () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    history.length = 0;
  });
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'ban_ve.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  // undo button (if exists)
  const undoBtn = document.getElementById('undo-canvas');
  if (undoBtn) undoBtn.addEventListener('click', () => {
    if (history.length === 0) {
      const rect = canvas.getBoundingClientRect(); ctx.clearRect(0,0,rect.width, rect.height); return;
    }
    history.pop(); // remove current
    const last = history[history.length - 1];
    const rect = canvas.getBoundingClientRect();
    if (!last) { ctx.clearRect(0,0,rect.width, rect.height); return; }
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = last;
  });

  // ===== smoothing helper (quadratic midpoint) =====
  function penMoveSmooth(lastP, currP) {
    // lastP and currP are in CSS pixels
    const midX = (lastP.x + currP.x) / 2;
    const midY = (lastP.y + currP.y) / 2;
    ctx.quadraticCurveTo(lastP.x, lastP.y, midX, midY);
    ctx.stroke();
  }

  // ===== pointer event handlers (unified for mouse/finger/pen) =====
  function onPointerDown(e) {
    if (!isDrawMode) return;
    // only left-button mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture?.(e.pointerId);
    e.preventDefault();

    const pos = getPosCSS(e);
    const norm = toNormalized(pos);

    isDrawing = true;
    startNorm = norm;
    lastNorm = norm;

    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = parseInt(widthPicker.value || 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool !== 'pen') {
      // snapshot as image for preview
      try {
        snapshotData = canvas.toDataURL();
        snapshotImg = new Image();
        snapshotImg.src = snapshotData;
      } catch (err) {
        snapshotImg = null;
        snapshotData = null;
      }
    } else {
      const p = fromNormalized(norm);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  }

  function onPointerMove(e) {
    if (!isDrawing || !isDrawMode) return;
    e.preventDefault();
    const pos = getPosCSS(e);
    const norm = toNormalized(pos);
    const start = fromNormalized(startNorm);
    const curr = fromNormalized(norm);

    // pen: smooth quadratic midpoint (control = last point, end = midpoint)
    if (currentTool === 'pen') {
      const cp = curr;
      const lp = fromNormalized(lastNorm);
      // if first move after down, ensure we have a move from initial point
      if (lp) {
        penMoveSmooth(lp, cp);
      } else {
        ctx.moveTo(cp.x, cp.y);
      }
      lastNorm = norm;
      return;
    }

    // shapes preview: draw snapshot background then shape
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (snapshotImg && snapshotImg.complete) {
      ctx.drawImage(snapshotImg, 0, 0, rect.width, rect.height);
    }

    // draw current shape
    ctx.beginPath();
    if (currentTool === 'line') {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    } else if (currentTool === 'rect') {
      ctx.strokeRect(start.x, start.y, curr.x - start.x, curr.y - start.y);
    } else if (currentTool === 'circle') {
      const r = Math.hypot(curr.x - start.x, curr.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'cube') {
      // cube-like preview
      const w = curr.x - start.x;
      const h = curr.y - start.y;
      const d = Math.min(Math.abs(w), Math.abs(h)) / 2;
      const signX = w >= 0 ? 1 : -1;
      const signY = h >= 0 ? 1 : -1;
      const actualStartX = start.x + (signX < 0 ? -Math.abs(w) : 0);
      const actualStartY = start.y + (signY < 0 ? -Math.abs(h) : 0);
      const size = Math.min(Math.abs(w), Math.abs(h));
      ctx.strokeRect(actualStartX, actualStartY, size, size);
      ctx.strokeRect(actualStartX + size/4, actualStartY - size/4, size, size);
      ctx.beginPath();
      ctx.moveTo(actualStartX, actualStartY); ctx.lineTo(actualStartX + size/4, actualStartY - size/4);
      ctx.moveTo(actualStartX + size, actualStartY); ctx.lineTo(actualStartX + size + size/4, actualStartY - size/4);
      ctx.moveTo(actualStartX, actualStartY + size); ctx.lineTo(actualStartX + size/4, actualStartY + size - size/4);
      ctx.moveTo(actualStartX + size, actualStartY + size); ctx.lineTo(actualStartX + size + size/4, actualStartY + size - size/4);
      ctx.stroke();
    } else if (currentTool === 'cone') {
      const cx = (start.x + curr.x) / 2;
      const r = Math.abs(curr.x - start.x) / 2;
      const height = Math.abs(curr.y - start.y);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(curr.x, start.y);
      ctx.lineTo(cx, start.y + (curr.y - start.y));
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, start.y, r, r/3, 0, 0, 2 * Math.PI); ctx.stroke();
    } else if (currentTool === 'cylinder') {
      const cx = (start.x + curr.x) / 2;
      const r = Math.abs(curr.x - start.x) / 2;
      const h = Math.abs(curr.y - start.y);
      ctx.beginPath();
      ctx.ellipse(cx, start.y, r, r/3, 0, 0, 2*Math.PI); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(start.x, start.y); ctx.lineTo(start.x, start.y + h);
      ctx.moveTo(curr.x, start.y); ctx.lineTo(curr.x, start.y + h); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, start.y + h, r, r/3, 0, 0, Math.PI); ctx.stroke();
    } else if (currentTool === 'pyramid') {
      const cx = (start.x + curr.x) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, start.y);
      ctx.lineTo(start.x, curr.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.closePath(); ctx.stroke();
    } else if (currentTool === 'sphere') {
      const cx = (start.x + curr.x) / 2;
      const cy = (start.y + curr.y) / 2;
      const r = Math.hypot(curr.x - start.x, curr.y - start.y) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r/2, 0, 0, 2*Math.PI); ctx.stroke();
    }
  }

  function onPointerUp(e) {
    if (!isDrawing) return;
    canvas.releasePointerCapture?.(e.pointerId);
    isDrawing = false;
    lastNorm = null;
    // push snapshot for undo
    try { pushHistory(); } catch (err) {}
  }

  // bind pointer events (unified)
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // initial push of blank canvas for undo base
  try { pushHistory(); } catch (err) {}

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