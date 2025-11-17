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
    const response = await fetch(`http://localhost:8080/${tipoUsuario}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "email": email, "password": senha })
    });

    if (!response.ok) throw new Error("Login inválido");

    const data = await response.json();

    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("userType", tipoUsuario);

    if (tipoUsuario === "passenger") {
      location.href = "/passenger/account";
    } else {
      location.href = "/driver/account";
    }

  } catch (err) {
    alert("Credenciais inválidas!");
  }
});
