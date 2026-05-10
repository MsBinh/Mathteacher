/**
 * ============================================================
 *  Math AI Widget — nguyenthanhbinh.edu.vn
 *  Tác giả : Nguyễn Thanh Bình
 *  Phiên bản: 1.0.0
 *  Mô tả   : Chatbot hỏi đáp Toán THPT powered by Claude AI
 *  Nhúng   : <script src="math-ai-widget.js"></script>
 * ============================================================
 */

(function () {
  'use strict';

  /* ── CẤU HÌNH ────────────────────────────────────────────── */
  const CONFIG = {
    siteName   : 'Thầy Nguyễn Thanh Bình',
    siteUrl    : 'nguyenthanhbinh.edu.vn',
    model      : 'claude-sonnet-4-20250514',
    maxTokens  : 1200,
    maxHistory : 12,          // số lượt hội thoại giữ lại
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    accentColor: '#1565C0',
    fontUrl    : 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  };

  const QUICK_QUESTIONS = [
    { label: '📐 Phương trình',      text: 'Giải phương trình bậc 2: x² - 5x + 6 = 0, giải thích từng bước.' },
    { label: '∫ Tích phân',          text: 'Tính tích phân ∫(x² + 2x) dx và giải thích cách làm.' },
    { label: 'lim Giới hạn',         text: 'Tính giới hạn lim(x→0) sin(x)/x và giải thích tại sao bằng 1.' },
    { label: '📊 Xác suất',          text: 'Giải thích xác suất có điều kiện P(A|B) với ví dụ cụ thể.' },
    { label: '∠ Hình học',           text: 'Giải thích định lý Pythagore và cho ví dụ áp dụng thực tế.' },
    { label: "f' Đạo hàm",           text: "Tính đạo hàm của f(x) = x³ - 3x² + 2x - 1, giải thích từng bước." },
  ];

  const SYSTEM_PROMPT = `Bạn là Math AI, trợ lý toán học thông minh của ${CONFIG.siteName} tại ${CONFIG.siteUrl}.

NHIỆM VỤ: Hỗ trợ học sinh tự học và luyện tập Toán lớp 10–12 theo chương trình THPT Việt Nam.

PHONG CÁCH:
- Xưng "tôi", gọi học sinh là "em" — thân thiện, khuyến khích, kiên nhẫn
- Giải từng bước RÕ RÀNG, đánh số mỗi bước (Bước 1, Bước 2...)
- Dùng ký hiệu thuần text: x^2, sqrt(x), pi, ∞, ≤, ≥, ≠, ∈
- Công thức dài đặt trên dòng riêng, bắt đầu bằng "  => "
- Luôn kiểm tra & giải thích Ý NGHĨA kết quả sau khi tính
- Cuối mỗi bài: hỏi "Em có muốn tôi giải thích thêm phần nào không?"
- Nếu học sinh làm sai: chỉ đúng bước sai, giải thích TẠI SAO sai, hướng dẫn lại
- Khuyến khích học sinh tự thử trước khi cho đáp án

PHẠM VI: Đại số, Hình học, Giải tích, Xác suất & Thống kê, Tổ hợp – Nhị thức Newton cấp THPT.
Từ chối nhẹ nhàng các chủ đề ngoài toán học.`;

  /* ── STYLES ──────────────────────────────────────────────── */
  const CSS = `
@import url('${CONFIG.fontUrl}');

#ntb-root *, #ntb-root *::before, #ntb-root *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  font-family: 'Be Vietnam Pro', sans-serif;
}

/* FAB */
#ntb-fab {
  position: fixed; bottom: 24px; right: 24px;
  width: 62px; height: 62px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(145deg, #1976D2, #0D47A1);
  box-shadow: 0 4px 22px rgba(13,71,161,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 99990; transition: transform .22s, box-shadow .22s;
}
#ntb-fab:hover { transform: scale(1.09); box-shadow: 0 6px 32px rgba(13,71,161,.55); }
#ntb-fab svg  { width: 28px; height: 28px; fill: #fff; pointer-events: none; }
#ntb-badge {
  position: absolute; top: -3px; right: -3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #E53935; border: 2.5px solid #fff;
  font-size: 9px; font-weight: 700; color: #fff;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: -.5px;
}

/* PANEL */
#ntb-panel {
  position: fixed; bottom: 98px; right: 24px;
  width: 390px; height: 580px; max-height: calc(100vh - 120px);
  border-radius: 22px; overflow: hidden;
  background: #fff;
  box-shadow: 0 16px 56px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
  display: flex; flex-direction: column;
  z-index: 99989;
  transform: scale(.88) translateY(16px); opacity: 0; pointer-events: none;
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .22s ease;
}
#ntb-panel.ntb-open {
  transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
}

/* HEADER */
#ntb-header {
  background: linear-gradient(135deg, #1565C0 0%, #0A3880 100%);
  padding: 15px 16px; display: flex; align-items: center; gap: 11px; flex-shrink: 0;
}
#ntb-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0; user-select: none;
}
#ntb-hinfo { flex: 1; min-width: 0; }
#ntb-hinfo h3 { color: #fff; font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#ntb-hinfo p  { color: rgba(255,255,255,.72); font-size: 12px; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
#ntb-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #69F0AE; flex-shrink: 0;
  animation: ntb-pulse 2s infinite;
}
@keyframes ntb-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
#ntb-close {
  background: rgba(255,255,255,.15); border: none; border-radius: 9px;
  width: 34px; height: 34px; cursor: pointer; color: #fff; font-size: 17px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s; flex-shrink: 0; line-height: 1;
}
#ntb-close:hover { background: rgba(255,255,255,.27); }

/* CHIPS */
#ntb-chips {
  padding: 11px 13px 4px; display: flex; gap: 7px; flex-wrap: wrap; flex-shrink: 0;
  border-bottom: 1px solid #EEF2F9;
}
.ntb-chip {
  background: #EBF3FF; color: #1349A6; border: 1px solid #C2D8F8;
  border-radius: 20px; padding: 5px 11px; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .12s; white-space: nowrap;
}
.ntb-chip:hover { background: #C2D8F8; transform: translateY(-1px); }

/* MESSAGES */
#ntb-msgs {
  flex: 1; overflow-y: auto; padding: 14px 13px; display: flex; flex-direction: column; gap: 11px;
  scroll-behavior: smooth;
}
#ntb-msgs::-webkit-scrollbar { width: 4px; }
#ntb-msgs::-webkit-scrollbar-thumb { background: #BBDEFB; border-radius: 2px; }

.ntb-row { display: flex; gap: 8px; align-items: flex-end; }
.ntb-row.ntb-user { flex-direction: row-reverse; }

.ntb-ico {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px; user-select: none;
}
.ntb-row.ntb-bot  .ntb-ico { background: #E3F2FD; }
.ntb-row.ntb-user .ntb-ico { background: #1565C0; }

.ntb-bbl {
  max-width: 83%; padding: 10px 14px; border-radius: 18px;
  font-size: 13.5px; line-height: 1.65; word-break: break-word;
}
.ntb-row.ntb-bot  .ntb-bbl {
  background: #F4F7FC; color: #111827;
  border: 1px solid #E4EAF5; border-bottom-left-radius: 5px;
}
.ntb-row.ntb-user .ntb-bbl {
  background: linear-gradient(140deg,#1565C0,#1976D2); color: #fff;
  border-bottom-right-radius: 5px;
}

/* Typing dots */
.ntb-typing { display: flex; gap: 4px; padding: 2px 0; align-items: center; }
.ntb-d {
  width: 7px; height: 7px; border-radius: 50%; background: #90A4AE;
  animation: ntb-bounce 1.3s infinite;
}
.ntb-d:nth-child(2){animation-delay:.18s}
.ntb-d:nth-child(3){animation-delay:.36s}
@keyframes ntb-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }

/* Formatted reply parts */
.ntb-step {
  margin: 5px 0; padding: 6px 10px;
  background: #F0F6FF; border-left: 3px solid #1565C0;
  border-radius: 0 7px 7px 0; font-size: 13px;
}
.ntb-step b { color: #0D47A1; }
.ntb-warn { color: #C62828; font-weight: 500; }

/* FOOTER */
#ntb-footer {
  padding: 11px 13px 13px; border-top: 1px solid #EEF2F9; background: #fff; flex-shrink: 0;
}
#ntb-irow { display: flex; gap: 8px; align-items: flex-end; }
#ntb-inp {
  flex: 1; border: 1.5px solid #DDEAFF; border-radius: 13px;
  padding: 10px 13px; font-size: 13.5px; resize: none;
  min-height: 42px; max-height: 110px; outline: none; line-height: 1.45;
  font-family: 'Be Vietnam Pro', sans-serif; color: #111827; background: #F7FAFF;
  transition: border-color .2s, background .2s;
}
#ntb-inp:focus { border-color: #1565C0; background: #fff; }
#ntb-inp::placeholder { color: #9EB3CC; }
#ntb-send-btn {
  width: 42px; height: 42px; border-radius: 12px; border: none; cursor: pointer; flex-shrink: 0;
  background: linear-gradient(140deg,#1565C0,#0D47A1); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: transform .15s, opacity .15s;
}
#ntb-send-btn:hover:not(:disabled) { transform: scale(1.06); }
#ntb-send-btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }
#ntb-send-btn svg { width: 18px; height: 18px; fill: #fff; pointer-events: none; }
#ntb-powered { font-size: 11px; color: #AABDD4; text-align: center; margin-top: 7px; }

/* Mobile */
@media (max-width: 480px) {
  #ntb-panel { width: calc(100vw - 16px); right: 8px; bottom: 88px; }
  #ntb-fab   { bottom: 16px; right: 16px; }
}
`;

  /* ── HTML TEMPLATE ───────────────────────────────────────── */
  function buildHTML() {
    const chips = QUICK_QUESTIONS.map(q =>
      `<span class="ntb-chip" data-q="${escHtml(q.text)}">${escHtml(q.label)}</span>`
    ).join('');

    return `
<div id="ntb-root">
  <!-- FAB -->
  <button id="ntb-fab" aria-label="Mở Math AI Chat">
    <div id="ntb-badge">AI</div>
    <svg viewBox="0 0 24 24"><path d="M21 6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v8A2.5 2.5 0 0 0 5.5 17H9l3 3 3-3h3.5A2.5 2.5 0 0 0 21 14.5v-8Z"/></svg>
  </button>

  <!-- PANEL -->
  <div id="ntb-panel" role="dialog" aria-label="Math AI Chatbot">
    <!-- Header -->
    <div id="ntb-header">
      <div id="ntb-avatar">🧮</div>
      <div id="ntb-hinfo">
        <h3>Math AI — Thầy Bình</h3>
        <p><span id="ntb-dot"></span>Trợ lý Toán học THPT</p>
      </div>
      <button id="ntb-close" aria-label="Đóng">✕</button>
    </div>

    <!-- Quick chips -->
    <div id="ntb-chips">${chips}</div>

    <!-- Messages -->
    <div id="ntb-msgs" aria-live="polite"></div>

    <!-- Footer -->
    <div id="ntb-footer">
      <div id="ntb-irow">
        <textarea id="ntb-inp" rows="1"
          placeholder="Nhập câu hỏi toán học... (Enter để gửi)"
          aria-label="Câu hỏi toán học"></textarea>
        <button id="ntb-send-btn" aria-label="Gửi">
          <svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <p id="ntb-powered">Powered by Claude AI · ${CONFIG.siteUrl}</p>
    </div>
  </div>
</div>`;
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatReply(text) {
    // bold **...**
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // step arrows
    text = text.replace(/[ \t]*=>\s*(.*?)(\n|$)/g,
      '<div class="ntb-step"><b>⟹</b> $1</div>');
    // numbered steps
    text = text.replace(/(Bước\s*\d+)[:\.]?\s*(.*?)(\n|$)/g,
      '<div class="ntb-step"><b>$1:</b> $2</div>');
    // newlines
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  /* ── WIDGET CLASS ────────────────────────────────────────── */
  class MathAIWidget {
    constructor() {
      this.isOpen    = false;
      this.isBusy    = false;
      this.history   = [];      // [{role, content}]
      this.injectCSS();
      this.injectHTML();
      this.bindEvents();
      this.pushBotMsg(
        'Xin chào! Tôi là <b>Math AI</b> của Thầy Nguyễn Thanh Bình. 👋<br><br>' +
        'Tôi có thể giúp em:<br>' +
        '• Giải toán <b>từng bước chi tiết</b><br>' +
        '• Giải thích <b>khái niệm & lý thuyết</b><br>' +
        '• Phân tích <b>lỗi sai</b> và hướng dẫn lại<br><br>' +
        'Em hãy đặt câu hỏi hoặc chọn gợi ý bên trên nhé! 🎯'
      );
    }

    injectCSS() {
      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    injectHTML() {
      const div = document.createElement('div');
      div.innerHTML = buildHTML();
      document.body.appendChild(div);

      this.fab    = document.getElementById('ntb-fab');
      this.panel  = document.getElementById('ntb-panel');
      this.msgs   = document.getElementById('ntb-msgs');
      this.inp    = document.getElementById('ntb-inp');
      this.sendBtn= document.getElementById('ntb-send-btn');
    }

    bindEvents() {
      this.fab.addEventListener('click', () => this.toggle());
      document.getElementById('ntb-close').addEventListener('click', () => this.toggle());

      // Quick chips
      document.querySelectorAll('.ntb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const q = chip.dataset.q;
          if (q) this.send(q);
        });
      });

      // Textarea
      this.inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
      });
      this.inp.addEventListener('input', () => this.autoResize());
      this.sendBtn.addEventListener('click', () => this.send());

      // Close on outside click
      document.addEventListener('click', e => {
        if (this.isOpen &&
            !this.panel.contains(e.target) &&
            !this.fab.contains(e.target)) {
          this.toggle();
        }
      });
    }

    toggle() {
      this.isOpen = !this.isOpen;
      this.panel.classList.toggle('ntb-open', this.isOpen);
      if (this.isOpen) setTimeout(() => this.inp.focus(), 320);
    }

    autoResize() {
      this.inp.style.height = 'auto';
      this.inp.style.height = Math.min(this.inp.scrollHeight, 110) + 'px';
    }

    /* ── MESSAGES ── */
    pushBotMsg(html) {
      const row  = document.createElement('div');
      row.className = 'ntb-row ntb-bot';
      row.innerHTML = `<div class="ntb-ico">🧮</div><div class="ntb-bbl">${html}</div>`;
      this.msgs.appendChild(row);
      this.scrollBottom();
      return row.querySelector('.ntb-bbl');
    }

    pushUserMsg(text) {
      const row = document.createElement('div');
      row.className = 'ntb-row ntb-user';
      row.innerHTML = `<div class="ntb-ico">👤</div><div class="ntb-bbl">${escHtml(text)}</div>`;
      this.msgs.appendChild(row);
      this.scrollBottom();
    }

    showTyping() {
      const row = document.createElement('div');
      row.className = 'ntb-row ntb-bot'; row.id = 'ntb-typing';
      row.innerHTML = `<div class="ntb-ico">🧮</div>
        <div class="ntb-bbl">
          <div class="ntb-typing">
            <div class="ntb-d"></div><div class="ntb-d"></div><div class="ntb-d"></div>
          </div>
        </div>`;
      this.msgs.appendChild(row);
      this.scrollBottom();
    }

    removeTyping() {
      const t = document.getElementById('ntb-typing');
      if (t) t.remove();
    }

    scrollBottom() {
      this.msgs.scrollTop = this.msgs.scrollHeight;
    }

    /* ── SEND ── */
    async send(forceText) {
      const text = forceText || this.inp.value.trim();
      if (!text || this.isBusy) return;

      // Reset input
      if (!forceText) { this.inp.value = ''; this.inp.style.height = 'auto'; }

      this.pushUserMsg(text);
      this.history.push({ role: 'user', content: text });

      this.isBusy = true;
      this.sendBtn.disabled = true;
      this.showTyping();

      try {
        const res = await fetch(CONFIG.apiEndpoint, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            model  : CONFIG.model,
            max_tokens: CONFIG.maxTokens,
            system : SYSTEM_PROMPT,
            messages: this.history.slice(-CONFIG.maxHistory),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const reply = (data.content || [])
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('') || 'Xin lỗi em, tôi không nhận được phản hồi. Vui lòng thử lại!';

        this.removeTyping();
        this.pushBotMsg(formatReply(reply));
        this.history.push({ role: 'assistant', content: reply });

        // Trim history nếu quá dài
        if (this.history.length > CONFIG.maxHistory * 2) {
          this.history = this.history.slice(-CONFIG.maxHistory);
        }

      } catch (err) {
        console.error('[Math AI Widget]', err);
        this.removeTyping();
        this.pushBotMsg(
          '<span class="ntb-warn">⚠ Kết nối bị gián đoạn.</span> ' +
          'Em vui lòng thử lại sau nhé! 🙏'
        );
      }

      this.isBusy = false;
      this.sendBtn.disabled = false;
      this.inp.focus();
    }
  }

  /* ── KHỞI CHẠY ───────────────────────────────────────────── */
  function init() {
    if (document.getElementById('ntb-root')) return; // tránh load kép
    window.__NTBMathAI = new MathAIWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
