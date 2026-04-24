document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('container');
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');

    registerBtn.addEventListener('click', () => {
        container.classList.add("active");
    });

    loginBtn.addEventListener('click', () => {
        container.classList.remove("active");
    });

    function dados() {
        const ds = [
            { id: 0, login: "Silvia", password: "69", email: "silviaCach@sumus.com" }
        ];
        const storedUsers = localStorage.getItem("usuarios");
        return storedUsers ? JSON.parse(storedUsers) : ds;
    }

    function login(event) {
        event.preventDefault();

        let emailInput = document.querySelector("#loginInput").value;
        let passwordInput = document.querySelector("#passwordInput").value;
        const usuarios = dados();

        const userFound = usuarios.find(u => u.email === emailInput && u.password === passwordInput);

        if (userFound) {
            localStorage.setItem("loggedUser", JSON.stringify(userFound));
            window.location.href = `home-passageiro.html`;
        } else {
            const msgError = document.getElementById('msgError');
            msgError.textContent = "E-mail ou senha incorretos.";
            msgError.style.display = "block";
            setTimeout(() => msgError.style.display = "none", 3000);
        }
    }

    function register(event) {
        event.preventDefault();

        let newLogin = document.querySelector("#newLogin").value;
        let newEmail = document.querySelector("#newEmail").value;
        let newPassword = document.querySelector("#newPassword").value;

        let usuarios = dados();
        
        if (usuarios.some(u => u.email === newEmail)) {
            const msgError = document.getElementById('msgError');
            msgError.textContent = "Este e-mail ou senha já está cadastrado!";
            msgError.style.display = "block";
            setTimeout(() => msgError.style.display = "none", 3000);
            return;
        }

        let newUser = {
            id: usuarios.length,
            login: newLogin,
            email: newEmail,
            password: newPassword
        };

        usuarios.push(newUser);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        container.classList.remove("active");
        
        const msgSuccess = document.getElementById('msgSuccess');
        msgSuccess.textContent = "Conta criada com sucesso! Faça login.";
        msgSuccess.style.display = "block";
        setTimeout(() => msgSuccess.style.display = "none", 4000);
    }

    document.getElementById("loginForm").addEventListener("submit", login);
    document.getElementById("registerForm").addEventListener("submit", register);
});