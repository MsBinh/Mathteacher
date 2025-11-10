// app.js - Hệ Thống Quản Lý Trung Tâm với Đăng nhập Mã
class TrungTamManager {
    constructor() {
        this.config = {
            apiKey: "AIzaSyDVRsgVDCKk5lIfCRxhSlWiBetNlZBukcc",
            authDomain: "daytoantructuyen-149d9.firebaseapp.com",
            databaseURL: "https://daytoantructuyen-149d9-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "daytoantructuyen-149d9",
            storageBucket: "daytoantructuyen-149d9.firebasestorage.app",
            messagingSenderId: "258454714393",
            appId: "1:258454714393:web:bcf66624668e516934d288"
        };
        
        this.currentUser = null;
        this.students = {};
        this.teachers = {};
        this.classes = {};
        this.memberCodes = {};
        this.subjects = ['Toán', 'Lý', 'Hóa', 'Văn', 'Anh', 'Sinh', 'Sử', 'Địa'];
        this.grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        
        this.init();
    }

    init() {
        this.initFirebase();
        this.setupEventListeners();
        this.checkLoginStatus();
        this.populateSelectOptions();
    }

    populateSelectOptions() {
        // Populate subjects for student form
        const studentSubjects = document.getElementById('student-subjects');
        if (studentSubjects) {
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                studentSubjects.appendChild(option);
            });
        }

        // Populate grades for student form
        const studentGrade = document.getElementById('student-grade');
        if (studentGrade) {
            this.grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = `Khối ${grade}`;
                studentGrade.appendChild(option);
            });
        }

        // Populate teacher subjects
        const teacherSubject = document.getElementById('teacher-subject');
        if (teacherSubject) {
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                teacherSubject.appendChild(option);
            });
        }

        // Populate class grades and subjects
        const classGrade = document.getElementById('class-grade');
        const classSubject = document.getElementById('class-subject');
        if (classGrade && classSubject) {
            this.grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = `Khối ${grade}`;
                classGrade.appendChild(option);
            });

            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                classSubject.appendChild(option);
            });
        }
    }

    initFirebase() {
        try {
            firebase.initializeApp(this.config);
            this.db = firebase.database();
            console.log("✅ Firebase Database đã kết nối!");
        } catch (error) {
            console.log("✅ Firebase đã được khởi tạo");
        }
    }

    setupEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.loginWithCode();
        });

        document.getElementById('search-student').addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        document.getElementById('search-teacher').addEventListener('input', (e) => {
            this.searchTeachers(e.target.value);
        });

        const searchMemberCode = document.getElementById('search-member-code');
        if (searchMemberCode) {
            searchMemberCode.addEventListener('input', (e) => {
                this.searchMemberCodes(e.target.value);
            });
        }

        const filterMemberRole = document.getElementById('filter-member-role');
        if (filterMemberRole) {
            filterMemberRole.addEventListener('change', (e) => {
                this.filterMemberCodesByRole(e.target.value);
            });
        }

        const memberRole = document.getElementById('member-role');
        if (memberRole) {
            memberRole.addEventListener('change', () => {
                this.generateCode();
            });
        }
    }

    async loginWithCode() {
        const code = document.getElementById('login-email').value.trim();
        const name = document.getElementById('login-password').value.trim();

        if (!code) {
            this.showNotification('❌ Vui lòng nhập mã đăng nhập!', 'error');
            return;
        }

        try {
            if (code === 'admin79') {
                this.currentUser = {
                    uid: 'admin_79',
                    code: 'admin79',
                    name: name || 'Quản trị viên',
                    role: 'admin',
                    email: 'admin@trungtam.com'
                };
                this.showNotification('🎉 Đăng nhập ADMIN thành công!', 'success');
                this.showMainApp();
                this.loadInitialData();
                return;
            }

            const snapshot = await this.db.ref('memberCodes/' + code).once('value');
            const memberData = snapshot.val();

            if (!memberData) {
                this.showNotification('❌ Mã đăng nhập không tồn tại!', 'error');
                return;
            }

            if (memberData.status !== 'active') {
                this.showNotification('❌ Mã đã bị khóa hoặc không hoạt động!', 'error');
                return;
            }

            this.currentUser = {
                uid: 'member_' + code,
                code: code,
                name: memberData.name,
                role: memberData.role,
                email: memberData.email,
                phone: memberData.phone
            };

            await this.db.ref('memberCodes/' + code).update({
                lastLogin: firebase.database.ServerValue.TIMESTAMP,
                loginCount: (memberData.loginCount || 0) + 1
            });

            this.showNotification(`🎉 Đăng nhập thành công! Chào ${memberData.name}`, 'success');
            this.showMainApp();
            this.loadInitialData();

        } catch (error) {
            this.showNotification('❌ Lỗi đăng nhập: ' + error.message, 'error');
        }
    }

    checkLoginStatus() {
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-view').style.display = 'flex';
        document.getElementById('app-view').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'block';
        
        const roleDisplay = {
            'admin': 'Quản trị viên',
            'teacher': 'Giáo viên',
            'staff': 'Nhân viên',
            'student': 'Học sinh'
        };
        
        document.getElementById('current-user-info').textContent = 
            `${this.currentUser.name} (${roleDisplay[this.currentUser.role]}) - Mã: ${this.currentUser.code}`;
        
        this.updateUIBasedOnRole();
    }

    updateUIBasedOnRole() {
        const isAdmin = this.currentUser.role === 'admin';
        
        document.getElementById('manage-codes-nav').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('assign-code-btn').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('add-student-btn').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('add-teacher-btn').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('add-class-btn').style.display = isAdmin ? 'inline-block' : 'none';
    }

    logout() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            this.currentUser = null;
            location.reload();
        }
    }

    // ========== QUẢN LÝ HỌC SINH ==========
    async loadStudents() {
        try {
            const snapshot = await this.db.ref('students').once('value');
            this.students = snapshot.val() || {};
            this.displayStudents(this.students);
        } catch (error) {
            console.log("⚠️ Lỗi tải học sinh:", error);
            this.students = {};
            this.displayStudents(this.students);
        }
    }

    displayStudents(students) {
        const tbody = document.getElementById('students-table-body');
        
        if (Object.keys(students).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        <i class="fas fa-users fa-2x mb-2"></i><br>
                        Chưa có học sinh nào.<br>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddStudentModal()">
                            Thêm học sinh đầu tiên
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        Object.entries(students).forEach(([studentId, student]) => {
            const studentCode = student.code || studentId.substring(0, 8);
            
            html += `
                <tr>
                    <td><strong>${studentCode}</strong></td>
                    <td>
                        <div class="fw-bold">${student.fullName}</div>
                        <small class="text-muted">${student.phone}</small>
                    </td>
                    <td>${student.grade ? 'Khối ' + student.grade : 'Chưa cập nhật'}</td>
                    <td>
                        <div class="d-flex flex-wrap gap-1">
                            ${student.subjects ? student.subjects.map(subject => 
                                `<span class="badge bg-primary">${subject}</span>`
                            ).join('') : ''}
                        </div>
                    </td>
                    <td>${student.parentName || 'Chưa cập nhật'}</td>
                    <td>${student.phone}</td>
                    <td>
                        <span class="badge bg-success">Đang học</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="app.editStudent('${studentId}')" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info me-1" onclick="app.viewStudent('${studentId}')" title="Xem">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteStudent('${studentId}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    async addStudent() {
        const form = document.getElementById('addStudentForm');
        const formData = new FormData(form);
        
        const studentData = {
            fullName: formData.get('fullName'),
            grade: formData.get('grade'),
            subjects: Array.from(formData.getAll('subjects')),
            parentName: formData.get('parentName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            status: 'active',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: this.currentUser.uid
        };

        if (!studentData.fullName || !studentData.phone) {
            this.showNotification('❌ Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        try {
            const studentId = 'student_' + Date.now();
            studentData.code = 'HS' + (Object.keys(this.students).length + 1).toString().padStart(3, '0');
            
            await this.db.ref('students/' + studentId).set(studentData);
            
            bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
            form.reset();
            await this.loadStudents();
            this.updateDashboard();
            
            this.showNotification('✅ Đã thêm học sinh thành công!', 'success');
            
        } catch (error) {
            console.log("⚠️ Lỗi khi thêm học sinh:", error);
            this.showNotification('❌ Lỗi khi thêm học sinh: ' + error.message, 'error');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;

        try {
            await this.db.ref('students/' + studentId).remove();
            await this.loadStudents();
            this.showNotification('✅ Đã xóa học sinh!', 'success');
        } catch (error) {
            this.showNotification('❌ Lỗi khi xóa học sinh: ' + error.message, 'error');
        }
        
        this.updateDashboard();
    }

    searchStudents(searchTerm) {
        if (!searchTerm) {
            this.displayStudents(this.students);
            return;
        }

        const filteredStudents = {};
        const term = searchTerm.toLowerCase();

        Object.entries(this.students).forEach(([studentId, student]) => {
            if (
                student.fullName.toLowerCase().includes(term) ||
                (student.parentName && student.parentName.toLowerCase().includes(term)) ||
                (student.phone && student.phone.includes(term)) ||
                (student.email && student.email.toLowerCase().includes(term))
            ) {
                filteredStudents[studentId] = student;
            }
        });

        this.displayStudents(filteredStudents);
    }

    // ========== QUẢN LÝ GIÁO VIÊN ==========
    async loadTeachers() {
        try {
            const snapshot = await this.db.ref('teachers').once('value');
            this.teachers = snapshot.val() || {};
            this.displayTeachers(this.teachers);
        } catch (error) {
            console.log("⚠️ Lỗi tải giáo viên:", error);
            this.teachers = {};
            this.displayTeachers(this.teachers);
        }
    }

    displayTeachers(teachers) {
        const tbody = document.getElementById('teachers-table-body');
        
        if (Object.keys(teachers).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fas fa-chalkboard-teacher fa-2x mb-2"></i><br>
                        Chưa có giáo viên nào.<br>
                        <button class="btn btn-primary btn-sm mt-2" onclick="showAddTeacherModal()">
                            Thêm giáo viên đầu tiên
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        Object.entries(teachers).forEach(([teacherId, teacher]) => {
            const teacherCode = teacher.code || teacherId.substring(0, 8);
            
            html += `
                <tr>
                    <td><strong>${teacherCode}</strong></td>
                    <td>
                        <div class="fw-bold">${teacher.fullName}</div>
                        <small class="text-muted">${teacher.phone}</small>
                    </td>
                    <td>${teacher.subject || 'Chưa cập nhật'}</td>
                    <td>${teacher.qualification || 'Chưa cập nhật'}</td>
                    <td>${teacher.specialization || 'Chưa cập nhật'}</td>
                    <td>
                        <span class="badge bg-success">Đang dạy</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="app.editTeacher('${teacherId}')" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info me-1" onclick="app.viewTeacher('${teacherId}')" title="Xem">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteTeacher('${teacherId}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    async addTeacher() {
        const form = document.getElementById('addTeacherForm');
        const formData = new FormData(form);
        
        const teacherData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            qualification: formData.get('qualification'),
            specialization: formData.get('specialization'),
            email: formData.get('email'),
            address: formData.get('address'),
            status: 'active',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: this.currentUser.uid
        };

        if (!teacherData.fullName || !teacherData.qualification || !teacherData.specialization) {
            this.showNotification('❌ Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        try {
            const teacherId = 'teacher_' + Date.now();
            teacherData.code = 'GV' + (Object.keys(this.teachers).length + 1).toString().padStart(3, '0');
            
            await this.db.ref('teachers/' + teacherId).set(teacherData);
            
            bootstrap.Modal.getInstance(document.getElementById('addTeacherModal')).hide();
            form.reset();
            await this.loadTeachers();
            this.updateDashboard();
            
            this.showNotification('✅ Đã thêm giáo viên thành công!', 'success');
            
        } catch (error) {
            console.log("⚠️ Lỗi khi thêm giáo viên:", error);
            this.showNotification('❌ Lỗi khi thêm giáo viên: ' + error.message, 'error');
        }
    }

    async deleteTeacher(teacherId) {
        if (!confirm('Bạn có chắc muốn xóa giáo viên này?')) return;

        try {
            await this.db.ref('teachers/' + teacherId).remove();
            await this.loadTeachers();
            this.showNotification('✅ Đã xóa giáo viên!', 'success');
        } catch (error) {
            this.showNotification('❌ Lỗi khi xóa giáo viên: ' + error.message, 'error');
        }
        
        this.updateDashboard();
    }

    searchTeachers(searchTerm) {
        if (!searchTerm) {
            this.displayTeachers(this.teachers);
            return;
        }

        const filteredTeachers = {};
        const term = searchTerm.toLowerCase();

        Object.entries(this.teachers).forEach(([teacherId, teacher]) => {
            if (
                teacher.fullName.toLowerCase().includes(term) ||
                (teacher.phone && teacher.phone.includes(term)) ||
                (teacher.email && teacher.email.toLowerCase().includes(term)) ||
                (teacher.subject && teacher.subject.toLowerCase().includes(term))
            ) {
                filteredTeachers[teacherId] = teacher;
            }
        });

        this.displayTeachers(filteredTeachers);
    }

    // ========== QUẢN LÝ LỚP HỌC ==========
    async loadClasses() {
        try {
            const snapshot = await this.db.ref('classes').once('value');
            this.classes = snapshot.val() || {};
            this.displayClasses(this.classes);
        } catch (error) {
            console.log("⚠️ Lỗi tải lớp học:", error);
            this.classes = {};
            this.displayClasses(this.classes);
        }
    }

    displayClasses(classes) {
        const container = document.getElementById('classes-list');
        
        if (Object.keys(classes).length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-chalkboard fa-2x mb-2"></i><br>
                    Chưa có lớp học nào.<br>
                    <button class="btn btn-primary btn-sm mt-2" onclick="showAddClassModal()">
                        Thêm lớp học đầu tiên
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        Object.entries(classes).forEach(([classId, classData]) => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <strong>${classData.classCode}</strong>
                            <span class="badge bg-primary">${classData.subject} - Khối ${classData.grade}</span>
                        </div>
                        <div class="card-body">
                            <p><strong>Học phí:</strong> ${this.formatCurrency(classData.tuitionFee)}</p>
                            <p><strong>Lịch học:</strong> ${classData.schedule}</p>
                            <p><strong>Phòng học:</strong> ${classData.room}</p>
                            <p><strong>Ngày bắt đầu:</strong> ${this.formatDate(classData.startDate)}</p>
                            <p><strong>Ngày thu học phí:</strong> ${classData.paymentDay} hàng tháng</p>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="app.editClass('${classId}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info me-1" onclick="app.viewClass('${classId}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteClass('${classId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    async addClass() {
        const form = document.getElementById('addClassForm');
        const formData = new FormData(form);
        
        const classData = {
            classCode: formData.get('classCode'),
            grade: formData.get('grade'),
            subject: formData.get('subject'),
            tuitionFee: parseInt(formData.get('tuitionFee')),
            schedule: formData.get('schedule'),
            room: formData.get('room'),
            startDate: formData.get('startDate'),
            paymentDay: formData.get('paymentDay'),
            status: 'active',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: this.currentUser.uid
        };

        if (!classData.classCode || !classData.grade || !classData.subject) {
            this.showNotification('❌ Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        try {
            const classId = 'class_' + Date.now();
            
            await this.db.ref('classes/' + classId).set(classData);
            
            bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            form.reset();
            await this.loadClasses();
            this.updateDashboard();
            
            this.showNotification('✅ Đã thêm lớp học thành công!', 'success');
            
        } catch (error) {
            console.log("⚠️ Lỗi khi thêm lớp học:", error);
            this.showNotification('❌ Lỗi khi thêm lớp học: ' + error.message, 'error');
        }
    }

    async deleteClass(classId) {
        if (!confirm('Bạn có chắc muốn xóa lớp học này?')) return;

        try {
            await this.db.ref('classes/' + classId).remove();
            await this.loadClasses();
            this.showNotification('✅ Đã xóa lớp học!', 'success');
        } catch (error) {
            this.showNotification('❌ Lỗi khi xóa lớp học: ' + error.message, 'error');
        }
        
        this.updateDashboard();
    }

    // ========== QUẢN LÝ MÃ THÀNH VIÊN ==========
    async showAssignCodeModal() {
        if (this.currentUser.role !== 'admin') {
            this.showNotification('❌ Chỉ Admin mới có quyền cấp mã!', 'error');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('assignCodeModal'));
        this.generateCode();
        modal.show();
    }

    generateCode() {
        const role = document.getElementById('member-role').value;
        if (!role) return;

        const prefixes = {
            'teacher': 'GV',
            'staff': 'NV', 
            'student': 'HS'
        };

        const prefix = prefixes[role];
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const code = `${prefix}${randomNum}`;

        document.getElementById('generated-code-preview').textContent = code;
        return code;
    }

    async assignMemberCode() {
        if (this.currentUser.role !== 'admin') {
            this.showNotification('❌ Không có quyền thực hiện!', 'error');
            return;
        }

        const role = document.getElementById('member-role').value;
        const name = document.getElementById('member-name').value;
        const phone = document.getElementById('member-phone').value;
        const email = document.getElementById('member-email').value;
        const notes = document.getElementById('member-notes').value;

        if (!role || !name) {
            this.showNotification('❌ Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        const code = this.generateCode();

        try {
            const memberData = {
                code: code,
                name: name,
                role: role,
                phone: phone,
                email: email,
                notes: notes,
                status: 'active',
                createdBy: this.currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                loginCount: 0
            };

            await this.db.ref('memberCodes/' + code).set(memberData);
            
            bootstrap.Modal.getInstance(document.getElementById('assignCodeModal')).hide();
            document.getElementById('assign-code-form').reset();
            
            this.showNotification(`✅ Đã cấp mã ${code} cho ${name}`, 'success');
            
            this.loadMemberCodes();
            
        } catch (error) {
            this.showNotification('❌ Lỗi khi cấp mã: ' + error.message, 'error');
        }
    }

    async loadMemberCodes() {
        try {
            const snapshot = await this.db.ref('memberCodes').once('value');
            this.memberCodes = snapshot.val() || {};
            this.updateMemberCodesStats();
            this.displayRecentCodes();
        } catch (error) {
            console.log("⚠️ Lỗi tải mã thành viên:", error);
        }
    }

    updateMemberCodesStats() {
        const codes = Object.values(this.memberCodes);
        
        const totalCodes = codes.length;
        const teacherCodes = codes.filter(code => code.role === 'teacher').length;
        const staffCodes = codes.filter(code => code.role === 'staff').length;
        const studentCodes = codes.filter(code => code.role === 'student').length;

        document.getElementById('total-codes').textContent = totalCodes;
        document.getElementById('teacher-codes').textContent = teacherCodes;
        document.getElementById('staff-codes').textContent = staffCodes;
        document.getElementById('student-codes').textContent = studentCodes;
    }

    displayRecentCodes() {
        const container = document.getElementById('recent-codes-list');
        const recentCodes = Object.entries(this.memberCodes)
            .sort(([,a], [,b]) => b.createdAt - a.createdAt)
            .slice(0, 10);

        if (recentCodes.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">Chưa có mã nào được cấp</p>';
            return;
        }

        let html = '<div class="list-group">';
        recentCodes.forEach(([code, data]) => {
            const roleBadges = {
                'teacher': '<span class="badge bg-success">Giáo viên</span>',
                'staff': '<span class="badge bg-info">Nhân viên</span>',
                'student': '<span class="badge bg-warning">Học sinh</span>'
            };

            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${code}</strong> - ${data.name}
                            <div>${roleBadges[data.role]} 
                            <small class="text-muted ms-2">${this.formatDate(data.createdAt)}</small></div>
                        </div>
                        <span class="badge ${data.status === 'active' ? 'bg-success' : 'bg-danger'}">
                            ${data.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    async showManageCodesModal() {
        const modal = new bootstrap.Modal(document.getElementById('manageCodesModal'));
        await this.loadAllMemberCodes();
        modal.show();
    }

    async loadAllMemberCodes() {
        try {
            const snapshot = await this.db.ref('memberCodes').once('value');
            this.memberCodes = snapshot.val() || {};
            this.displayAllMemberCodes(this.memberCodes);
        } catch (error) {
            console.log("⚠️ Lỗi tải mã thành viên:", error);
        }
    }

    displayAllMemberCodes(codes) {
        const tbody = document.getElementById('member-codes-table');
        
        if (Object.keys(codes).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fas fa-id-card fa-2x mb-2"></i><br>
                        Chưa có mã thành viên nào
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        Object.entries(codes).forEach(([code, data]) => {
            const roleText = {
                'teacher': 'Giáo viên',
                'staff': 'Nhân viên',
                'student': 'Học sinh'
            };

            html += `
                <tr>
                    <td><strong>${code}</strong></td>
                    <td>${data.name}</td>
                    <td>${roleText[data.role]}</td>
                    <td>
                        <span class="badge ${data.status === 'active' ? 'bg-success' : 'bg-danger'}">
                            ${data.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                    </td>
                    <td>${this.formatDate(data.createdAt)}</td>
                    <td>${data.lastLogin ? this.formatDate(data.lastLogin) : 'Chưa đăng nhập'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.revokeMemberCode('${code}')">
                            <i class="fas fa-ban"></i> Thu hồi
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    async revokeMemberCode(code) {
        if (this.currentUser.role !== 'admin') {
            this.showNotification('❌ Chỉ Admin mới có quyền thu hồi mã!', 'error');
            return;
        }

        if (!confirm(`Bạn có chắc muốn thu hồi mã ${code}?`)) {
            return;
        }

        try {
            await this.db.ref('memberCodes/' + code).update({
                status: 'revoked',
                revokedAt: firebase.database.ServerValue.TIMESTAMP,
                revokedBy: this.currentUser.uid
            });

            this.showNotification(`✅ Đã thu hồi mã ${code}`, 'success');
            this.loadAllMemberCodes();
            this.loadMemberCodes();
        } catch (error) {
            this.showNotification('❌ Lỗi khi thu hồi mã: ' + error.message, 'error');
        }
    }

    searchMemberCodes(searchTerm) {
        if (!searchTerm) {
            this.displayAllMemberCodes(this.memberCodes);
            return;
        }

        const filteredCodes = {};
        const term = searchTerm.toLowerCase();

        Object.entries(this.memberCodes).forEach(([code, data]) => {
            if (
                code.toLowerCase().includes(term) ||
                data.name.toLowerCase().includes(term) ||
                (data.email && data.email.toLowerCase().includes(term)) ||
                (data.phone && data.phone.includes(term))
            ) {
                filteredCodes[code] = data;
            }
        });

        this.displayAllMemberCodes(filteredCodes);
    }

    filterMemberCodesByRole(role) {
        if (role === 'all') {
            this.displayAllMemberCodes(this.memberCodes);
            return;
        }

        const filteredCodes = {};
        Object.entries(this.memberCodes).forEach(([code, data]) => {
            if (data.role === role) {
                filteredCodes[code] = data;
            }
        });

        this.displayAllMemberCodes(filteredCodes);
    }

    // ========== CÁC HÀM HỖ TRỢ ==========
    async loadInitialData() {
        await this.loadStudents();
        await this.loadTeachers();
        await this.loadClasses();
        if (this.currentUser.role === 'admin') {
            await this.loadMemberCodes();
        }
        this.updateDashboard();
    }

    updateDashboard() {
        const totalStudents = Object.keys(this.students).length;
        const totalTeachers = Object.keys(this.teachers).length;
        const totalClasses = Object.keys(this.classes).length;
        
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-teachers').textContent = totalTeachers;
        document.getElementById('total-classes').textContent = totalClasses;
        document.getElementById('monthly-revenue').textContent = '0đ';

        this.updateRecentActivities();
        this.updateNewStudentsList();
    }

    updateRecentActivities() {
        const container = document.getElementById('recent-activities');
        const activities = [];
        
        if (Object.keys(this.students).length > 0) {
            activities.push('Đã thêm học sinh mới');
        }
        if (Object.keys(this.teachers).length > 0) {
            activities.push('Đã thêm giáo viên mới');
        }
        if (Object.keys(this.classes).length > 0) {
            activities.push('Đã tạo lớp học mới');
        }
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">Chưa có hoạt động nào</p>';
            return;
        }
        
        let html = '<div class="list-group">';
        activities.forEach(activity => {
            html += `
                <div class="list-group-item border-0">
                    <div class="d-flex justify-content-between">
                        <span>${activity}</span>
                        <small class="text-muted">Vừa xong</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    updateNewStudentsList() {
        const container = document.getElementById('new-students-list');
        const students = Object.entries(this.students).slice(-5).reverse();
        
        if (students.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">Chưa có học sinh mới</p>';
            return;
        }
        
        let html = '<div class="list-group">';
        students.forEach(([studentId, student]) => {
            html += `
                <div class="list-group-item border-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${student.fullName}</strong>
                            <br><small class="text-muted">${student.phone}</small>
                        </div>
                        <small class="text-muted">Mới</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            min-width: 300px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('vi-VN');
    }

    formatCurrency(amount) {
        if (!amount) return '0đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Placeholder functions for future development
    editStudent(studentId) {
        this.showNotification('✏️ Tính năng sửa học sinh đang được phát triển...', 'info');
    }

    viewStudent(studentId) {
        this.showNotification('👁️ Tính năng xem chi tiết học sinh đang được phát triển...', 'info');
    }

    editTeacher(teacherId) {
        this.showNotification('✏️ Tính năng sửa giáo viên đang được phát triển...', 'info');
    }

    viewTeacher(teacherId) {
        this.showNotification('👁️ Tính năng xem chi tiết giáo viên đang được phát triển...', 'info');
    }

    editClass(classId) {
        this.showNotification('✏️ Tính năng sửa lớp học đang được phát triển...', 'info');
    }

    viewClass(classId) {
        this.showNotification('👁️ Tính năng xem chi tiết lớp học đang được phát triển...', 'info');
    }
}

// Initialize application
const app = new TrungTamManager();

// Global functions
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const titles = {
        'dashboard': '<i class="fas fa-tachometer-alt me-2"></i>Dashboard',
        'students': '<i class="fas fa-users me-2"></i>Quản lý Học sinh',
        'teachers': '<i class="fas fa-chalkboard-teacher me-2"></i>Quản lý Giáo viên',
        'classes': '<i class="fas fa-chalkboard me-2"></i>Quản lý Lớp học',
        'attendance': '<i class="fas fa-clipboard-check me-2"></i>Điểm danh',
        'finance': '<i class="fas fa-money-bill-wave me-2"></i>Quản lý Tài chính',
        'member-codes': '<i class="fas fa-id-card me-2"></i>Quản lý Mã'
    };
    
    document.getElementById('current-view-title').innerHTML = titles[viewName] || viewName;
}

function showAddStudentModal() {
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();
}

function showAddTeacherModal() {
    const modal = new bootstrap.Modal(document.getElementById('addTeacherModal'));
    modal.show();
}

function showAddClassModal() {
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

function showAssignCodeModal() {
    app.showAssignCodeModal();
}

function showManageCodesModal() {
    app.showManageCodesModal();
}

function generateCode() {
    app.generateCode();
}

function assignMemberCode() {
    app.assignMemberCode();
}

function addStudent() {
    app.addStudent();
}

function addTeacher() {
    app.addTeacher();
}

function addClass() {
    app.addClass();
}

function logout() {
    app.logout();
}