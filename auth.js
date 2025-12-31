// LocalStorage key
const USER_KEY = "auth_user";

// random captcha
function generateCaptcha() {
  const code = Math.floor(1000 + Math.random() * 9000);
  document.getElementById("captchaCode").textContent = code;
  return code;
}

// If on login page, generate captcha
if (document.getElementById("captchaCode")) {
  generateCaptcha();
}

// ---------------- REGISTER ----------------
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value.trim();

    if (!username || !password) {
      alert("Semua kolom wajib diisi!");
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify({ username, password }));
    alert("Registrasi berhasil! Silakan login.");

    window.location.href = "login.html";
  });
}

// ---------------- LOGIN ----------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const saved = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();
    const captchaInput = document.getElementById("captchaInput").value.trim();
    const captchaCode = document.getElementById("captchaCode").textContent;

    if (captchaInput !== captchaCode) {
      alert("Kode keamanan salah!");
      generateCaptcha();
      return;
    }

    if (username === saved.username && password === saved.password) {
      sessionStorage.setItem("logged_in", "true");
      sessionStorage.setItem("username", username);
      window.location.href = "index.html";
    } else {
      alert("Username atau password salah!");
    }
  });
}