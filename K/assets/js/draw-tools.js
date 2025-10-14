document.querySelectorAll("canvas.drawing-canvas").forEach(canvas => {
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let color = "#ff0000";
  let size = 3;

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchend", end);
  canvas.addEventListener("touchmove", draw);

  function start(e) {
    drawing = true;
    draw(e);
  }

  function end() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  document.getElementById("colorPicker7").onchange = e => color = e.target.value;
  document.getElementById("brushSize7").oninput = e => size = e.target.value;
});

function clearCanvas(id) {
  const c = document.getElementById(id);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
}
