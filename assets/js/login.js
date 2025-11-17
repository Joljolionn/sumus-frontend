const btnLogin = document.querySelector(".btn-entrar");

btnLogin.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  const tipoUsuario = document.querySelector("input[name='tipo-usuario']:checked").value;

  if (!email || !senha) {
    alert("Preencha email e senha!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/auth/login/${tipoUsuario}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) throw new Error("Login inválido");

    const data = await response.json();

    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("tipoUsuario", tipoUsuario);

    if (tipoUsuario === "passageiro") {
      location.href = "../Pages/passenger-account.html";
    } else {
      location.href = "../Pages/motorista-account.html";
    }

  } catch (err) {
    alert("Credenciais inválidas!");
  }
});
