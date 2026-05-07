document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container");

    // Função auxiliar para buscar dados locais (evita erro de undefined)
    const dados = () => JSON.parse(localStorage.getItem("usuarios")) || [];

    async function login(event) {
        event.preventDefault();

        const emailInput = document.getElementById("email").value;
        const passwordInput = document.getElementById("password").value;
        const msgError = document.getElementById("msgError");

        try {
            const authResponse = await fetch("/passenger/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput,
                    password: passwordInput,
                }),
            }).catch((err) => {
                throw err;
            });

            if (authResponse.ok) {
                const authToken = await authResponse.json();
                sessionStorage.setItem("passengerToken", authToken.token);
                window.location.href = `/passenger`;
            } else {
                showMsg(msgError, "E-mail ou senha incorretos.", "red");
            }
        } catch (error) {
            showMsg(msgError, "Erro ao conectar com o servidor.", "red");
        }
    }

    function register(event) {
        event.preventDefault();

        const newLogin = document.querySelector("#newLogin").value;
        const newEmail = document.querySelector("#newEmail").value;
        const newPassword = document.querySelector("#newPassword").value;
        const msgError = document.getElementById("msgError");
        const msgSuccess = document.getElementById("msgSuccess");

        let usuarios = dados();

        if (usuarios.some((u) => u.email === newEmail)) {
            showMsg(msgError, "Este e-mail já está cadastrado!", "red");
            return;
        }

        const newUser = {
            id: Date.now(), // ID mais confiável que length
            login: newLogin,
            email: newEmail,
            password: newPassword,
        };

        usuarios.push(newUser);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        // Feedback visual
        if (container) container.classList.remove("active");
        showMsg(msgSuccess, "Conta criada com sucesso! Faça login.", "green");

        // Limpa o formulário de registro
        event.target.reset();
    }

    // Função utilitária para mensagens (DRY - Don't Repeat Yourself)
    function showMsg(element, text, color) {
        if (!element) return;
        element.textContent = text;
        element.style.display = "block";
        element.style.color = color;
        setTimeout(() => (element.style.display = "none"), 3000);
    }

    // Listeners
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) loginForm.addEventListener("submit", login);
    if (registerForm) registerForm.addEventListener("submit", register);
});
