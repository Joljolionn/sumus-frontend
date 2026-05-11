(function attachSumusAuth(window) {
  const DEFAULT_AVATAR =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAgwWTWrs-hcHLvotHd_oEcgLxQ-LcIy23v2Rv_jDCz7IozibYAG-hO-fxjZZglZrUQmLoBzkk4NfQq37-IYJejtBMxC2wA5v0dRoo1HEe9GeDUDzyDZwpNDLkre8cYD4iYqpF0auylXMWbJRsMS768oyqiGMQF6ZDtxmVm95CYNHm8nff-0iRvl6CGaj6QG6WN5k8JWUhsKkU8c8MCVNbp8DU9ZWQJmBagNm4LCGXvdiDSXjfXXo1MBPN8LbYmO2TFBv7C2q_vz-Ms";

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

  const STATUS_BY_ROLE = {
    driver: "Motorista ativo",
    passenger: "Passageiro ativo",
  };

  const sessionState = {
    user: undefined,
    pending: null,
  };

  function normalizeRole(role) {
    const normalizedRole = String(role || "").trim().toLowerCase();

    if (normalizedRole === "driver") return "driver";

    if (normalizedRole === "passanger" || normalizedRole === "passenger") {
      return "passenger";
    }

    return "";
  }

  function sanitizePlace(rawPlace) {
    if (!rawPlace) return null;

    return {
      id: String(rawPlace.id || `place-${Date.now()}`),
      label: String(rawPlace.label || rawPlace.address || "Ponto"),
      address: String(rawPlace.address || rawPlace.label || "Ponto"),
      coords:
        Array.isArray(rawPlace.coords) && rawPlace.coords.length === 2
          ? rawPlace.coords.map((value) => Number(value))
          : null,
      icon: String(rawPlace.icon || "place"),
      tag: String(rawPlace.tag || ""),
    };
  }

  function sanitizeRecentDestinations(rawPlaces) {
    if (!Array.isArray(rawPlaces)) {
      return [];
    }

    return rawPlaces.map(sanitizePlace).filter(Boolean).slice(0, 6);
  }

  function sanitizeUser(rawUser, fallbackRole) {
    if (!rawUser) {
      return null;
    }

    const normalizedRole = normalizeRole(rawUser.role || fallbackRole);
    const normalizedEmail = String(rawUser.email || "").trim().toLowerCase();

    return {
      id: String(rawUser.id ?? `${normalizedRole || "user"}-${normalizedEmail || Date.now()}`),
      login: String(rawUser.login || rawUser.name || "").trim(),
      email: normalizedEmail,
      role: normalizedRole,
      phone: String(rawUser.phone || "").trim(),
      avatar: String(rawUser.avatar || DEFAULT_AVATAR).trim() || DEFAULT_AVATAR,
      profileStatus: String(rawUser.profileStatus || rawUser.status || "").trim(),
      recentDestinations: sanitizeRecentDestinations(rawUser.recentDestinations),
    };
  }

  function cacheUser(rawUser) {
    sessionState.user = rawUser ? sanitizeUser(rawUser, rawUser.role) : null;
    return sessionState.user;
  }

  async function requestJson(url, options = {}) {
    const response = await window.fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      credentials: "same-origin",
      ...options,
    });

    const isJson = String(response.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(payload?.message || "Nao foi possivel concluir a operacao.");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async function loadSession(options = {}) {
    if (!options.force && sessionState.user !== undefined) {
      return sessionState.user;
    }

    if (!options.force && sessionState.pending) {
      return sessionState.pending;
    }

    sessionState.pending = requestJson("/api/auth/session")
      .then((payload) => cacheUser(payload?.user || null))
      .catch((error) => {
        if (error.status === 401) {
          return cacheUser(null);
        }

        throw error;
      })
      .finally(() => {
        sessionState.pending = null;
      });

    return sessionState.pending;
  }

  function getDisplayName(user) {
    const normalizedUser = sanitizeUser(user, user?.role);

    if (!normalizedUser) return "Usuario";
    if (normalizedUser.login) return normalizedUser.login;
    if (normalizedUser.email) return normalizedUser.email.split("@")[0];

    return "Usuario";
  }

  function getStatus(user, fallbackRole) {
    const normalizedUser = sanitizeUser(user, fallbackRole);

    return (
      normalizedUser?.profileStatus ||
      STATUS_BY_ROLE[normalizedUser?.role] ||
      STATUS_BY_ROLE[normalizeRole(fallbackRole)] ||
      "Conta ativa"
    );
  }

  function getRoute(role, routeType) {
    const normalizedRole = normalizeRole(role);
    return ROUTES[normalizedRole]?.[routeType] || "/";
  }

  function getPageRole(pathname) {
    const currentPath = String(pathname || window.location.pathname).toLowerCase();

    if (currentPath.includes("/driver/")) return "driver";
    if (currentPath.includes("/passenger/")) return "passenger";

    return "";
  }

  function getCachedSession() {
    return sessionState.user === undefined ? null : sessionState.user;
  }

  function getCachedSessionForRole(role) {
    const normalizedRole = normalizeRole(role);
    const currentSession = getCachedSession();

    if (!currentSession) {
      return null;
    }

    if (
      normalizedRole &&
      currentSession.role &&
      currentSession.role !== normalizedRole
    ) {
      return null;
    }

    return currentSession;
  }

  async function getSession() {
    return await loadSession();
  }

  async function getSessionForRole(role) {
    const normalizedRole = normalizeRole(role);
    const currentSession = await loadSession();

    if (!currentSession) {
      return null;
    }

    if (
      normalizedRole &&
      currentSession.role &&
      currentSession.role !== normalizedRole
    ) {
      return null;
    }

    return currentSession;
  }

  async function login(credentials) {
    const payload = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: credentials?.email,
        password: credentials?.password,
        role: normalizeRole(credentials?.role),
      }),
    });

    return cacheUser(payload?.user || null);
  }

  async function registerUser(userData) {
    try {
      const payload = await requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          login: userData?.login,
          email: userData?.email,
          password: userData?.password,
          role: normalizeRole(userData?.role),
        }),
      });

      return {
        ok: true,
        user: sanitizeUser(payload?.user, userData?.role),
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  }

  async function updateCurrentUser(partialUser) {
    try {
      const payload = await requestJson("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(partialUser || {}),
      });

      return {
        ok: true,
        user: cacheUser(payload?.user || null),
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  }

  async function clearSession() {
    try {
      await requestJson("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      if (error.status !== 401) {
        throw error;
      }
    }

    cacheUser(null);
  }

  window.SumusAuth = {
    clearSession,
    getCachedSession,
    getCachedSessionForRole,
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
    login,
    registerUser,
    updateCurrentUser,
  };
})(window);
