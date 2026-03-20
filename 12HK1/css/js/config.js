// ===== CONFIGURATION FILE =====
// Contains Firebase configuration and application constants

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDVRsgVDCKk5lIfCRxhSlWiBetNlZBukcc",
    authDomain: "daytoantructuyen-149d9.firebaseapp.com",
    databaseURL: "https://daytoantructuyen-149d9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "daytoantructuyen-149d9",
    storageBucket: "daytoantructuyen-149d9.firebasestorage.app",
    messagingSenderId: "258454714393",
    appId: "1:258454714393:web:bcf66624668e516934d288"
};

// URL Constants for data fetching
const EXAMS_LIST_URL = 'matrix_exams.json'; // Primary exams list
const EXAMS_LIST_FALLBACK_URL = '12Hk1.json'; // Fallback exams list
const EXAMS_FOLDER_URL = '12HK1/'; // Base path for exam files

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase references
const database = firebase.database();
const auth = null;

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
});