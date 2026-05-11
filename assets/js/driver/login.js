document.addEventListener("DOMContentLoaded", () => {
  void initializeDriverLogin();
});

async function initializeDriverLogin() {
  const auth = window.SumusAuth;
  const role = "driver";
  const container = document.getElementById("container");
  const registerBtn = document.getElementById("register");
  const loginBtn = document.getElementById("login");
  const topbarLoginBtn = document.querySelector(".topbar__login");
  const topbarSignupBtn = document.querySelector(".topbar__signup");
  const msgError = document.getElementById("msgError");
  const msgSuccess = document.getElementById("msgSuccess");
  const initialMode = new URLSearchParams(window.location.search).get("mode");

  function showMessage(element, message) {
    element.textContent = message;
    element.style.display = "block";
    window.setTimeout(() => {
      element.style.display = "none";
    }, 4000);
  }

  function setMode(mode, options = {}) {
    const isSignup = mode === "signup";

    container.classList.toggle("active", isSignup);
    topbarLoginBtn?.classList.toggle("topbar__link--active", !isSignup);
    topbarSignupBtn?.classList.toggle("topbar__link--active", isSignup);

    if (options.syncUrl === false) {
      return;
    }

    const nextUrl = isSignup
      ? `${window.location.pathname}?mode=signup`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }

  if (!auth) {
    return;
  }

  const activeSession = await auth.getSessionForRole(role);

  if (activeSession) {
    window.location.href = auth.getDashboardRoute(role);
    return;
  }

  setMode(initialMode === "signup" ? "signup" : "login", { syncUrl: false });

  registerBtn.addEventListener("click", () => {
    setMode("signup");
  });

  loginBtn.addEventListener("click", () => {
    setMode("login");
  });

  async function login(event) {
    event.preventDefault();

    try {
      await auth.login({
        email: document.querySelector("#loginInput")?.value,
        password: document.querySelector("#passwordInput")?.value,
        role,
      });

      window.location.href = auth.getDashboardRoute(role);
    } catch (error) {
      showMessage(msgError, error.message);
    }
  }

  async function register(event) {
    event.preventDefault();

    const result = await auth.registerUser({
      login: document.querySelector("#newLogin")?.value,
      email: document.querySelector("#newEmail")?.value,
      password: document.querySelector("#newPassword")?.value,
      role,
    });

    if (!result.ok) {
      showMessage(msgError, result.message);
      return;
    }

    setMode("login");
    showMessage(msgSuccess, "Conta criada com sucesso! Faca login.");
    document.getElementById("registerForm")?.reset();
  }

  document.getElementById("loginForm")?.addEventListener("submit", (event) => {
    void login(event);
  });
  document.getElementById("registerForm")?.addEventListener("submit", (event) => {
    void register(event);
  });
}
