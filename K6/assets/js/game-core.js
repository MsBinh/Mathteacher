let currentSlide = 1;
const totalSlides = document.querySelectorAll(".slide").length;

function showSlide(n) {
  document.querySelectorAll(".slide").forEach(slide => slide.classList.remove("active"));
  document.getElementById(`slide${n}`).classList.add("active");
  document.getElementById("slideCounter").textContent = `${n} / ${totalSlides}`;
}

function nextSlide() {
  currentSlide = currentSlide < totalSlides ? currentSlide + 1 : totalSlides;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide = currentSlide > 1 ? currentSlide - 1 : 1;
  showSlide(currentSlide);
}

function goToSlide(n) {
  currentSlide = n;
  showSlide(n);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

document.getElementById("nextSlide").onclick = nextSlide;
document.getElementById("prevSlide").onclick = prevSlide;
document.getElementById("toggleFullscreen").onclick = toggleFullscreen;

showSlide(currentSlide);

// Quiz functions
function checkAnswer(button, isCorrect, quizId) {
  const feedback = document.getElementById(`feedback_${quizId}`);
  if (isCorrect) {
    feedback.textContent = "🎉 Chính xác!";
    feedback.className = "feedback correct";
    playCorrectSound();
  } else {
    feedback.textContent = "😅 Chưa đúng, thử lại nhé!";
    feedback.className = "feedback wrong";
    playWrongSound();
  }
}

function completeQuiz(...ids) {
  const done = ids.every(id => document.getElementById(`feedback_${id}`).classList.contains("correct"));
  const msg = document.getElementById("completion_quiz1");
  if (done) {
    msg.textContent = "🌟 Hoàn thành xuất sắc! Giỏi lắm!";
    playApplause();
  } else {
    msg.textContent = "Hãy thử làm lại để đạt kết quả tốt hơn nhé!";
  }
}

function toggleSolution(button) {
  const sol = button.nextElementSibling;
  sol.classList.toggle("hidden");
}
