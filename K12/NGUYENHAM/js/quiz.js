// js/quiz.js - KHÔNG DÙNG IMPORT/EXPORT
window.QuizManager = class {
    constructor() {
        this.questions = [];
        this.currentTest = '';
        this.studentAnswers = {};
        this.correctAnswers = {};
        this.isScoreCalculated = false;
    }

    async loadQuestions(testFile) {
        try {
            const response = await fetch(`data/questions.json`);
            const allQuestions = await response.json();
            
            this.questions = allQuestions.filter(q => q.test === testFile);
            this.currentTest = testFile;
            
            this.questions.forEach(question => {
                this.correctAnswers[question.id] = question.correct;
            });
            
            return this.questions;
        } catch (error) {
            console.error('Error loading questions:', error);
            window.showNotification('Lỗi tải câu hỏi!', 'error');
            return [];
        }
    }

    renderQuestions(container) {
        if (!this.questions.length) {
            container.innerHTML = '<div class="error">Không có câu hỏi nào được tải.</div>';
            return;
        }

        let html = '';
        
        this.questions.forEach(question => {
            html += this.renderQuestion(question);
        });

        container.innerHTML = html;
        this.attachEventListeners();
    }

    renderQuestion(question) {
        let optionsHTML = '';
        
        if (question.type === 'multiple_choice') {
            optionsHTML = this.renderMultipleChoiceOptions(question);
        } else if (question.type === 'true_false') {
            optionsHTML = this.renderTrueFalseOptions(question);
        } else if (question.type === 'short_answer') {
            optionsHTML = this.renderShortAnswerInput(question);
        }

        return `
            <section>
                <div class="question" id="${question.id}">
                    <p class="question-title"><strong>${question.title}</strong> ${question.text}</p>
                    ${question.image ? `<img src="${question.image}" alt="Hình minh họa">` : ''}
                    <div class="options">${optionsHTML}</div>
                    <div class="answer-check">
                        ${this.renderAnswerCheck(question)}
                    </div>
                    ${question.solution ? this.renderSolution(question) : ''}
                </div>
            </section>
        `;
    }
renderQuestion(question) {
    let optionsHTML = '';
    
    if (question.type === 'multiple_choice') {
        optionsHTML = this.renderMultipleChoiceOptions(question);
    } else if (question.type === 'true_false') {
        optionsHTML = this.renderTrueFalseOptions(question);
    } else if (question.type === 'short_answer') {
        optionsHTML = this.renderShortAnswerInput(question);
    } else if (question.type === 'info') {
        // Slide thông tin - không có câu hỏi
        return `
            <section>
                <div class="question info-slide" id="${question.id}">
                    <h2>${question.title}</h2>
                    <div class="question-content">
                        ${question.content || question.text}
                    </div>
                </div>
            </section>
        `;
    }

    // ... phần còn lại giữ nguyên
    return `
            <section>
                <div class="question" id="${question.id}">
                    <p class="question-title"><strong>${question.title}</strong> ${question.text}</p>
                    ${question.image ? `<img src="${question.image}" alt="Hình minh họa">` : ''}
                    <div class="options">${optionsHTML}</div>
                    <div class="answer-check">
                        ${this.renderAnswerCheck(question)}
                    </div>
                    ${question.solution ? this.renderSolution(question) : ''}
                </div>
            </section>
        `;
}
    renderMultipleChoiceOptions(question) {
        return ['A', 'B', 'C', 'D'].map(option => {
            if (!question[option]) return '';
            
            return `
                <div class="option-row">
                    <input type="radio" name="${question.id}" value="${option}" id="${question.id}${option}">
                    <label for="${question.id}${option}">${option}. ${question[option]}</label>
                    <span class="option-icon" id="icon-${question.id}-${option}"></span>
                </div>
            `;
        }).join('');
    }

    renderTrueFalseOptions(question) {
        const subQuestions = question.subQuestions || [];
        return subQuestions.map((subQ, index) => {
            const letter = String.fromCharCode(97 + index);
            return `
                <div class="option-row">
                    ${subQ.text}
                    <label><input name="${question.id}${letter}" type="radio" value="True"/> True</label>
                    <label><input name="${question.id}${letter}" type="radio" value="False"/> False</label>
                </div>
            `;
        }).join('');
    }

    renderShortAnswerInput(question) {
        return `
            <div class="answer-check">
                <input id="input-${question.id}" placeholder="Nhập kết quả (ví dụ: 100)" type="text"/>
                <button onclick="quizManager.checkShortAnswer('${question.id}', '${question.correct}')">✅ Kiểm tra</button>
                <span id="icon-${question.id}"></span>
            </div>
            <div id="result-${question.id}"></div>
        `;
    }

    renderAnswerCheck(question) {
        if (question.type === 'short_answer') return '';
        
        return `
            <button onclick="quizManager.checkAnswer('${question.id}', '${question.correct}')">✅ Kiểm tra</button>
            <span id="result-${question.id}"></span>
        `;
    }

    renderSolution(question) {
        return `
            <button onclick="quizManager.toggleSolution('${question.id}')" class="solution-toggle">
                👁️ Xem giải
            </button>
            <div id="solution-${question.id}" class="solution-box" style="display: none;">
                <div class="solution-title">Hướng dẫn giải</div>
                <div class="solution-content">${question.solution}</div>
            </div>
        `;
    }

    attachEventListeners() {
        // Event listeners are attached via onclick handlers
    }

    checkAnswer(questionId, correctAnswer) {
        const container = document.getElementById(questionId);
        if (!container) return;

        container.querySelectorAll('.option-icon').forEach(el => el.textContent = '');

        const selected = container.querySelector(`input[name="${questionId}"]:checked`);
        if (!selected) {
            window.showNotification("Hãy chọn một đáp án!", 'warning');
            window.playSound('wrong');
            return;
        }

        const userAnswer = selected.value;
        const isCorrect = userAnswer === correctAnswer;

        this.displayAnswerResult(container, questionId, userAnswer, correctAnswer, isCorrect);
        this.saveAnswer(questionId, userAnswer, correctAnswer, isCorrect);
    }

    checkTrueFalseAnswer(questionId, correctAnswers) {
        const container = document.getElementById(questionId);
        if (!container) return;

        let allCorrect = true;
        let score = 0;
        const subQuestions = Array.isArray(correctAnswers) ? correctAnswers : correctAnswers.split(',');

        subQuestions.forEach((expected, index) => {
            const letter = String.fromCharCode(97 + index);
            const selected = container.querySelector(`input[name="${questionId}${letter}"]:checked`);
            const userAnswer = selected ? selected.value : '';
            const isSubCorrect = userAnswer === expected.trim();

            if (!isSubCorrect) allCorrect = false;
            if (isSubCorrect) score += 0.25;

            this.displaySubQuestionResult(container, questionId, letter, userAnswer, expected.trim());
        });

        this.displayTrueFalseResult(container, questionId, allCorrect, score);
        this.saveTrueFalseAnswer(questionId, subQuestions, score, allCorrect);
    }

    checkShortAnswer(questionId, correctAnswer) {
        const input = document.getElementById(`input-${questionId}`);
        const icon = document.getElementById(`icon-${questionId}`);
        if (!input) return;

        const userAnswer = input.value.trim();
        const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, '');
        const normalizedCorrect = correctAnswer.toString().trim().toLowerCase().replace(/\s+/g, '');
        const isCorrect = normalizedUser === normalizedCorrect;

        this.displayShortAnswerResult(questionId, userAnswer, correctAnswer, isCorrect);
        this.saveAnswer(questionId, userAnswer, correctAnswer, isCorrect);
    }

    displayAnswerResult(container, questionId, userAnswer, correctAnswer, isCorrect) {
        const resultArea = container.querySelector(".answer-check");
        
        container.querySelectorAll('.option-row').forEach(row => {
            const radio = row.querySelector('input[type="radio"]');
            const value = radio.value;
            const icon = row.querySelector('.option-icon');
            
            radio.disabled = true;
            
            if (value === correctAnswer) {
                row.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                row.style.borderColor = '#28a745';
                if (icon) icon.textContent = '✅';
            } else if (value === userAnswer && !isCorrect) {
                row.style.background = 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
                row.style.borderColor = '#dc3545';
                if (icon) icon.textContent = '❌';
            }
        });

        this.showFeedback(resultArea, isCorrect, userAnswer, correctAnswer);
        window.playSound(isCorrect ? 'correct' : 'wrong');
    }

    showFeedback(container, isCorrect, userAnswer, correctAnswer) {
        let feedback = container.querySelector(".result");
        if (!feedback) {
            feedback = document.createElement("div");
            feedback.className = "result";
            container.appendChild(feedback);
        }

        if (isCorrect) {
            feedback.innerHTML = `
                <div style="color: #28a745; font-weight: bold;">
                    ✅ <b>Chính xác!</b>
                </div>
                <div>Đáp án của bạn: <b>${userAnswer}</b></div>
            `;
            window.showNotification(`✅ Câu hỏi: Chính xác!`, 'success');
        } else {
            feedback.innerHTML = `
                <div style="color: #dc3545; font-weight: bold;">
                    ❌ <b>Sai rồi.</b>
                </div>
                <div>Bạn chọn: <b>${userAnswer}</b></div>
                <div>Đáp án đúng: <b style="color: #28a745">${correctAnswer}</b></div>
            `;
            window.showNotification(`❌ Câu hỏi: Chưa chính xác`, 'error');
        }
    }

    displaySubQuestionResult(container, questionId, letter, userAnswer, expected) {
        const isCorrect = userAnswer === expected;
        const icon = container.querySelector(`#icon-${questionId}${letter}`);
        if (icon) {
            icon.textContent = isCorrect ? '✅' : '❌';
        }
    }

    displayTrueFalseResult(container, questionId, allCorrect, score) {
        let resultBox = container.querySelector(".answer-check .result");
        if (!resultBox) {
            resultBox = document.createElement('div');
            resultBox.className = 'result';
            resultBox.style.marginTop = '8px';
            resultBox.style.padding = '12px';
            resultBox.style.background = 'rgba(255,255,255,0.9)';
            resultBox.style.borderRadius = '8px';
            resultBox.style.border = '1px solid #e0e0e0';
            container.querySelector(".answer-check").appendChild(resultBox);
        }
        
        resultBox.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">📊 Kết quả kiểm tra:</div>
            <div>Điểm: ${score}/1.00</div>
            <div style="margin-top: 8px; font-weight: bold; color: ${allCorrect ? '#28a745' : '#ffc107'}">
                ${allCorrect ? '🎉 Hoàn toàn chính xác!' : '⚠️ Cần kiểm tra lại'}
            </div>
        `;

        container.querySelectorAll("input[type='radio']").forEach(r => r.disabled = true);
    }

    displayShortAnswerResult(questionId, userAnswer, correctAnswer, isCorrect) {
        const input = document.getElementById(`input-${questionId}`);
        const icon = document.getElementById(`icon-${questionId}`);
        const resultBox = document.getElementById(`result-${questionId}`);

        if (!resultBox) return;

        if (isCorrect) {
            icon.textContent = "✅";
            resultBox.innerHTML = `
                <div style="color: #28a745; font-weight: bold; margin-top: 10px;">
                    🎯 <b>Đúng rồi!</b>
                </div>
                <div>Đáp án của bạn: <b>${userAnswer}</b></div>
            `;
            input.style.borderColor = '#28a745';
            input.style.background = '#d4edda';
            input.disabled = true;
            window.playSound('correct');
            window.showNotification(`✅ Câu ${questionId}: Chính xác!`, 'success');
        } else {
            icon.textContent = "❌";
            resultBox.innerHTML = `
                <div style="color: #dc3545; font-weight: bold; margin-top: 10px;">
                    ❌ <b>Sai rồi.</b>
                </div>
                <div>Đáp án của bạn: <b>${userAnswer}</b></div>
                <div>Đáp án đúng: <b style="color: #28a745">${correctAnswer}</b></div>
            `;
            input.style.borderColor = '#dc3545';
            input.style.background = '#f8d7da';
            input.disabled = true;
            window.playSound('wrong');
            window.showNotification(`❌ Câu ${questionId}: Chưa chính xác`, 'error');
        }
    }

    async saveAnswer(questionId, userAnswer, correctAnswer, isCorrect) {
        this.studentAnswers[questionId] = {
            userAnswer,
            correctAnswer,
            isCorrect,
            timestamp: new Date().getTime()
        };

        if (window.currentUser && window.sessionCode && window.firebaseService) {
            try {
                await window.firebaseService.savePartialResult(
                    window.sessionCode,
                    window.currentUser.uid,
                    questionId,
                    { userAnswer, correctAnswer, isCorrect }
                );
            } catch (error) {
                console.error('Error saving answer:', error);
            }
        }
    }

    saveTrueFalseAnswer(questionId, subQuestions, score, allCorrect) {
        const answers = subQuestions.map((expected, index) => {
            const letter = String.fromCharCode(97 + index);
            const selected = document.querySelector(`input[name="${questionId}${letter}"]:checked`);
            return selected ? selected.value : '';
        });

        this.studentAnswers[questionId] = {
            answers,
            score,
            allCorrect,
            timestamp: new Date().getTime()
        };
    }

    toggleSolution(questionId) {
        const solution = document.getElementById(`solution-${questionId}`);
        if (solution) {
            solution.style.display = solution.style.display === 'none' ? 'block' : 'none';
        }
    }

    calculateTotalScore() {
        let totalScore = 0;
        const totalQuestions = this.questions.length;

        this.questions.forEach(question => {
            const answer = this.studentAnswers[question.id];
            if (answer && answer.isCorrect) {
                if (question.type === 'multiple_choice') {
                    totalScore += 0.25;
                } else if (question.type === 'true_false') {
                    totalScore += answer.score || 0;
                } else if (question.type === 'short_answer') {
                    totalScore += 0.5;
                }
            }
        });

        return {
            score: totalScore,
            maxScore: this.calculateMaxScore(),
            percentage: (totalScore / this.calculateMaxScore()) * 100
        };
    }

    calculateMaxScore() {
        return this.questions.reduce((max, question) => {
            if (question.type === 'multiple_choice') return max + 0.25;
            if (question.type === 'true_false') return max + 1;
            if (question.type === 'short_answer') return max + 0.5;
            return max;
        }, 0);
    }
};

// Tạo global instance
window.quizManager = new QuizManager();

// Export methods for global access
window.checkAnswer = (qid, correct) => window.quizManager.checkAnswer(qid, correct);
window.checkTrueFalseAnswer = (qid, correct) => window.quizManager.checkTrueFalseAnswer(qid, correct);
window.checkShortAnswer = (qid, correct) => window.quizManager.checkShortAnswer(qid, correct);
window.toggleSolution = (qid) => window.quizManager.toggleSolution(qid);