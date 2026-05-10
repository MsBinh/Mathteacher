(function() {
    // 1. TỰ ĐỘNG NẠP FONT AWESOME
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link'); fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }

    // 2. CSS GIAO DIỆN
    const style = document.createElement('style');
    style.innerHTML = `
        #binh-bot-wrapper { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; }
        #binh-bot-btn { width: 60px; height: 60px; background: #0f172a; color: white; border-radius: 50%; border: 4px solid white; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 28px; transition: 0.3s; }
        #binh-bot-panel { display: none; width: 350px; height: 500px; background: white; position: absolute; bottom: 80px; right: 0; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); flex-direction: column; border: 1px solid #e2e8f0; overflow: hidden; font-family: 'Segoe UI', Tahoma, sans-serif; }
        #binh-bot-header { background: #0f172a; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f59e0b; }
        #binh-bot-content { flex: 1; padding: 15px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
        .binh-msg-ai { background: #ffffff; color: #334155; padding: 12px; border-radius: 15px 15px 15px 0; font-size: 14px; border: 1px solid #e2e8f0; max-width: 90%; line-height: 1.6; }
        .binh-msg-user { background: #dbeafe; color: #1e3a8a; padding: 10px; border-radius: 15px 15px 0 15px; font-size: 14px; align-self: flex-end; max-width: 90%; text-align: right; }
        #binh-bot-footer { padding: 12px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px; }
        #binh-bot-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 10px; outline: none; }
        .binh-btn-action { background: #0f172a; color: white; border: none; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; }
        #binh-status { font-size: 10px; color: #b45309; text-align: center; padding: 2px 0; background: #fffbeb; }
    `;
    document.head.appendChild(style);

    // 3. HTML CẤU TRÚC
    const wrapper = document.createElement('div');
    wrapper.id = 'binh-bot-wrapper';
    wrapper.innerHTML = `
        <div id="binh-bot-panel">
            <div id="binh-bot-header"><span>🤖 THẦY BÌNH AI</span><i class="fas fa-times" onclick="toggleBinhBot()" style="cursor:pointer"></i></div>
            <div id="binh-bot-content"><div class="binh-msg-ai">Chào em! Thầy Bình đã sẵn sàng. Gửi đề bài cho thầy nhé!</div></div>
            <div id="binh-status"></div>
            <div id="binh-bot-footer">
                <input type="file" id="binh-file-input" accept="image/*" style="display:none">
                <button class="binh-btn-action" onclick="document.getElementById('binh-file-input').click()"><i class="fas fa-camera"></i></button>
                <input type="text" id="binh-bot-input" placeholder="Nhập câu hỏi...">
                <button class="binh-btn-action" onclick="window.sendBinhMsg()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
        <button id="binh-bot-btn" onclick="toggleBinhBot()"><i class="fas fa-robot"></i></button>
    `;
    document.body.appendChild(wrapper);

    const PROXY_URL = 'https://script.google.com/macros/s/AKfycbxzoMlp8zEG99nO7I8rjPUOoYeIP5PpHi80naG-0MLOecdkHMhnzy8Gmrp6wADTdde5mA/exec';
    let imgData = null;

    window.toggleBinhBot = () => {
        const p = document.getElementById('binh-bot-panel');
        p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
    };

    // NÉN ẢNH SIÊU NHẸ (Dưới 200KB) ĐỂ CHỐNG LỖI KẾT NỐI
    async function processImg(file) {
        const status = document.getElementById('binh-status');
        status.innerText = "⚡ Đang tối ưu ảnh...";
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_W = 600; 
                let w = img.width, h = img.height;
                if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                imgData = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                status.innerHTML = "✅ Ảnh đã sẵn sàng!";
            };
        };
        reader.readAsDataURL(file);
    }

    document.getElementById('binh-file-input').onchange = (e) => processImg(e.target.files[0]);
    document.getElementById('binh-bot-input').onpaste = (e) => {
        const item = Array.from(e.clipboardData.items).find(x => x.type.indexOf('image') !== -1);
        if (item) processImg(item.getAsFile());
    };

    window.sendBinhMsg = async function() {
        const input = document.getElementById('binh-bot-input');
        const box = document.getElementById('binh-bot-content');
        const status = document.getElementById('binh-status');
        const txt = input.value.trim();
        if (!txt && !imgData) return;

        box.innerHTML += `<div class="binh-msg-user"><b>Em:</b> ${txt} ${imgData ? '<br>(Kèm ảnh đề)' : ''}</div>`;
        input.value = ""; box.scrollTop = box.scrollHeight;
        const tid = "ai-" + Date.now();
        box.innerHTML += `<div id="${tid}" class="binh-msg-ai"><i class="fas fa-spinner fa-spin"></i> Thầy đang giải...</div>`;

        // LỜI DẶN SIÊU NGẮN GỌN
        let promptPrefix = "Dưới vai Thạc sĩ Nguyễn Thanh Bình: Giải TRỰC DIỆN, cực ngắn. Dùng LaTeX $...$. Cấu trúc: **Chiến thuật**, **Giải nhanh**, **Lời dặn**. Câu hỏi: ";
        let parts = [{ text: promptPrefix + (txt || "Giải chi tiết đề toán này") }];
        if (imgData) parts.push({ inline_data: { mime_type: "image/jpeg", data: imgData } });

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify({ contents: [{ parts: parts }] }),
                redirect: "follow"
            });
            const data = await res.json();
            let reply = data.candidates[0].content.parts[0].text;
            
            // Xử lý hiển thị tin nhắn (xuống dòng và LaTeX)
            const aiCell = document.getElementById(tid);
            aiCell.innerHTML = `<b>AI Thầy Bình:</b><br>${reply.replace(/\n/g, '<br>')}`;
            
            // Ép MathJax quét lại tin nhắn để vẽ công thức
            if (window.MathJax) {
                window.MathJax.typesetPromise([aiCell]).catch(err => console.log("MathJax Error: ", err));
            }
        } catch (e) {
            document.getElementById(tid).innerHTML = "⚠️ Lỗi kết nối (Thầy hãy kiểm tra Deploy Apps Script).";
        }
        imgData = null; status.innerText = ""; box.scrollTop = box.scrollHeight;
    };
    document.getElementById('binh-bot-input').onkeypress = (e) => { if(e.key === 'Enter') window.sendBinhMsg(); };
})();