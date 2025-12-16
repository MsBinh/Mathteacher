/**
 * UI Mobile Improvements for Lớp Toán Thầy Bình - FIXED VERSION
 * Không override fetch để tránh conflict với Firebase
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 UI Mobile initializing...");
    
    // Kiểm tra Firebase connection trước
    checkFirebaseStatus();
    
    // Chỉ khởi tạo mobile UI nếu không phải là Firebase error
    if (window.innerWidth <= 768) {
        initMobileUI();
    }
    
    improveMathJaxMobile();
    console.log("✅ UI Mobile ready");
});

// ===== FIREBASE STATUS CHECK =====
function checkFirebaseStatus() {
    // Kiểm tra nếu Firebase đang connect
    const firebaseStatus = document.querySelector('.firebase-status');
    if (firebaseStatus && firebaseStatus.textContent.includes('Đang kết nối')) {
        console.warn("⚠️ Firebase đang connecting, delaying mobile init...");
        
        // Đợi Firebase connect xong
        const checkInterval = setInterval(() => {
            const status = document.querySelector('.firebase-status');
            if (status && !status.textContent.includes('Đang kết nối')) {
                clearInterval(checkInterval);
                console.log("✅ Firebase connected, initializing mobile UI");
                
                if (window.innerWidth <= 768) {
                    setTimeout(initMobileUI, 500);
                }
            }
        }, 1000);
    }
}

// ===== INIT MOBILE UI =====
function initMobileUI() {
    console.log("📱 Initializing mobile UI...");
    
    // 1. Tạo hamburger menu
    createHamburgerMenu();
    
    // 2. Tạo mobile controls dropdown
    createMobileControls();
    
    // 3. Thiết lập mobile topbar
    setupMobileTopbar();
    
    // 4. Ẩn desktop controls
    hideDesktopControls();
    
    // 5. Cache management (không override fetch)
    setupCacheManagement();
    
    // 6. Setup menu toggle
    setTimeout(setupMenuToggle, 100);
    
    console.log("✅ Mobile UI initialized");
}

// ===== HAMBURGER MENU (giữ nguyên) =====
function createHamburgerMenu() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    if (document.getElementById('hamburgerBtn')) return;
    
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.id = 'hamburgerBtn';
    hamburgerBtn.title = 'Mở menu điều khiển';
    
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) {
        topbar.insertBefore(hamburgerBtn, topbarTitle);
    }
}

// ===== MOBILE CONTROLS DROPDOWN (sửa lại) =====
function createMobileControls() {
    // Remove existing
    const oldControls = document.getElementById('mobileControls');
    if (oldControls) oldControls.remove();
    
    const desktopControls = document.querySelector('.desktop-controls');
    if (!desktopControls) return;
    
    // Create container
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.id = 'mobileControls';
    document.body.appendChild(mobileControls);
    
    // Title
    const title = document.createElement('div');
    title.innerHTML = '<h4>📱 Điều khiển</h4>';
    title.style.cssText = 'color:white; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px;';
    mobileControls.appendChild(title);
    
    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '🔄 Làm mới dữ liệu';
    refreshBtn.onclick = clearCacheAndReload;
    refreshBtn.style.cssText = 'background:linear-gradient(135deg, #4CAF50, #2E7D32); color:white; margin-bottom:10px;';
    mobileControls.appendChild(refreshBtn);
    
    // Exam select
    const examSelect = document.querySelector('#selectExam');
    if (examSelect) {
        const mobileSelect = examSelect.cloneNode(true);
        mobileSelect.id = 'mobileDropdownExamSelect';
        mobileSelect.addEventListener('change', function() {
            examSelect.value = this.value;
            examSelect.dispatchEvent(new Event('change'));
            setTimeout(() => mobileControls.classList.remove('active'), 300);
        });
        mobileControls.appendChild(mobileSelect);
    }
    
    // Other buttons (except Firebase-related)
    const buttons = desktopControls.querySelectorAll('button:not(#loginBtn):not(#slideMenuBtn)');
    buttons.forEach(button => {
        // Skip Firebase-related buttons
        if (button.id.includes('firebase') || button.onclick && button.onclick.toString().includes('firebase')) {
            return;
        }
        
        const mobileBtn = button.cloneNode(true);
        
        // Copy event
        const originalClick = button.onclick;
        if (originalClick) {
            mobileBtn.onclick = function(e) {
                originalClick.call(button, e);
                setTimeout(() => mobileControls.classList.remove('active'), 300);
            };
        }
        
        mobileControls.appendChild(mobileBtn);
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Đóng menu';
    closeBtn.onclick = () => mobileControls.classList.remove('active');
    closeBtn.style.cssText = 'background:#dc3545; color:white; margin-top:15px;';
    mobileControls.appendChild(closeBtn);
}

// ===== CACHE MANAGEMENT (FIXED - không override fetch) =====
function setupCacheManagement() {
    console.log("🗂️ Setting up cache management...");
    
    // 1. Intercept chỉ các JSON requests cụ thể
    interceptJSONRequests();
    
    // 2. Clear old cache
    clearOldCache();
    
    // 3. Add cache busting to specific elements
    addCacheBustingToLinks();
}

function interceptJSONRequests() {
    // KHÔNG override fetch globally
    // Chỉ intercept khi cần thiết
    
    // Listen for custom events
    document.addEventListener('loadJSONData', function(e) {
        const { url, callback } = e.detail;
        loadJSONWithCacheBusting(url, callback);
    });
}

function loadJSONWithCacheBusting(url, callback) {
    // Chỉ thêm cache busting cho exam/data files
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    
    console.log(`📥 Loading with cache busting: ${url}`);
    
    fetch(cacheBustedUrl, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        cache: 'no-store'
    })
    .then(response => response.json())
    .then(data => {
        callback(data);
        
        // Store in cache with timestamp
        const cacheKey = 'mobile_cache_' + btoa(url);
        localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    })
    .catch(error => {
        console.error('Failed to load:', error);
        
        // Try cache fallback
        const cacheKey = 'mobile_cache_' + btoa(url);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 300000) { // 5 minutes
                callback(parsed.data);
            }
        }
    });
}

function clearOldCache() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mobile_cache_')) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (now - item.timestamp > oneDay) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                // Ignore invalid JSON
            }
        }
    });
}

function addCacheBustingToLinks() {
    // Thêm cache busting cho các link tải xuống
    document.querySelectorAll('a[href$=".json"], a[href*="/api/"]').forEach(link => {
        const originalHref = link.href;
        if (!originalHref.includes('?_t=')) {
            link.href = originalHref + (originalHref.includes('?') ? '&' : '?') + '_t=' + Date.now();
        }
    });
}

// ===== CLEAR CACHE AND RELOAD (FIXED) =====
function clearCacheAndReload() {
    console.log("🔄 Clearing cache...");
    
    // Show notification
    showNotification('🔄 Đang làm mới dữ liệu...', 'info');
    
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
        if (key.includes('cache') || key.includes('exam') || key.includes('version')) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reload với cache busting
    setTimeout(() => {
        window.location.href = window.location.pathname + '?t=' + Date.now();
    }, 1000);
}

// ===== MOBILE TOPBAR (giữ nguyên) =====
function setupMobileTopbar() {
    const existingActions = document.getElementById('mobileTopbarActions');
    if (existingActions) existingActions.remove();
    
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-topbar-actions';
    mobileActions.id = 'mobileTopbarActions';
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const mobileLoginBtn = loginBtn.cloneNode(true);
        mobileLoginBtn.id = 'mobileLoginBtn';
        mobileLoginBtn.innerHTML = '🔑 Đăng nhập';
        mobileLoginBtn.onclick = () => {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('active');
        };
        mobileActions.appendChild(mobileLoginBtn);
        loginBtn.style.display = 'none';
    }
    
    // Exam select
    const examSelect = document.getElementById('selectExam');
    if (examSelect) {
        const mobileExamSelect = examSelect.cloneNode(true);
        mobileExamSelect.id = 'mobileExamSelect';
        mobileExamSelect.addEventListener('change', function() {
            examSelect.value = this.value;
            examSelect.dispatchEvent(new Event('change'));
        });
        mobileExamSelect.value = examSelect.value;
        mobileActions.appendChild(mobileExamSelect);
    }
    
    const topbar = document.querySelector('.topbar');
    if (topbar) topbar.appendChild(mobileActions);
}

// ===== ẨN DESKTOP CONTROLS =====
function hideDesktopControls() {
    const desktopControls = document.querySelector('.desktop-controls');
    if (desktopControls) {
        desktopControls.style.display = 'none';
    }
}

// ===== TOGGLE MOBILE MENU =====
function setupMenuToggle() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileControls = document.getElementById('mobileControls');
    
    if (hamburgerBtn && mobileControls) {
        hamburgerBtn.onclick = (e) => {
            e.stopPropagation();
            mobileControls.classList.toggle('active');
        };
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileControls.contains(e.target) && 
                !hamburgerBtn.contains(e.target) &&
                mobileControls.classList.contains('active')) {
                mobileControls.classList.remove('active');
            }
        });
        
        mobileControls.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// ===== MATHJAX IMPROVEMENTS (giữ nguyên) =====
function improveMathJaxMobile() {
    function handleMathJaxOverflow() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise().then(() => {
                document.querySelectorAll('mjx-container').forEach(container => {
                    container.style.maxWidth = '100%';
                    container.style.overflowX = 'auto';
                    container.style.WebkitOverflowScrolling = 'touch';
                });
            });
        }
    }
    
    if (document.readyState === 'complete') {
        setTimeout(handleMathJaxOverflow, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(handleMathJaxOverflow, 1000);
        });
    }
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const oldNotification = document.getElementById('mobileNotification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.id = 'mobileNotification';
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100000;
        padding: 12px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 90%;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== RESIZE HANDLER =====
let mobileMode = window.innerWidth <= 768;
window.addEventListener('resize', () => {
    const isMobileNow = window.innerWidth <= 768;
    
    if (isMobileNow && !mobileMode) {
        // Switch to mobile
        console.log("📱 Switching to mobile mode");
        initMobileUI();
        mobileMode = true;
    } else if (!isMobileNow && mobileMode) {
        // Switch to desktop
        console.log("🖥️ Switching to desktop mode");
        
        // Remove mobile elements
        ['hamburgerBtn', 'mobileControls', 'mobileTopbarActions'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.remove();
        });
        
        // Show desktop controls
        const desktopControls = document.querySelector('.desktop-controls');
        if (desktopControls) desktopControls.style.display = 'flex';
        
        // Show original login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.style.display = 'inline-block';
        
        mobileMode = false;
    }
});

// ===== UTILITY FUNCTION TO LOAD JSON WITH CACHE BUSTING =====
window.loadMobileJSON = function(url, options = {}) {
    // Utility function để load JSON với cache busting
    // Dùng cái này thay vì fetch trực tiếp
    
    const timestamp = Date.now();
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + '_mobile=' + timestamp;
    
    return fetch(cacheBustedUrl, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
        cache: 'no-store',
        ...options
    });
};

// ===== DEBUG HELPERS =====
window.mobileHelpers = {
    clearCache: clearCacheAndReload,
    checkCache: () => {
        const cacheKeys = Object.keys(localStorage).filter(k => k.includes('cache'));
        console.log('Cache keys:', cacheKeys);
        return cacheKeys;
    },
    testFirebase: () => {
        console.log('Firebase status:', document.querySelector('.firebase-status')?.textContent);
    }
};

console.log("📱 Mobile helpers available: window.mobileHelpers");