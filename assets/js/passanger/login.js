document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SumusAuth;
    const role = "passenger";
    const container = document.getElementById("container");
    const registerBtn = document.getElementById("register");
    const loginBtn = document.getElementById("login");
    const topbarLoginBtn = document.querySelector(".topbar__login");
    const topbarSignupBtn = document.querySelector(".topbar__signup");
    const msgError = document.getElementById("msgError");
    const msgSuccess = document.getElementById("msgSuccess");
    const activeSession = auth?.getSessionForRole(role);
    const initialMode = new URLSearchParams(window.location.search).get("mode");

    function showMessage(element, message) {
        element.textContent = message;
        element.style.display = "block";
        setTimeout(() => {
            element.style.display = "none";
        }, 4000);
    }

    function setMode(mode, { syncUrl = true } = {}) {
        const isSignup = mode === "signup";

        container.classList.toggle("active", isSignup);
        topbarLoginBtn?.classList.toggle("topbar__link--active", !isSignup);
        topbarSignupBtn?.classList.toggle("topbar__link--active", isSignup);

        if (!syncUrl) {
            return;
        }

        const nextUrl = isSignup ? `${window.location.pathname}?mode=signup` : window.location.pathname;
        window.history.replaceState({}, "", nextUrl);
    }

    if (!auth) {
        return;
    }

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

    function login(event) {
        event.preventDefault();

        const emailInput = document.querySelector("#loginInput").value;
        const passwordInput = document.querySelector("#passwordInput").value;
        const userFound = auth.findUserByCredentials(emailInput, passwordInput, role);

        if (!userFound) {
            showMessage(msgError, "E-mail ou senha incorretos.");
            return;
        }

        auth.setSession(userFound, role);
        window.location.href = auth.getDashboardRoute(role);
    }

    function register(event) {
        event.preventDefault();

        const result = auth.registerUser({
            login: document.querySelector("#newLogin").value,
            email: document.querySelector("#newEmail").value,
            password: document.querySelector("#newPassword").value,
            role,
        });

        if (!result.ok) {
            showMessage(msgError, result.message);
            return;
        }

        setMode("login");
        showMessage(msgSuccess, "Conta criada com sucesso! Faça login.");
        document.getElementById("registerForm").reset();
    }

    document.getElementById("loginForm").addEventListener("submit", login);
    document.getElementById("registerForm").addEventListener("submit", register);
});
