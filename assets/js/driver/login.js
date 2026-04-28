document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SumusAuth;
    const role = "driver";
    const container = document.getElementById("container");
    const registerBtn = document.getElementById("register");
    const loginBtn = document.getElementById("login");
    const msgError = document.getElementById("msgError");
    const msgSuccess = document.getElementById("msgSuccess");
    const activeSession = auth?.getSessionForRole(role);

    function showMessage(element, message) {
        element.textContent = message;
        element.style.display = "block";
        setTimeout(() => {
            element.style.display = "none";
        }, 4000);
    }

    if (!auth) {
        return;
    }

    if (activeSession) {
        window.location.href = auth.getDashboardRoute(role);
        return;
    }

    registerBtn.addEventListener("click", () => {
        container.classList.add("active");
    });

    loginBtn.addEventListener("click", () => {
        container.classList.remove("active");
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

        container.classList.remove("active");
        showMessage(msgSuccess, "Conta criada com sucesso! Faça login.");
        document.getElementById("registerForm").reset();
    }

    document.getElementById("loginForm").addEventListener("submit", login);
    document.getElementById("registerForm").addEventListener("submit", register);
});
