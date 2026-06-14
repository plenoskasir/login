const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const message = document.getElementById('message');

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
