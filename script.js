const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const message = document.getElementById('message');
const canvas = document.getElementById('creatureCanvas');
const ctx = canvas.getContext('2d');
const scene = document.querySelector('.login-scene');

const pointer = { x: 0, y: 0, active: false };
const creature = { segments: [], count: 34, gap: 14, speed: 0.045 };

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function resizeCanvas() {
  const rect = scene.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!creature.segments.length) {
    const startX = rect.width * 0.66;
    const startY = rect.height * 0.42;
    for (let i = 0; i < creature.count; i += 1) {
      creature.segments.push({
        x: startX - i * creature.gap,
        y: startY + Math.sin(i * 0.5) * 8,
        angle: 0,
      });
    }
    pointer.x = startX;
    pointer.y = startY;
  }
}

function updatePointer(clientX, clientY) {
  const rect = scene.getBoundingClientRect();
  pointer.x = clamp(clientX - rect.left, 36, rect.width - 36);
  pointer.y = clamp(clientY - rect.top, 36, rect.height - 36);
  pointer.active = true;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (event) => updatePointer(event.clientX, event.clientY));
window.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
}, { passive: true });

function drawRadialGlow(x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCreature(time) {
  const rect = scene.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const head = creature.segments[0];

  if (!pointer.active) {
    pointer.x = width * 0.5 + Math.cos(time * 0.00055) * width * 0.27;
    pointer.y = height * 0.43 + Math.sin(time * 0.0008) * height * 0.18;
  }

  const dx = pointer.x - head.x;
  const dy = pointer.y - head.y;
  const angle = Math.atan2(dy, dx);
  const distance = Math.hypot(dx, dy);
  const speed = clamp(distance * creature.speed, 1.2, 8);

  head.angle += Math.atan2(Math.sin(angle - head.angle), Math.cos(angle - head.angle)) * 0.16;
  head.x += Math.cos(head.angle) * speed;
  head.y += Math.sin(head.angle) * speed;
  head.x = clamp(head.x, 28, width - 28);
  head.y = clamp(head.y, 28, height - 28);

  for (let i = 1; i < creature.segments.length; i += 1) {
    const prev = creature.segments[i - 1];
    const curr = creature.segments[i];
    const bend = Math.sin(time * 0.004 + i * 0.45) * 0.11;
    const ddx = prev.x - curr.x;
    const ddy = prev.y - curr.y;
    const currentAngle = Math.atan2(ddy, ddx) + bend;
    curr.angle = currentAngle;
    curr.x = prev.x - Math.cos(currentAngle) * creature.gap;
    curr.y = prev.y - Math.sin(currentAngle) * creature.gap;
  }

  ctx.clearRect(0, 0, width, height);
  drawRadialGlow(head.x, head.y, 150, 'rgba(109,255,117,0.13)');
  drawRadialGlow(pointer.x, pointer.y, 92, 'rgba(56,232,255,0.10)');

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = creature.segments.length - 1; i >= 0; i -= 1) {
    const p = creature.segments[i];
    const t = i / creature.segments.length;
    const hue = 112 + t * 210;
    const alpha = 0.94 - t * 0.22;
    const radius = i === 0 ? 17 : Math.max(3, 8 - t * 3.5);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.shadowBlur = i === 0 ? 26 : 16;
    ctx.shadowColor = `hsla(${hue},100%,62%,${alpha})`;

    if (i === 0) {
      ctx.fillStyle = 'rgba(112,255,104,0.98)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0,12,8,0.9)';
      ctx.beginPath();
      ctx.arc(6, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(6, 4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(220,255,220,0.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(13, -3);
      ctx.lineTo(24, -8);
      ctx.moveTo(13, 3);
      ctx.lineTo(24, 8);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `hsla(${hue},100%,63%,${alpha})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

      if (i > 3 && i < creature.segments.length - 5 && i % 3 === 0) {
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-13, -10);
        ctx.moveTo(2, 0);
        ctx.lineTo(13, 10);
        ctx.stroke();
      }

      ctx.fillStyle = `hsla(${hue},100%,60%,${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function animate(time) {
  drawCreature(time);
  requestAnimationFrame(animate);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  message.className = 'message';
  if (!username.value.trim() || !password.value.trim()) {
    message.textContent = 'Username dan password wajib diisi.';
    message.classList.add('error');
    return;
  }
  message.textContent = 'Login berhasil. Ini masih mode demo.';
  message.classList.add('success');
});

resizeCanvas();
requestAnimationFrame(animate);
