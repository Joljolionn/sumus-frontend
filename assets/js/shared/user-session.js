document.addEventListener("DOMContentLoaded", () => {
  void initializeUserSession();
});

async function initializeUserSession() {
  const auth = window.SumusAuth;

  if (!auth) {
    return;
  }

  const role = auth.getPageRole(window.location.pathname);
  let currentUser = await auth.getSessionForRole(role);

  if (!currentUser) {
    window.location.href = auth.getLoginRoute(role);
    return;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  }

  function setValue(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.value = value;
    });
  }

  function setImages(selector, name, avatar) {
    document.querySelectorAll(selector).forEach((image) => {
      image.src = avatar;
      image.alt = name;
    });
  }

  function showFeedback(form, message, isError) {
    let feedback = form.querySelector(".profile-form__feedback");

    if (!feedback) {
      feedback = document.createElement("p");
      feedback.className = "profile-form__feedback";
      form.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.marginTop = "1rem";
    feedback.style.fontSize = "0.95rem";
    feedback.style.color = isError ? "#c2410c" : "#166534";
  }

  function applyUserData(user) {
    const displayName = auth.getDisplayName(user);
    const displayStatus = auth.getStatus(user, role);
    const avatar = user.avatar;
    const uppercaseName = displayName.toUpperCase();

    setText(".sidebar__profile-name", displayName);
    setText(".sidebar__profile-status", displayStatus);
    setImages(".sidebar__profile-img", displayName, avatar);

    setText(".profile-summary__name", displayName);
    setText(".profile-summary__email", user.email);
    setImages(".profile-summary__avatar", displayName, avatar);
    setImages(".profile-avatar__image", displayName, avatar);

    setValue("#full-name", displayName);
    setValue("#email", user.email);
    setValue("#phone", user.phone || "");

    const driverCardName = document.getElementById("driver-card-name");
    const passengerCardName = document.getElementById("passenger-card-name");

    if (driverCardName && !driverCardName.value.trim()) {
      driverCardName.value = displayName;
    }

    if (passengerCardName && !passengerCardName.value.trim()) {
      passengerCardName.value = displayName;
    }

    const driverPreviewName = document.querySelector(".card-preview__meta .card-preview__value");
    if (driverPreviewName) {
      driverPreviewName.textContent = uppercaseName;
    }

    const passengerPreviewName = document.querySelector(
      ".passenger-card-preview__meta .passenger-card-preview__meta-value"
    );
    if (passengerPreviewName) {
      passengerPreviewName.textContent = uppercaseName;
    }

    document.querySelectorAll(".payment-card__meta").forEach((meta) => {
      const value = meta.querySelector(".payment-card__meta-value");
      if (value) {
        value.textContent = uppercaseName;
      }
    });
  }

  function bindLogoutActions() {
    document.querySelectorAll("a, button").forEach((element) => {
      const elementText = element.textContent.replace(/\s+/g, " ").trim().toLowerCase();

      const hasLogoutIcon = Array.from(
        element.querySelectorAll(".material-symbols-outlined")
      ).some((icon) => icon.textContent.trim().toLowerCase() === "logout");

      if (
        elementText.endsWith("sair") ||
        elementText.endsWith("sair da conta") ||
        (hasLogoutIcon && elementText.includes("sair"))
      ) {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          void (async () => {
            await auth.clearSession();
            window.location.href = auth.getLoginRoute(role);
          })();
        });
      }
    });
  }

  function bindProfileForm() {
    const profileForm = document.querySelector(".profile-form");

    if (!profileForm) {
      return;
    }

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();

      void (async () => {
        const result = await auth.updateCurrentUser({
          login: document.getElementById("full-name")?.value || currentUser.login,
          email: document.getElementById("email")?.value || currentUser.email,
          phone: document.getElementById("phone")?.value || currentUser.phone,
        });

        if (!result.ok) {
          showFeedback(profileForm, result.message, true);
          return;
        }

        currentUser = result.user;
        applyUserData(result.user);
        showFeedback(profileForm, "Dados salvos com sucesso.", false);
      })();
    });
  }

  applyUserData(currentUser);
  bindLogoutActions();
  bindProfileForm();
}
