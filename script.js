const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");

// 适配手机分辨率
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 画圣诞树
function drawChristmasTree(cx, cy, scale, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = "darkgreen";

  for (let i = 0; i < 3; i++) {
    const size = (60 - i * 15) * scale;
    const offset = i * 20 * scale;

    ctx.beginPath();
    ctx.moveTo(0, -size - offset);
    ctx.lineTo(-size, size - offset);
    ctx.lineTo(size, size - offset);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.image) return;

  // 镜像画面
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  if (!results.multiHandLandmarks) return;

  const lm = results.multiHandLandmarks[0];

  // 缩放
  const dx = lm[4].x - lm[8].x;
  const dy = lm[4].y - lm[8].y;
  const scale = Math.min(Math.max(Math.sqrt(dx*dx + dy*dy) * 5, 0.5), 3);

  // 旋转
  const angle =
    Math.atan2(lm[12].y - lm[0].y, lm[12].x - lm[0].x) + Math.PI / 2;

  // 四指张开
  const isOpen =
    lm[8].y < lm[6].y &&
    lm[12].y < lm[10].y &&
    lm[16].y < lm[14].y;

  const cx = lm[9].x * canvas.width;
  const cy = lm[9].y * canvas.height;

  drawChristmasTree(cx, cy, scale, angle);

  if (isOpen) {
    ctx.fillStyle = "red";
    ctx.fillRect(
      canvas.width / 2 - 60,
      canvas.height / 2 - 60,
      120,
      120
    );

    ctx.fillStyle = "yellow";
    ctx.font = "26px Arial";
    ctx.fillText("圣诞快乐！", canvas.width / 2 - 70, canvas.height / 2 + 120);
  }
});

// ⚠️ 关键：必须由用户点击启动摄像头
startBtn.onclick = async () => {
  startBtn.style.display = "none";

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: window.innerWidth,
    height: window.innerHeight,
  });

  camera.start();
};
