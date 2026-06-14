const canvas = document.getElementById('creatureCanvas');
const ctx = canvas.getContext('2d');
const visualPanel = document.querySelector('.visual-panel');
const loginForm = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const statusText = document.getElementById('status');
const roleButtons = Array.from(document.querySelectorAll('.role-btn'));

const pointer = {
  x: 0,
  y: 0,
  active: false,
};

const creature = {
  parts: [],
  total: 42,
  gap: 14,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createCreature(width, height) {
  creature.parts = [];
  const startX = width * 0.68;
  const startY = height * 0.45;

  for (let i = 0; i < creature.total; i += 1) {
    creature.parts.push({
      x: startX - i * creature.gap,
      y: startY + Math.sin(i * 0.42) * 14,
      angle: -0.12,
    });
  }
}

function resizeCanvas() {
  const rect = visualPanel.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createCreature(rect.width, rect.height);
  pointer.x = rect.width * 0.44;
  pointer.y = rect.height * 0.46;
}

function updatePointer(clientX, clientY) {
  const rect = visualPanel.getBoundingClientRect();
  pointer.x = clamp(clientX - rect.left, 24, rect.width - 24);
  pointer.y = clamp(clientY - rect.top, 24, rect.height - 24);
  pointer.active = true;

  visualPanel.style.setProperty('--mx', `${(pointer.x / rect.width) * 100}%`);
  visualPanel.style.setProperty('--my', `${(pointer.y / rect.height) * 100}%`);
}

function clearTextSelection() {
  const selection = window.getSelection?.();
  if (selection && selection.type === 'Range') {
    selection.removeAllRanges();
  }
}

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
}

// Pointer global: hewan tetap ikut walau cursor berada di atas card login.
window.addEventListener('pointermove', (event) => {
  updatePointer(event.clientX, event.clientY);
  if (!isTypingTarget(event.target)) clearTextSelection();
}, { passive: true });

window.addEventListener('pointerdown', (event) => {
  updatePointer(event.clientX, event.clientY);
  if (!isTypingTarget(event.target)) clearTextSelection();
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  const touch = event.touches?.[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
  if (!isTypingTarget(event.target)) clearTextSelection();
}, { passive: true });

document.addEventListener('selectstart', (event) => {
  if (!isTypingTarget(event.target)) {
    event.preventDefault();
  }
});

document.addEventListener('dragstart', (event) => {
  if (!isTypingTarget(event.target)) {
    event.preventDefault();
  }
});

window.addEventListener('resize', resizeCanvas);

function drawGlow(x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpark(x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.shadowBlur = 14;
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
  const rect = visualPanel.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (!creature.parts.length || width <= 0 || height <= 0) return;

  const head = creature.parts[0];

  if (!pointer.active) {
    pointer.x = width * 0.52 + Math.cos(time * 0.0007) * width * 0.28;
    pointer.y = height * 0.40 + Math.sin(time * 0.0011) * height * 0.20;
  }

  ctx.clearRect(0, 0, width, height);

  drawGlow(pointer.x, pointer.y, 155, 'rgba(109, 255, 134, 0.15)');
  drawGlow(width * 0.82, height * 0.22, 180, 'rgba(255, 78, 219, 0.09)');
  drawGlow(width * 0.24, height * 0.72, 165, 'rgba(53, 236, 255, 0.10)');

  const dx = pointer.x - head.x;
  const dy = pointer.y - head.y;
  const targetAngle = Math.atan2(dy, dx);
  const distance = Math.hypot(dx, dy);
  const speed = clamp(distance * 0.045, 1.5, 7.2);
  const angleDiff = Math.atan2(Math.sin(targetAngle - head.angle), Math.cos(targetAngle - head.angle));

  head.angle += angleDiff * 0.17;
  head.x += Math.cos(head.angle) * speed;
  head.y += Math.sin(head.angle) * speed;
  head.x = clamp(head.x, 28, width - 28);
  head.y = clamp(head.y, 28, height - 28);

  for (let i = 1; i < creature.parts.length; i += 1) {
    const prev = creature.parts[i - 1];
    const curr = creature.parts[i];
    const baseAngle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
    const wave = Math.sin(time * 0.004 + i * 0.38) * 0.09;
    curr.angle = baseAngle + wave;
    curr.x = prev.x - Math.cos(curr.angle) * creature.gap;
    curr.y = prev.y - Math.sin(curr.angle) * creature.gap;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Spine utama.
  for (let i = creature.parts.length - 1; i > 0; i -= 1) {
    const p = creature.parts[i];
    const prev = creature.parts[i - 1];
    const t = i / creature.parts.length;
    const hue = 116 + t * 210;

    ctx.strokeStyle = `hsla(${hue}, 100%, 62%, ${0.88 - t * 0.18})`;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `hsla(${hue}, 100%, 62%, 0.9)`;
    ctx.lineWidth = 3.4 - t * 1.4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(prev.x, prev.y);
    ctx.stroke();
  }

  // Ruas, kaki, kepala.
  for (let i = creature.parts.length - 1; i >= 0; i -= 1) {
    const p = creature.parts[i];
    const t = i / creature.parts.length;
    const hue = 116 + t * 210;
    const alpha = 0.96 - t * 0.22;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.shadowBlur = i === 0 ? 30 : 18;
    ctx.shadowColor = `hsla(${hue}, 100%, 62%, ${alpha})`;

    if (i === 0) {
      ctx.fillStyle = 'rgba(114, 255, 89, 0.98)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 23, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 13, 8, 0.95)';
      ctx.beginPath();
      ctx.ellipse(7, -5, 3.4, 2.7, 0.25, 0, Math.PI * 2);
      ctx.ellipse(7, 5, 3.0, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(240, 255, 231, 0.95)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(15, -4);
      ctx.lineTo(30, -11);
      ctx.moveTo(15, 4);
      ctx.lineTo(30, 11);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `hsla(${hue}, 100%, 64%, ${alpha})`;
      ctx.lineWidth = 2.15;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.stroke();

      if (i > 4 && i < creature.parts.length - 8 && i % 4 === 0) {
        ctx.lineWidth = 1.65;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-18, -13);
        ctx.lineTo(-23, -6);
        ctx.moveTo(3, 0);
        ctx.lineTo(18, 13);
        ctx.lineTo(23, 6);
        ctx.stroke();
      }

      const radius = Math.max(2.6, 8 - t * 4.6);
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawSpark(width * 0.78 + Math.sin(time * 0.002) * 10, height * 0.24, 7, 'rgba(255, 78, 219, 0.86)');
  drawSpark(width * 0.58, height * 0.62 + Math.cos(time * 0.0022) * 9, 6, 'rgba(247, 255, 92, 0.82)');
  drawSpark(width * 0.87, height * 0.55, 5, 'rgba(53, 236, 255, 0.82)');

  ctx.restore();
}

function animate(time) {
  drawCreature(time);
  requestAnimationFrame(animate);
}

function setDemoRole(button) {
  roleButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  username.value = button.dataset.user || '';
  password.value = button.dataset.pass || '';
  statusText.textContent = '';
  statusText.className = 'status';
}

roleButtons.forEach((button) => {
  button.addEventListener('click', () => setDemoRole(button));
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  statusText.className = 'status';

  if (!username.value.trim() || !password.value.trim()) {
    statusText.textContent = 'Username dan password wajib diisi.';
    statusText.classList.add('error');
    return;
  }

  const role = username.value.trim().toLowerCase();
  const validRoles = ['owner', 'admin', 'kasir'];

  if (!validRoles.includes(role)) {
    statusText.textContent = 'Demo: gunakan owner, admin, atau kasir.';
    statusText.classList.add('error');
    return;
  }

  statusText.textContent = `Login demo berhasil sebagai ${role}.`;
  statusText.classList.add('success');
});

resizeCanvas();
setDemoRole(roleButtons[0]);
requestAnimationFrame(animate);
