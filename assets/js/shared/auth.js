// IIFE para encapsular tudo e não poluir o escopo global
(function attachSumusAuth(window) {

  // Chaves usadas no localStorage
  const USERS_KEY = "usuarios";       // lista de usuários
  const SESSION_KEY = "loggedUser";   // usuário logado

  // Avatar padrão
  const DEFAULT_AVATAR =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAgwWTWrs-hcHLvotHd_oEcgLxQ-LcIy23v2Rv_jDCz7IozibYAG-hO-fxjZZglZrUQmLoBzkk4NfQq37-IYJejtBMxC2wA5v0dRoo1HEe9GeDUDzyDZwpNDLkre8cYD4iYqpF0auylXMWbJRsMS768oyqiGMQF6ZDtxmVm95CYNHm8nff-0iRvl6CGaj6QG6WN5k8JWUhsKkU8c8MCVNbp8DU9ZWQJmBagNm4LCGXvdiDSXjfXXo1MBPN8LbYmO2TFBv7C2q_vz-Ms";

  // Usuário de demonstração (caso não haja nenhum salvo)
  const DEMO_USER = {
    id: 0,
    login: "Silvia",
    email: "silviaCach@sumus.com",
    password: "69",
  };

  // Rotas principais por tipo de usuário
  const ROUTES = {
    driver: {
      dashboard: "/driver/home-motorista",
      login: "/driver/login",
    },
    passenger: {
      dashboard: "/passenger/home-passageiro",
      login: "/passenger/login",
    },
  };

  // Status padrão por tipo de usuário
  const STATUS_BY_ROLE = {
    driver: "Motorista ativo",
    passenger: "Passageiro ativo",
  };

  // Normaliza role (corrige erros de escrita)
  function normalizeRole(role) {
    const normalizedRole = String(role || "").trim().toLowerCase();

    if (normalizedRole === "driver") return "driver";

    // Corrige erro comum "passanger"
    if (normalizedRole === "passanger" || normalizedRole === "passenger") {
      return "passenger";
    }

    return "";
  }

  // Lê JSON do localStorage com fallback
  function readJson(key, fallbackValue) {
    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  // Salva JSON no localStorage
  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  // Normaliza e garante estrutura do usuário
  function sanitizeUser(rawUser, fallbackRole) {
    const normalizedRole = normalizeRole(rawUser?.role || fallbackRole);
    const normalizedEmail = String(rawUser?.email || "").trim().toLowerCase();

    return {
      id: rawUser?.id ?? `${normalizedRole || "user"}-${normalizedEmail || Date.now()}`,
      login: String(rawUser?.login || rawUser?.name || "").trim(),
      email: normalizedEmail,
      password: String(rawUser?.password || ""),
      role: normalizedRole,
      phone: String(rawUser?.phone || "").trim(),
      avatar: String(rawUser?.avatar || DEFAULT_AVATAR).trim() || DEFAULT_AVATAR,
      profileStatus: String(rawUser?.profileStatus || rawUser?.status || "").trim(),
    };
  }

  // Recupera usuários do storage
  function getStoredUsers() {
    const storedUsers = readJson(USERS_KEY, []);

    return Array.isArray(storedUsers)
      ? storedUsers.map((user) => sanitizeUser(user, user?.role))
      : [];
  }

  // Retorna usuários para autenticação (ou demo)
  function getUsersForAuth() {
    const storedUsers = getStoredUsers();
    return storedUsers.length > 0 ? storedUsers : [sanitizeUser(DEMO_USER)];
  }

  // Salva lista de usuários
  function saveUsers(users) {
    writeJson(
      USERS_KEY,
      users.map((user) => sanitizeUser(user, user?.role))
    );
  }

  // Gera próximo ID numérico
  function getNextUserId(users) {
    const numericIds = users
      .map((user) => Number.parseInt(user.id, 10))
      .filter((value) => Number.isFinite(value));

    if (!numericIds.length) return 1;

    return Math.max(...numericIds) + 1;
  }

  // Retorna nome de exibição
  function getDisplayName(user) {
    const normalizedUser = sanitizeUser(user, user?.role);

    if (normalizedUser.login) return normalizedUser.login;

    if (normalizedUser.email) {
      return normalizedUser.email.split("@")[0];
    }

    return "Usuário";
  }

  // Retorna status do usuário
  function getStatus(user, fallbackRole) {
    const normalizedUser = sanitizeUser(user, fallbackRole);

    return (
      normalizedUser.profileStatus ||
      STATUS_BY_ROLE[normalizedUser.role] ||
      "Conta ativa"
    );
  }

  // Verifica se dois usuários são o mesmo
  function isSameIdentity(leftUser, rightUser) {
    const left = sanitizeUser(leftUser, leftUser?.role);
    const right = sanitizeUser(rightUser, rightUser?.role);

    const sameRole = !left.role || !right.role || left.role === right.role;

    // compara ID
    if (String(left.id) === String(right.id) && sameRole) {
      return true;
    }

    // compara email
    return Boolean(
      left.email &&
      right.email &&
      left.email === right.email &&
      sameRole
    );
  }

  // Retorna rota com base no role
  function getRoute(role, routeType) {
    const normalizedRole = normalizeRole(role);
    return ROUTES[normalizedRole]?.[routeType] || "/";
  }

  // Detecta tipo de página pela URL
  function getPageRole(pathname) {
    const currentPath = String(pathname || window.location.pathname).toLowerCase();

    if (currentPath.includes("/driver/")) return "driver";
    if (currentPath.includes("/passenger/")) return "passenger";

    return "";
  }

  // Busca usuário por email/senha
  function findUserByCredentials(email, password, role) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    return (
      getUsersForAuth().find((user) => {
        const normalizedUser = sanitizeUser(user, user?.role);

        return (
          normalizedUser.email === normalizedEmail &&
          normalizedUser.password === String(password || "") &&
          (!normalizedRole || !normalizedUser.role || normalizedUser.role === normalizedRole)
        );
      }) || null
    );
  }

  // Registra novo usuário
  function registerUser(userData) {
    const normalizedRole = normalizeRole(userData?.role);
    const users = getStoredUsers();
    const normalizedEmail = String(userData?.email || "").trim().toLowerCase();

    // Verifica duplicidade
    const hasDuplicate = users.some((user) => {
      const normalizedUser = sanitizeUser(user, user?.role);

      return (
        normalizedUser.email === normalizedEmail &&
        (!normalizedUser.role || normalizedUser.role === normalizedRole)
      );
    });

    if (hasDuplicate) {
      return {
        ok: false,
        message: "Este e-mail já está cadastrado para esse acesso.",
      };
    }

    // Cria novo usuário
    const newUser = sanitizeUser(
      {
        id: getNextUserId(users),
        login: userData?.login,
        email: normalizedEmail,
        password: userData?.password,
        role: normalizedRole,
      },
      normalizedRole
    );

    users.push(newUser);
    saveUsers(users);

    return {
      ok: true,
      user: newUser,
    };
  }

  // Cria ou atualiza usuário
  function upsertUser(rawUser, fallbackRole) {
    const normalizedUser = sanitizeUser(rawUser, fallbackRole);
    const users = getStoredUsers();

    const existingIndex = users.findIndex((user) =>
      isSameIdentity(user, normalizedUser)
    );

    // Atualiza existente
    if (existingIndex >= 0) {
      users[existingIndex] = sanitizeUser(
        {
          ...users[existingIndex],
          ...normalizedUser,
        },
        normalizedUser.role || users[existingIndex].role
      );

      saveUsers(users);
      return users[existingIndex];
    }

    // Cria novo
    const userToSave = sanitizeUser(
      {
        ...normalizedUser,
        id: normalizedUser.id ?? getNextUserId(users),
      },
      normalizedUser.role
    );

    users.push(userToSave);
    saveUsers(users);
    return userToSave;
  }

  // Define sessão (login)
  function setSession(user, fallbackRole) {
    const persistedUser = upsertUser(user, fallbackRole);
    writeJson(SESSION_KEY, persistedUser);
    return persistedUser;
  }

  // Recupera sessão atual
  function getSession() {
    const storedSession = readJson(SESSION_KEY, null);
    return storedSession
      ? sanitizeUser(storedSession, storedSession?.role)
      : null;
  }

  // Recupera sessão validando o tipo (driver/passenger)
  function getSessionForRole(role) {
    const normalizedRole = normalizeRole(role);
    const currentSession = getSession();

    if (!currentSession) return null;

    // Corrige role vazio
    if (!currentSession.role && normalizedRole) {
      return setSession(currentSession, normalizedRole);
    }

    // Bloqueia acesso se role diferente
    if (
      normalizedRole &&
      currentSession.role &&
      currentSession.role !== normalizedRole
    ) {
      return null;
    }

    return currentSession;
  }

  // Atualiza dados do usuário logado
  function updateCurrentUser(partialUser) {
    const currentSession = getSession();

    if (!currentSession) {
      return {
        ok: false,
        message: "Nenhuma sessão ativa encontrada.",
      };
    }

    const normalizedRole = currentSession.role;
    const nextEmail = String(partialUser?.email || currentSession.email)
      .trim()
      .toLowerCase();

    const users = getStoredUsers();

    // Verifica duplicidade de email
    const hasDuplicate = users.some((user) => {
      const normalizedUser = sanitizeUser(user, user?.role);

      return (
        normalizedUser.email === nextEmail &&
        normalizedUser.role === normalizedRole &&
        !isSameIdentity(normalizedUser, currentSession)
      );
    });

    if (hasDuplicate) {
      return {
        ok: false,
        message: "Este e-mail já está em uso para esse tipo de conta.",
      };
    }

    // Atualiza usuário
    const updatedUser = sanitizeUser(
      {
        ...currentSession,
        ...partialUser,
        email: nextEmail,
      },
      normalizedRole
    );

    const persistedUser = upsertUser(updatedUser, normalizedRole);

    // Atualiza sessão
    writeJson(SESSION_KEY, persistedUser);

    return {
      ok: true,
      user: persistedUser,
    };
  }

  // Logout
  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  // Expõe API global
  window.SumusAuth = {
    clearSession,
    findUserByCredentials,
    getDashboardRoute(role) {
      return getRoute(role, "dashboard");
    },
    getDisplayName,
    getLoginRoute(role) {
      return getRoute(role, "login");
    },
    getPageRole,
    getSession,
    getSessionForRole,
    getStatus,
    registerUser,
    setSession,
    updateCurrentUser,
  };

})(window);