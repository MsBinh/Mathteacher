// ===== CONFIGURATION FILE - NEW FIREBASE PROJECT =====
// Replace with your new Firebase project configuration
// Go to https://console.firebase.google.com/ and create a new project

const firebaseConfig = {
    apiKey: "YOUR_NEW_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// URL Constants for data fetching
const EXAMS_LIST_URL = 'matrix_exams.json'; // Primary exams list
const EXAMS_LIST_FALLBACK_URL = '12Hk1.json'; // Fallback exams list
const EXAMS_FOLDER_URL = '12HK1/'; // Base path for exam files

// Initialize Firebase (Database only for now)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase references
const database = firebase.database();
const auth = null; // Disable auth temporarily

// Application Constants
const CONSTANTS = {
    // Version info
    VERSION: "2.0.0",
    BUILD_DATE: "2025-01-09",

    // UI Constants
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 250,

    // Firebase paths
    FIREBASE_PATHS: {
        CLASSES: 'classes',
        STUDENTS: 'students',
        EXAMS: 'exams',
        POLLS: 'polls',
        INTERACTIONS: 'interactions',
        PROGRESS: 'progress'
    },

    // Question types
    QUESTION_TYPES: {
        MULTIPLE_CHOICE: 'multiple_choice',
        TRUE_FALSE: 'true_false',
        SHORT_ANSWER: 'short_answer'
    },

    // Difficulty levels
    DIFFICULTY_LEVELS: {
        NHAN_BIET: 'nhan_biet',
        THONG_HIEU: 'thong_hieu',
        VAN_DUNG: 'van_dung',
        VAN_DUNG_CAO: 'van_dung_cao'
    },

    // Colors
    COLORS: {
        SUCCESS: '#28a745',
        WARNING: '#ffc107',
        ERROR: '#dc3545',
        INFO: '#17a2b8',
        PRIMARY: '#1a237e',
        SECONDARY: '#546e7a'
    },

    // Timeout values
    TIMEOUTS: {
        NOTIFICATION: 5000,
        LOADING: 30000,
        POLL: 60000
    }
};

// Export for use in other modules
window.CONSTANTS = CONSTANTS;
window.firebaseConfig = firebaseConfig;
window.database = database;
window.auth = auth;
window.EXAMS_LIST_URL = EXAMS_LIST_URL;
window.EXAMS_LIST_FALLBACK_URL = EXAMS_LIST_FALLBACK_URL;
window.EXAMS_FOLDER_URL = EXAMS_FOLDER_URL;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🚀 ${CONSTANTS.VERSION} - Hệ thống Lớp Toán Thầy Bình khởi động thành công!`);
    console.log('⚠️  Vui lòng cập nhật Firebase config với project mới!');
});