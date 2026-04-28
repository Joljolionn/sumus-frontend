// Espera o HTML carregar completamente antes de executar o script
document.addEventListener("DOMContentLoaded", () => {

  // Pega o objeto de autenticação global (provavelmente criado em outro arquivo)
  const auth = window.SumusAuth;

  // Se não existir o sistema de autenticação, para tudo
  if (!auth) {
    return;
  }

  // Descobre qual é o tipo de página (ex: admin, motorista, passageiro)
  const role = auth.getPageRole(window.location.pathname);

  // Busca o usuário logado com base no tipo de página
  let currentUser = auth.getSessionForRole(role);

  // Se não houver usuário logado, redireciona para login
  if (!currentUser) {
    window.location.href = auth.getLoginRoute(role);
    return;
  }

  // Função para alterar texto de vários elementos
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  }

  // Função para alterar o valor (inputs)
  function setValue(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.value = value;
    });
  }

  // Função para alterar imagens (src + alt)
  function setImages(selector, name, avatar) {
    document.querySelectorAll(selector).forEach((image) => {
      image.src = avatar;
      image.alt = name;
    });
  }

  // Mostra mensagem de feedback no formulário (erro ou sucesso)
  function showFeedback(form, message, isError) {
    let feedback = form.querySelector(".profile-form__feedback");

    // Se ainda não existir o elemento de feedback, cria um
    if (!feedback) {
      feedback = document.createElement("p");
      feedback.className = "profile-form__feedback";
      form.appendChild(feedback);
    }

    // Define o texto e estilo da mensagem
    feedback.textContent = message;
    feedback.style.marginTop = "1rem";
    feedback.style.fontSize = "0.95rem";
    feedback.style.color = isError ? "#c2410c" : "#166534"; // vermelho ou verde
  }

  // Aplica os dados do usuário na interface
  function applyUserData(user) {

    // Nome formatado para exibição
    const displayName = auth.getDisplayName(user);

    // Status do usuário (depende do tipo de página)
    const displayStatus = auth.getStatus(user, role);

    // Avatar do usuário
    const avatar = user.avatar;

    // Nome em maiúsculo (usado em cartões)
    const uppercaseName = displayName.toUpperCase();

    // Atualiza sidebar
    setText(".sidebar__profile-name", displayName);
    setText(".sidebar__profile-status", displayStatus);
    setImages(".sidebar__profile-img", displayName, avatar);

    // Atualiza resumo do perfil
    setText(".profile-summary__name", displayName);
    setText(".profile-summary__email", user.email);
    setImages(".profile-summary__avatar", displayName, avatar);
    setImages(".profile-avatar__image", displayName, avatar);

    // Preenche inputs do formulário
    setValue("#full-name", displayName);
    setValue("#email", user.email);
    setValue("#phone", user.phone || "");

    // Campos de nome em cartões (motorista/passageiro)
    const driverCardName = document.getElementById("driver-card-name");
    const passengerCardName = document.getElementById("passenger-card-name");

    // Só preenche se estiver vazio
    if (driverCardName && !driverCardName.value.trim()) {
      driverCardName.value = displayName;
    }

    if (passengerCardName && !passengerCardName.value.trim()) {
      passengerCardName.value = displayName;
    }

    // Preview do cartão do motorista
    const driverPreviewName = document.querySelector(".card-preview__meta .card-preview__value");
    if (driverPreviewName) {
      driverPreviewName.textContent = uppercaseName;
    }

    // Preview do cartão do passageiro
    const passengerPreviewName = document.querySelector(
      ".passenger-card-preview__meta .passenger-card-preview__meta-value"
    );
    if (passengerPreviewName) {
      passengerPreviewName.textContent = uppercaseName;
    }

    // Atualiza nome em todos os cartões de pagamento
    document.querySelectorAll(".payment-card__meta").forEach((meta) => {
      const value = meta.querySelector(".payment-card__meta-value");
      if (value) {
        value.textContent = uppercaseName;
      }
    });
  }

  // Configura os botões de logout (sair)
  function bindLogoutActions() {
    document.querySelectorAll("a, button").forEach((element) => {

      // Pega o texto do botão/link
      const elementText = element.textContent.replace(/\s+/g, " ").trim().toLowerCase();

      // Verifica se tem ícone de logout
      const hasLogoutIcon = Array.from(
        element.querySelectorAll(".material-symbols-outlined")
      ).some((icon) => icon.textContent.trim().toLowerCase() === "logout");

      // Condições para identificar botão de sair
      if (
        elementText.endsWith("sair") ||
        elementText.endsWith("sair da conta") ||
        (hasLogoutIcon && elementText.includes("sair"))
      ) {

        // Ao clicar, faz logout
        element.addEventListener("click", (event) => {
          event.preventDefault();

          // Limpa sessão
          auth.clearSession();

          // Redireciona para login
          window.location.href = auth.getLoginRoute(role);
        });
      }
    });
  }

  // Configura envio do formulário de perfil
  function bindProfileForm() {
    const profileForm = document.querySelector(".profile-form");

    // Se não existir formulário, sai
    if (!profileForm) {
      return;
    }

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Atualiza dados do usuário
      const result = auth.updateCurrentUser({
        login: document.getElementById("full-name")?.value || currentUser.login,
        email: document.getElementById("email")?.value || currentUser.email,
        phone: document.getElementById("phone")?.value || currentUser.phone,
      });

      // Se deu erro, mostra mensagem
      if (!result.ok) {
        showFeedback(profileForm, result.message, true);
        return;
      }

      // Atualiza usuário atual
      currentUser = result.user;

      // Atualiza interface com novos dados
      applyUserData(result.user);

      // Mostra sucesso
      showFeedback(profileForm, "Dados salvos com sucesso.", false);
    });
  }

  // Executa tudo ao carregar
  applyUserData(currentUser); // preenche tela
  bindLogoutActions();        // ativa logout
  bindProfileForm();          // ativa formulário
});