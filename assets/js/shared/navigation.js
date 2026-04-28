// IIFE (função autoexecutável) para evitar poluir o escopo global
(function attachSumusNavigation(window, document) {

  // Objeto com todas as rotas do sistema
  const ROUTES = {
    home: "/",
    contact: "/#contato",
    about: "/#valores",
    signupChoice: "/cadastro-step-0",
    loginChoice: "/acesso",

    // DRIVER
    driverLogin: "/driver/login",
    driverDashboard: "/driver/home-motorista",
    driverProfile: "/driver/perfil-motorista",
    driverVehicles: "/driver/veiculos",
    driverPayments: "/driver/metodo-pagamento",
    driverHistory: "/driver/historico",
    driverSettings: "/driver/configuracao",
    driverSignup: "/driver/cadastro-step-1",
    driverDocuments: "/driver/cadastro-documento",
    driverOtp: "/driver/codigo-otp",
    driverCardRegistration: "/driver/cadastro-cartao",

    // PASSENGER
    passengerLogin: "/passenger/login",
    passengerDashboard: "/passenger/home-passageiro",
    passengerProfile: "/passenger/perfil-passageiro",
    passengerPayments: "/passenger/cadastro-cartao",
    passengerSettings: "/passenger/configuracao",

    // ADMIN
    adminLogin: "/admin/loginadmin",
    adminDashboard: "/admin/dashboard",
    adminPassengerApproval: "/admin/aprovacao-passageiro",
    adminDriverApproval: "/admin/aprovacao-motorista",
    adminManagement: "/admin/gestao",
  };

  // Normaliza texto (remove acentos, caracteres especiais e padroniza)
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD") // separa acentos
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ") // remove caracteres especiais
      .replace(/\s+/g, " ") // remove espaços duplicados
      .trim();
  }

  // Normaliza caminho da URL
  function normalizePath(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();

    if (!normalizedValue || normalizedValue === "/") {
      return "/";
    }

    // Remove barra no final
    return normalizedValue.replace(/\/+$/, "");
  }

  // Identifica a área do sistema com base na URL
  function getArea(pathname) {
    const currentPath = normalizePath(pathname || window.location.pathname);

    if (currentPath.startsWith("/driver/")) return "driver";
    if (currentPath.startsWith("/passenger/")) return "passenger";
    if (currentPath.startsWith("/admin/")) return "admin";

    return "public";
  }

  // Retorna rota de login dependendo da área
  function getLoginRoute(area) {
    if (area === "driver") return ROUTES.driverLogin;
    if (area === "passenger") return ROUTES.passengerLogin;
    if (area === "admin") return ROUTES.adminLogin;

    return ROUTES.loginChoice;
  }

  // Define para onde o logo redireciona
  function getBrandRoute(area) {
    if (area === "driver") return ROUTES.driverDashboard;
    if (area === "passenger") return ROUTES.passengerDashboard;
    if (area === "admin") return ROUTES.adminDashboard;

    return ROUTES.home;
  }

  // Lista de palavras-chave → rotas (roteamento inteligente por texto)
  function getRouteEntries(area) {

    // Rotas compartilhadas
    const sharedEntries = [
      ["sobre nos", ROUTES.about],
      ["sobre", ROUTES.about],
      ["trabalhe conosco", ROUTES.about],
      ["blog", ROUTES.about],
      ["termos de uso", ROUTES.contact],
      ["termos", ROUTES.contact],
      ["privacidade", ROUTES.contact],
      ["politica de privacidade", ROUTES.contact],
      ["central de ajuda", ROUTES.contact],
      ["contato", ROUTES.contact],
      ["esqueceu a senha", getLoginRoute(area)],
      ["esqueceu sua senha", getLoginRoute(area)],
    ];

    // Rotas específicas do motorista
    if (area === "driver") {
      return [
        ["dashboard", ROUTES.driverDashboard],
        ["ganhos", ROUTES.driverPayments],
        ["financeiro", ROUTES.driverPayments],
        ["financas", ROUTES.driverPayments],
        ["metodo de pagamento", ROUTES.driverPayments],
        ["pagamento", ROUTES.driverPayments],
        ["historico", ROUTES.driverHistory],
        ["perfil", ROUTES.driverProfile],
        ["meus veiculos", ROUTES.driverVehicles],
        ["veiculos", ROUTES.driverVehicles],
        ["configuracao", ROUTES.driverSettings],
        ["ajuda", ROUTES.driverSettings],
        ["suporte", ROUTES.driverSettings],
        ["sair", ROUTES.driverLogin],
        ...sharedEntries,
      ];
    }

    // Rotas específicas do passageiro
    if (area === "passenger") {
      return [
        ["dashboard", ROUTES.passengerDashboard],
        ["viagem", ROUTES.passengerDashboard],
        ["corridas", ROUTES.passengerDashboard],
        ["historico", ROUTES.passengerDashboard],
        ["perfil", ROUTES.passengerProfile],
        ["pagamento", ROUTES.passengerPayments],
        ["configuracao", ROUTES.passengerSettings],
        ["ajuda", ROUTES.passengerSettings],
        ["sair", ROUTES.passengerLogin],
        ...sharedEntries,
      ];
    }

    // Rotas do admin
    if (area === "admin") {
      return [
        ["dashboard", ROUTES.adminDashboard],
        ["aprovacao passageiro", ROUTES.adminPassengerApproval],
        ["aprovacao motorista", ROUTES.adminDriverApproval],
        ["gestao", ROUTES.adminManagement],
        ["login", ROUTES.adminLogin],
        ["sair", ROUTES.adminLogin],
        ...sharedEntries,
      ];
    }

    // Rotas públicas
    return [
      ["viajar", ROUTES.passengerLogin],
      ["ganhe dinheiro", ROUTES.driverLogin],
      ["fazer login", ROUTES.loginChoice],
      ["cadastre se", ROUTES.signupChoice],
      ["solicitar agora", ROUTES.passengerLogin],
      ...sharedEntries,
    ];
  }

  // Resolve rota com base no texto do elemento
  function resolveRoute(label, area) {
    if (!label) return "";

    return (
      getRouteEntries(area).find(([pattern]) => label.includes(pattern))?.[1] || ""
    );
  }

  // Adiciona comportamento de navegação a um elemento
  function addClickNavigation(element, route) {
    if (!element || !route) return;

    // Se for <a>, só ajusta o href
    if (element.tagName === "A") {
      const rawHref = element.getAttribute("href");

      if (!rawHref || rawHref === "#") {
        element.setAttribute("href", route);
      }
      return;
    }

    // Se não for <a>, transforma em "clicável"
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "0");
    }

    if (!element.getAttribute("role")) {
      element.setAttribute("role", "link");
    }

    element.style.cursor = "pointer";

    // Clique
    element.addEventListener("click", () => {
      window.location.href = route;
    });

    // Teclado (acessibilidade)
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = route;
      }
    });
  }

  // Aplica navegação em vários elementos via seletor
  function bindSelector(selector, route) {
    document.querySelectorAll(selector).forEach((element) => {
      addClickNavigation(element, route);
    });
  }

  // Substitui links "#" por rotas reais baseado no texto
  function bindPlaceholderLinks(area) {
    document.querySelectorAll('a[href="#"]').forEach((anchor) => {
      const label = normalizeText(anchor.textContent);
      const route = resolveRoute(label, area);

      if (route) {
        anchor.setAttribute("href", route);
      }
    });
  }

  // Marca item ativo na sidebar
  function markActiveSidebarLink() {
    const currentPath = normalizePath(window.location.pathname);

    // Mapeia páginas relacionadas
    const relatedActiveRoutes = new Map([
      [ROUTES.driverCardRegistration, ROUTES.driverPayments],
    ]);

    document.querySelectorAll(".sidebar__link").forEach((anchor) => {
      if (anchor.tagName !== "A") return;

      const target = anchor.getAttribute("href");
      if (!target || target.startsWith("#")) return;

      const normalizedTarget = normalizePath(
        new URL(target, window.location.href).pathname.replace(/\.html$/i, "")
      );

      const activePath = relatedActiveRoutes.get(currentPath) || currentPath;

      // Ativa classe se bater com a rota atual
      anchor.classList.toggle(
        "sidebar__link--active",
        Boolean(normalizedTarget && normalizedTarget === activePath)
      );
    });
  }

  // Redireciona formulário ao enviar
  function bindFormRedirect(selector, route) {
    const form = document.querySelector(selector);
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = route;
    });
  }

  // Redireciona botão ao clicar
  function bindButtonRedirect(selector, route) {
    const button = document.querySelector(selector);
    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = route;
    });
  }

  // Controla fluxo de páginas (tipo wizard)
  function bindPageFlows(currentPath) {

    if (currentPath === ROUTES.driverSignup) {
      bindFormRedirect(".signup-form", ROUTES.driverDocuments);
      bindSelector(".signup-card__footer-link", ROUTES.driverLogin);
      return;
    }

    if (currentPath === ROUTES.driverDocuments) {
      bindButtonRedirect(".upload-submit", ROUTES.driverOtp);
      return;
    }

    if (currentPath === ROUTES.driverOtp) {
      bindFormRedirect(".otp-form", ROUTES.driverLogin);
      bindSelector(".otp-shell__back-link", ROUTES.driverLogin);
      return;
    }

    if (currentPath === ROUTES.adminLogin) {
      bindFormRedirect(".admin-login-form", ROUTES.adminDashboard);
      return;
    }

    if (currentPath === ROUTES.driverCardRegistration) {
      bindFormRedirect(".card-form", ROUTES.driverPayments);
      return;
    }

    if (currentPath === ROUTES.passengerPayments) {
      bindFormRedirect(".passenger-card-form", ROUTES.passengerSettings);
    }
  }

  // Executa quando o DOM carrega
  document.addEventListener("DOMContentLoaded", () => {
    const area = getArea(window.location.pathname);
    const currentPath = normalizePath(window.location.pathname);

    // Define navegação de elementos principais
    bindSelector(".topbar__brand", getBrandRoute(area));
    bindSelector(".sidebar__brand", getBrandRoute(area));
    bindSelector(".sidebar__brand-text", getBrandRoute(area));
    bindSelector(".topbar__login", getLoginRoute(area));
    bindSelector(".topbar__signup", ROUTES.signupChoice);
    bindSelector(".login-link", ROUTES.loginChoice);
    bindSelector(".search-widget__btn", ROUTES.passengerLogin);

    // Ativa automações
    bindPlaceholderLinks(area);
    bindPageFlows(currentPath);
    markActiveSidebarLink();
  });

})(window, document);