// js/firebase.js - KHÔNG DÙNG ES6 MODULES
window.FirebaseService = class {
    constructor() {
        this.listeners = new Map();
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            // 🔥 THAY BẰNG CONFIG CỦA BẠN
            const firebaseConfig = {
                apiKey: "AIzaSyDVRsgVDCKk5lIfCRxhSlWiBetNlZBukcc",
                authDomain: "daytoantructuyen-149d9.firebaseapp.com",
                databaseURL: "https://daytoantructuyen-149d9-default-rtdb.asia-southeast1.firebasedatabase.app",
                projectId: "daytoantructuyen-149d9",
                storageBucket: "daytoantructuyen-149d9.firebasestorage.app",
                messagingSenderId: "258454714393",
                appId: "1:258454714393:web:bcf66624668e516934d288"
            };

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            this.auth = firebase.auth();
            
            console.log("✅ Firebase initialized successfully");
            
            // Connection monitoring
            this.db.ref('.info/connected').on('value', (snap) => {
                const statusElement = document.getElementById('firebaseStatus');
                if (statusElement) {
                    if (snap.val() === true) {
                        statusElement.innerHTML = "✅ Firebase: Đã kết nối";
                        statusElement.className = "firebase-status firebase-connected";
                    } else {
                        statusElement.innerHTML = '<span class="loading-spinner"></span> Firebase: Đang kết nối...';
                        statusElement.className = "firebase-status firebase-disconnected";
                    }
                }
            });
            
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
            window.Utils.showError(`Lỗi Firebase: ${error.message}`);
            throw error;
        }
    }

    async loginAsTeacher(name) {
        try {
            const userCredential = await this.auth.signInAnonymously();
            const user = {
                uid: userCredential.user.uid,
                name: name,
                role: 'teacher',
                code: 'admin79'
            };
            
            await this.set(`users/${user.uid}`, {
                name: user.name,
                role: user.role,
                lastLogin: this.serverTimestamp()
            });
            
            return user;
        } catch (error) {
            console.error('Teacher login error:', error);
            throw error;
        }
    }

    async loginAsStudent(code, name) {
        try {
            const studentData = await this.get(`studentCodes/${code}`);
            if (!studentData) {
                throw new Error('Mã học sinh không tồn tại!');
            }

            const userCredential = await this.auth.signInAnonymously();
            const user = {
                uid: userCredential.user.uid,
                name: name,
                role: 'student',
                code: code
            };

            await this.set(`users/${user.uid}`, {
                name: user.name,
                role: user.role,
                code: user.code,
                lastLogin: this.serverTimestamp()
            });

            await this.update(`studentCodes/${code}`, {
                lastLogin: this.serverTimestamp(),
                studentName: name
            });

            return user;
        } catch (error) {
            console.error('Student login error:', error);
            throw error;
        }
    }

    // Database Methods
    async set(path, data) {
        try {
            await this.db.ref(path).set(data);
            return true;
        } catch (error) {
            console.error(`Error setting data at ${path}:`, error);
            throw error;
        }
    }

    async get(path) {
        try {
            const snapshot = await this.db.ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            console.error(`Error getting data from ${path}:`, error);
            throw error;
        }
    }

    async update(path, data) {
        try {
            await this.db.ref(path).update(data);
            return true;
        } catch (error) {
            console.error(`Error updating data at ${path}:`, error);
            throw error;
        }
    }

    async remove(path) {
        try {
            await this.db.ref(path).remove();
            return true;
        } catch (error) {
            console.error(`Error removing data at ${path}:`, error);
            throw error;
        }
    }

    async push(path, data) {
        try {
            const newRef = this.db.ref(path).push();
            await newRef.set(data);
            return newRef.key;
        } catch (error) {
            console.error(`Error pushing data to ${path}:`, error);
            throw error;
        }
    }

    // Real-time Listeners
    on(path, callback) {
        const dbRef = this.db.ref(path);
        const listener = dbRef.on('value', (snapshot) => {
            callback(snapshot.val());
        });
        
        this.listeners.set(path, listener);
        return () => this.off(path);
    }

    off(path) {
        const listener = this.listeners.get(path);
        if (listener) {
            this.db.ref(path).off('value', listener);
            this.listeners.delete(path);
        }
    }

    serverTimestamp() {
        return firebase.database.ServerValue.TIMESTAMP;
    }

    async createSession(sessionCode, teacherName) {
        const sessionData = {
            created: this.serverTimestamp(),
            teacher: teacherName,
            status: 'active',
            currentSlide: 0
        };
        
        await this.set(`sessions/${sessionCode}`, sessionData);
        return sessionCode;
    }

    async joinSession(sessionCode, studentData) {
        const studentSessionData = {
            name: studentData.name,
            code: studentData.code,
            joined: this.serverTimestamp(),
            status: 'active',
            score: 0,
            progress: 0,
            currentSlide: 0,
            lastActivity: this.serverTimestamp()
        };
        
        await this.set(`sessions/${sessionCode}/students/${studentData.uid}`, studentSessionData);
    }

    async saveAttempt(sessionCode, userId, attemptData) {
        const attemptPath = `attempts/${sessionCode}/${userId}`;
        await this.set(attemptPath, {
            ...attemptData,
            createdAt: this.serverTimestamp(),
            sessionCode: sessionCode
        });
    }

    async savePartialResult(sessionCode, userId, questionId, resultData) {
        const partialPath = `partialResults/${sessionCode}/${userId}/${questionId}`;
        await this.set(partialPath, {
            ...resultData,
            timestamp: this.serverTimestamp()
        });
    }
};

// Tạo global instance
window.firebaseService = new FirebaseService();