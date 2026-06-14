const canvas = document.getElementById('creatureCanvas');
const ctx = canvas.getContext('2d');
const creatureWindow = document.querySelector('.creature-window');
const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const statusText = document.getElementById('status');

const pointer = {
  x: 0,
  y: 0,
  active: false,
};

const creature = {
  parts: [],
  total: 40,
  gap: 13,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resizeCanvas() {
  const rect = creatureWindow.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const startX = rect.width * 0.72;
  const startY = rect.height * 0.52;

  creature.parts = [];
  for (let i = 0; i < creature.total; i += 1) {
    creature.parts.push({
      x: startX - i * creature.gap,
      y: startY + Math.sin(i * 0.5) * 12,
      angle: -0.2,
    });
  }

  pointer.x = rect.width * 0.36;
  pointer.y = rect.height * 0.50;
}

function updatePointer(clientX, clientY) {
  const rect = creatureWindow.getBoundingClientRect();
  pointer.x = clamp(clientX - rect.left, 26, rect.width - 26);
  pointer.y = clamp(clientY - rect.top, 26, rect.height - 26);
  pointer.active = true;

  creatureWindow.style.setProperty('--mx', `${(pointer.x / rect.width) * 100}%`);
  creatureWindow.style.setProperty('--my', `${(pointer.y / rect.height) * 100}%`);
}

window.addEventListener('resize', resizeCanvas);

creatureWindow.addEventListener('mousemove', (event) => {
  updatePointer(event.clientX, event.clientY);
});

creatureWindow.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
}, { passive: true });

creatureWindow.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
}, { passive: true });

function drawGlow(x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawCreature(time) {
  const rect = creatureWindow.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const head = creature.parts[0];

  if (!pointer.active) {
    pointer.x = width * 0.50 + Math.cos(time * 0.0008) * width * 0.28;
    pointer.y = height * 0.48 + Math.sin(time * 0.0011) * height * 0.24;
  }

  ctx.clearRect(0, 0, width, height);

  drawGlow(pointer.x, pointer.y, 125, 'rgba(120, 255, 87, 0.16)');
  drawGlow(width * 0.82, height * 0.20, 140, 'rgba(255, 78, 219, 0.10)');
  drawGlow(width * 0.36, height * 0.58, 150, 'rgba(120, 255, 87, 0.10)');

  const dx = pointer.x - head.x;
  const dy = pointer.y - head.y;
  const targetAngle = Math.atan2(dy, dx);
  const distance = Math.hypot(dx, dy);
  const speed = clamp(distance * 0.055, 1.6, 7.8);

  head.angle += Math.atan2(Math.sin(targetAngle - head.angle), Math.cos(targetAngle - head.angle)) * 0.18;
  head.x += Math.cos(head.angle) * speed;
  head.y += Math.sin(head.angle) * speed;
  head.x = clamp(head.x, 22, width - 22);
  head.y = clamp(head.y, 22, height - 22);

  for (let i = 1; i < creature.parts.length; i += 1) {
    const prev = creature.parts[i - 1];
    const curr = creature.parts[i];
    const baseAngle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
    const wave = Math.sin(time * 0.004 + i * 0.45) * 0.10;
    curr.angle = baseAngle + wave;
    curr.x = prev.x - Math.cos(curr.angle) * creature.gap;
    curr.y = prev.y - Math.sin(curr.angle) * creature.gap;
  }

  // Garis tulang utama agar bentuk hewannya kelihatan jelas.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = creature.parts.length - 1; i > 0; i -= 1) {
    const p = creature.parts[i];
    const prev = creature.parts[i - 1];
    const t = i / creature.parts.length;
    const hue = 112 + t * 210;

    ctx.strokeStyle = `hsla(${hue}, 100%, 62%, ${0.86 - t * 0.16})`;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `hsla(${hue}, 100%, 62%, 0.92)`;
    ctx.lineWidth = 3.2 - t * 1.3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(prev.x, prev.y);
    ctx.stroke();
  }

  for (let i = creature.parts.length - 1; i >= 0; i -= 1) {
    const p = creature.parts[i];
    const t = i / creature.parts.length;
    const hue = 112 + t * 210;
    const alpha = 0.95 - t * 0.20;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.shadowBlur = i === 0 ? 28 : 18;
    ctx.shadowColor = `hsla(${hue}, 100%, 62%, ${alpha})`;

    if (i === 0) {
      // Kepala alien/gecko neon.
      ctx.fillStyle = 'rgba(118, 255, 82, 0.98)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 14, 9, 0.94)';
      ctx.beginPath();
      ctx.ellipse(7, -4, 3.1, 2.5, 0.25, 0, Math.PI * 2);
      ctx.ellipse(7, 5, 2.8, 2.3, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(238, 255, 230, 0.95)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(14, -3);
      ctx.lineTo(28, -9);
      ctx.moveTo(14, 4);
      ctx.lineTo(28, 10);
      ctx.stroke();
    } else {
      // Ruas/rangka warna-warni.
      ctx.strokeStyle = `hsla(${hue}, 100%, 64%, ${alpha})`;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.stroke();

      if (i > 4 && i < creature.parts.length - 6 && i % 4 === 0) {
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-16, -12);
        ctx.lineTo(-21, -5);
        ctx.moveTo(2, 0);
        ctx.lineTo(16, 12);
        ctx.lineTo(21, 5);
        ctx.stroke();
      }

      const radius = Math.max(2.7, 8 - t * 4.4);
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawStar(width * 0.80 + Math.sin(time * 0.002) * 10, height * 0.25, 7, 'rgba(255, 78, 219, 0.85)');
  drawStar(width * 0.62, height * 0.70 + Math.cos(time * 0.0022) * 8, 6, 'rgba(247, 255, 92, 0.85)');
  drawStar(width * 0.88, height * 0.68, 5, 'rgba(53, 236, 255, 0.78)');

  ctx.restore();
}

function animate(time) {
  drawCreature(time);
  requestAnimationFrame(animate);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  statusText.className = 'status';

  if (!username.value.trim() || !password.value.trim()) {
    statusText.textContent = 'Username dan password wajib diisi.';
    statusText.classList.add('error');
    return;
  }

  statusText.textContent = 'Login berhasil. Ini masih mode demo.';
  statusText.classList.add('success');
});

resizeCanvas();
requestAnimationFrame(animate);
