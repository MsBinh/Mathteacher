const bgMusic = document.getElementById("backgroundMusic");
let musicPlaying = false;

document.getElementById("toggleMusic").onclick = () => {
  if (musicPlaying) {
    bgMusic.pause();
    document.getElementById("toggleMusic").textContent = "Nhạc (Tắt)";
  } else {
    bgMusic.play();
    document.getElementById("toggleMusic").textContent = "Nhạc (Bật)";
  }
  musicPlaying = !musicPlaying;
};

function playCorrectSound() {
  new Audio("../assets/audio/correct.mp3").play();
}

function playWrongSound() {
  new Audio("../assets/audio/wrong.mp3").play();
}

function playApplause() {
  new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_d84ce463c7.mp3").play();
}
