const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config({ quiet: true });

const ROOT_DIR = __dirname;
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "app-db.json");
const LANDING_PAGE = path.join(ROOT_DIR, "index.html");
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const NAVIGATION_SCRIPT_TAG = '<script src="/assets/js/shared/navigation.js"></script>';
const ACTIVE_STATUSES = new Set(["searching", "accepted"]);
const SESSION_COOKIE_NAME = "sumus_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAgwWTWrs-hcHLvotHd_oEcgLxQ-LcIy23v2Rv_jDCz7IozibYAG-hO-fxjZZglZrUQmLoBzkk4NfQq37-IYJejtBMxC2wA5v0dRoo1HEe9GeDUDzyDZwpNDLkre8cYD4iYqpF0auylXMWbJRsMS768oyqiGMQF6ZDtxmVm95CYNHm8nff-0iRvl6CGaj6QG6WN5k8JWUhsKkU8c8MCVNbp8DU9ZWQJmBagNm4LCGXvdiDSXjfXXo1MBPN8LbYmO2TFBv7C2q_vz-Ms";
const STATUS_BY_ROLE = {
  driver: "Motorista ativo",
  passenger: "Passageiro ativo",
};

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function normalizeRouteSegment(segment) {
  return segment
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function normalizeRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "driver") {
    return "driver";
  }

  if (normalizedRole === "passenger" || normalizedRole === "passanger") {
    return "passenger";
  }

  return "";
}

function collectHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectHtmlFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}

function createPageDefinition(filePath) {
  const relativePath = toPosixPath(path.relative(PAGES_DIR, filePath));
  const routePath = relativePath.replace(/\.html$/i, "");
  const normalizedRoutePath = routePath
    .split("/")
    .map(normalizeRouteSegment)
    .join("/");

  const rawRoute = `/${routePath}`;
  const canonicalRoute = `/${normalizedRoutePath}`;

  const aliases = new Set([
    rawRoute,
    `${rawRoute}.html`,
    `${canonicalRoute}.html`,
    `/pages/${routePath}.html`,
    `/pages/${normalizedRoutePath}.html`,
  ]);

  aliases.delete(canonicalRoute);

  return {
    filePath,
    canonicalRoute,
    aliases: [...aliases],
  };
}

function buildPageRegistry() {
  const contentPages = collectHtmlFiles(PAGES_DIR)
    .map(createPageDefinition)
    .sort((a, b) => a.canonicalRoute.localeCompare(b.canonicalRoute));

  return [
    {
      filePath: LANDING_PAGE,
      canonicalRoute: "/",
      aliases: ["/index", "/index.html"],
    },
    ...contentPages,
  ];
}

const pageRegistry = buildPageRegistry();
const pageFileLookup = new Map();
const pageAliasLookup = new Map();

function registerLookupEntry(lookup, routePath, value) {
  lookup.set(routePath, value);
  lookup.set(routePath.normalize("NFC"), value);
  lookup.set(routePath.normalize("NFD"), value);
}

for (const page of pageRegistry) {
  registerLookupEntry(pageFileLookup, page.canonicalRoute, page.filePath);

  for (const alias of page.aliases) {
    registerLookupEntry(pageAliasLookup, alias, page.canonicalRoute);
  }
}

function injectSharedScripts(html) {
  if (html.includes(NAVIGATION_SCRIPT_TAG)) {
    return html;
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${NAVIGATION_SCRIPT_TAG}\n</body>`);
  }

  return `${html}\n${NAVIGATION_SCRIPT_TAG}`;
}

function sendHtml(filePath, res) {
  fs.readFile(filePath, "utf8", (error, html) => {
    if (error) {
      res.status(500).send("Nao foi possivel carregar a pagina.");
      return;
    }

    res.type("html").send(injectSharedScripts(html));
  });
}

function getRouteVariants(routePath) {
  const decodedPath = decodeURIComponent(routePath);
  const variants = new Set([routePath, decodedPath]);

  for (const value of [...variants]) {
    variants.add(value.normalize("NFC"));
    variants.add(value.normalize("NFD"));
  }

  return [...variants];
}

function resolvePageRequest(routePath) {
  for (const routeVariant of getRouteVariants(routePath)) {
    const filePath = pageFileLookup.get(routeVariant);
    if (filePath) {
      return { type: "page", filePath };
    }

    const canonicalRoute = pageAliasLookup.get(routeVariant);
    if (canonicalRoute) {
      return { type: "redirect", canonicalRoute };
    }
  }

  return null;
}

function sanitizeParty(rawParty) {
  if (!rawParty) {
    return null;
  }

  const id = String(rawParty.id ?? "").trim();
  const name = String(
    rawParty.name || rawParty.login || rawParty.label || rawParty.email || "Usuario"
  ).trim();
  const email = String(rawParty.email || "").trim().toLowerCase();

  if (!id && !email) {
    return null;
  }

  return {
    id: id || email,
    name: name || "Usuario",
    email,
  };
}

function sanitizePlace(rawPlace) {
  if (!rawPlace) {
    return null;
  }

  const coords =
    Array.isArray(rawPlace.coords) && rawPlace.coords.length === 2
      ? rawPlace.coords.map((value) => Number(value))
      : null;

  return {
    id: String(rawPlace.id || `place-${Date.now()}`),
    label: String(rawPlace.label || rawPlace.address || "Ponto"),
    address: String(rawPlace.address || rawPlace.label || "Ponto"),
    coords: coords && coords.every((value) => Number.isFinite(value)) ? coords : null,
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

function sanitizeEstimate(rawEstimate) {
  if (!rawEstimate) {
    return null;
  }

  const distanceKm = Number(rawEstimate.distanceKm);
  const durationMinutes = Number(rawEstimate.durationMinutes);
  const fareValue = Number(rawEstimate.fareValue);

  return {
    badge: String(rawEstimate.badge || ""),
    distanceLabel: String(rawEstimate.distanceLabel || "-"),
    durationLabel: String(rawEstimate.durationLabel || "-"),
    fareLabel: String(rawEstimate.fareLabel || "-"),
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
    fareValue: Number.isFinite(fareValue) ? fareValue : null,
    approximate: Boolean(rawEstimate.approximate),
  };
}

function sanitizeRoute(rawRoute) {
  if (!rawRoute) {
    return null;
  }

  const geometry = Array.isArray(rawRoute.geometry)
    ? rawRoute.geometry
        .filter(
          (point) =>
            Array.isArray(point) &&
            point.length === 2 &&
            Number.isFinite(Number(point[0])) &&
            Number.isFinite(Number(point[1]))
        )
        .map((point) => [Number(point[0]), Number(point[1])])
    : [];

  if (!geometry.length) {
    return null;
  }

  const distanceMeters = Number(rawRoute.distanceMeters);
  const durationSeconds = Number(rawRoute.durationSeconds);

  return {
    geometry,
    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    approximate: Boolean(rawRoute.approximate),
    source: String(rawRoute.source || ""),
  };
}

function sanitizeRequest(rawRequest) {
  if (!rawRequest) {
    return null;
  }

  const passenger = sanitizeParty(rawRequest.passenger);
  const origin = sanitizePlace(rawRequest.origin);
  const destination = sanitizePlace(rawRequest.destination);

  if (!passenger || !origin || !destination) {
    return null;
  }

  return {
    id: String(rawRequest.id || `request-${Date.now()}`),
    createdAt: String(rawRequest.createdAt || new Date().toISOString()),
    updatedAt: String(rawRequest.updatedAt || rawRequest.createdAt || new Date().toISOString()),
    status: String(rawRequest.status || "searching"),
    passenger,
    driver: sanitizeParty(rawRequest.driver),
    origin,
    destination,
    support: String(rawRequest.support || "embarque"),
    notes: String(rawRequest.notes || ""),
    estimate: sanitizeEstimate(rawRequest.estimate),
    route: sanitizeRoute(rawRequest.route),
    acceptedAt: rawRequest.acceptedAt ? String(rawRequest.acceptedAt) : "",
    cancelledAt: rawRequest.cancelledAt ? String(rawRequest.cancelledAt) : "",
    cancelledBy: sanitizeParty(rawRequest.cancelledBy),
  };
}

function sanitizeUser(rawUser) {
  if (!rawUser) {
    return null;
  }

  const role = normalizeRole(rawUser.role);
  const email = String(rawUser.email || "").trim().toLowerCase();
  const passwordHash = String(rawUser.passwordHash || "").trim();
  const passwordSalt = String(rawUser.passwordSalt || "").trim();

  if (!role || !email || !passwordHash || !passwordSalt) {
    return null;
  }

  return {
    id: String(rawUser.id || crypto.randomUUID()),
    login: String(rawUser.login || rawUser.name || "").trim(),
    email,
    role,
    phone: String(rawUser.phone || "").trim(),
    avatar: String(rawUser.avatar || DEFAULT_AVATAR).trim() || DEFAULT_AVATAR,
    profileStatus:
      String(rawUser.profileStatus || rawUser.status || "").trim() ||
      STATUS_BY_ROLE[role] ||
      "Conta ativa",
    recentDestinations: sanitizeRecentDestinations(rawUser.recentDestinations),
    passwordHash,
    passwordSalt,
  };
}

function sanitizeSession(rawSession) {
  if (!rawSession) {
    return null;
  }

  const token = String(rawSession.token || "").trim();
  const userId = String(rawSession.userId || "").trim();
  const createdAt = String(rawSession.createdAt || "");
  const expiresAt = String(rawSession.expiresAt || "");
  const expiresAtTime = new Date(expiresAt).getTime();

  if (!token || !userId || !createdAt || !Number.isFinite(expiresAtTime)) {
    return null;
  }

  if (expiresAtTime <= Date.now()) {
    return null;
  }

  return {
    token,
    userId,
    createdAt,
    expiresAt,
  };
}

function sanitizeDatabase(rawDatabase) {
  return {
    users: Array.isArray(rawDatabase?.users) ? rawDatabase.users.map(sanitizeUser).filter(Boolean) : [],
    sessions: Array.isArray(rawDatabase?.sessions)
      ? rawDatabase.sessions.map(sanitizeSession).filter(Boolean)
      : [],
    requests: Array.isArray(rawDatabase?.requests)
      ? rawDatabase.requests.map(sanitizeRequest).filter(Boolean)
      : [],
  };
}

function createEmptyDatabase() {
  return {
    users: [],
    sessions: [],
    requests: [],
  };
}

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  ensureDataDirectory();

  if (!fs.existsSync(DATA_FILE)) {
    return createEmptyDatabase();
  }

  try {
    const rawContent = fs.readFileSync(DATA_FILE, "utf8");
    const parsedContent = rawContent ? JSON.parse(rawContent) : {};
    return sanitizeDatabase(parsedContent);
  } catch (_error) {
    return createEmptyDatabase();
  }
}

let db = loadDatabase();

function persistDatabase() {
  ensureDataDirectory();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

persistDatabase();

function listRequestRecords() {
  return Array.isArray(db.requests) ? db.requests.filter(Boolean) : [];
}

function sortRequests(leftRequest, rightRequest) {
  return new Date(rightRequest.createdAt).getTime() - new Date(leftRequest.createdAt).getTime();
}

function getRequests() {
  return listRequestRecords().slice().sort(sortRequests);
}

function getRequestById(requestId) {
  return getRequests().find((request) => request.id === String(requestId)) || null;
}

function getActiveRequestForPassenger(passengerId) {
  const normalizedPassengerId = String(passengerId ?? "").trim();

  if (!normalizedPassengerId) {
    return null;
  }

  return (
    getRequests().find((request) => {
      return request.passenger?.id === normalizedPassengerId && ACTIVE_STATUSES.has(request.status);
    }) || null
  );
}

function getAcceptedRequestForDriver(driverId) {
  const normalizedDriverId = String(driverId ?? "").trim();

  if (!normalizedDriverId) {
    return null;
  }

  return (
    getRequests().find((request) => {
      return request.status === "accepted" && request.driver?.id === normalizedDriverId;
    }) || null
  );
}

function getPendingRequests() {
  return getRequests().filter((request) => request.status === "searching");
}

function getUsers() {
  return Array.isArray(db.users) ? db.users.filter(Boolean) : [];
}

function findUserById(userId) {
  return getUsers().find((user) => user.id === String(userId)) || null;
}

function findUserByEmailAndRole(email, role) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail || !normalizedRole) {
    return null;
  }

  return (
    getUsers().find((user) => user.email === normalizedEmail && user.role === normalizedRole) || null
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function createPasswordDigest(password, salt = crypto.randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: crypto.scryptSync(String(password || ""), salt, 64).toString("hex"),
  };
}

function verifyPassword(password, user) {
  try {
    const rawHash = crypto.scryptSync(String(password || ""), user.passwordSalt, 64);
    const storedHash = Buffer.from(user.passwordHash, "hex");
    return rawHash.length === storedHash.length && crypto.timingSafeEqual(rawHash, storedHash);
  } catch (_error) {
    return false;
  }
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user.id),
    login: String(user.login || "").trim(),
    email: String(user.email || "").trim().toLowerCase(),
    role: normalizeRole(user.role),
    phone: String(user.phone || "").trim(),
    avatar: String(user.avatar || DEFAULT_AVATAR).trim() || DEFAULT_AVATAR,
    profileStatus:
      String(user.profileStatus || "").trim() ||
      STATUS_BY_ROLE[normalizeRole(user.role)] ||
      "Conta ativa",
    recentDestinations: sanitizeRecentDestinations(user.recentDestinations),
  };
}

function toPartyFromUser(user) {
  const publicUser = toPublicUser(user);

  if (!publicUser) {
    return null;
  }

  return {
    id: publicUser.id,
    name: publicUser.login || publicUser.email.split("@")[0] || "Usuario",
    email: publicUser.email,
  };
}

function cleanupExpiredSessions() {
  const now = Date.now();
  const nextSessions = (Array.isArray(db.sessions) ? db.sessions : []).filter((session) => {
    const expiresAtTime = new Date(session.expiresAt).getTime();
    return Number.isFinite(expiresAtTime) && expiresAtTime > now && Boolean(findUserById(session.userId));
  });

  if (nextSessions.length !== db.sessions.length) {
    db.sessions = nextSessions;
    persistDatabase();
  }
}

function createSession(userId) {
  cleanupExpiredSessions();

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const session = {
    token: crypto.randomBytes(32).toString("hex"),
    userId: String(userId),
    createdAt,
    expiresAt,
  };

  db.sessions = (Array.isArray(db.sessions) ? db.sessions : []).filter(
    (currentSession) => currentSession.userId !== session.userId
  );
  db.sessions.push(session);
  persistDatabase();

  return session;
}

function deleteSession(token) {
  const normalizedToken = String(token || "").trim();
  const currentSessions = Array.isArray(db.sessions) ? db.sessions : [];
  const nextSessions = currentSessions.filter((session) => session.token !== normalizedToken);

  if (nextSessions.length !== currentSessions.length) {
    db.sessions = nextSessions;
    persistDatabase();
  }
}

function serializeCookie(name, value, options = {}) {
  const cookieParts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    cookieParts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.expires) {
    cookieParts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  }

  cookieParts.push(`Path=${options.path || "/"}`);

  if (options.httpOnly !== false) {
    cookieParts.push("HttpOnly");
  }

  cookieParts.push(`SameSite=${options.sameSite || "Lax"}`);

  if (options.secure) {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}

function setSessionCookie(res, session) {
  const maxAgeSeconds = Math.floor(
    (new Date(session.expiresAt).getTime() - Date.now()) / 1000
  );

  res.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, session.token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: maxAgeSeconds,
      expires: session.expiresAt,
    })
  );
}

function clearSessionCookie(res) {
  res.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 0,
      expires: new Date(0).toISOString(),
    })
  );
}

function parseCookies(cookieHeader) {
  const headerValue = String(cookieHeader || "").trim();

  if (!headerValue) {
    return {};
  }

  return headerValue.split(";").reduce((cookies, rawPair) => {
    const [name, ...valueParts] = rawPair.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("=") || "");
    return cookies;
  }, {});
}

function getAuthenticatedSession(req) {
  cleanupExpiredSessions();

  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = String(cookies[SESSION_COOKIE_NAME] || "").trim();

  if (!sessionToken) {
    return null;
  }

  const session =
    (Array.isArray(db.sessions) ? db.sessions : []).find(
      (currentSession) => currentSession.token === sessionToken
    ) || null;

  if (!session) {
    return null;
  }

  const user = findUserById(session.userId);

  if (!user) {
    deleteSession(sessionToken);
    return null;
  }

  return {
    session,
    user,
  };
}

function attachCurrentUser(req, _res, next) {
  const authenticatedSession = getAuthenticatedSession(req);

  req.currentSession = authenticatedSession?.session || null;
  req.currentUserRecord = authenticatedSession?.user || null;
  req.currentUser = authenticatedSession ? toPublicUser(authenticatedSession.user) : null;

  next();
}

function requireAuthenticatedUser(req, res, next) {
  if (!req.currentUserRecord || !req.currentSession) {
    clearSessionCookie(res);
    res.status(401).json({ ok: false, message: "Sessao expirada. Faca login novamente." });
    return;
  }

  next();
}

function createUser(rawUserData) {
  const role = normalizeRole(rawUserData?.role);
  const login = String(rawUserData?.login || rawUserData?.name || "").trim();
  const email = String(rawUserData?.email || "").trim().toLowerCase();
  const password = String(rawUserData?.password || "");

  if (!role) {
    return {
      ok: false,
      status: 400,
      message: "Tipo de conta invalido.",
    };
  }

  if (login.length < 2) {
    return {
      ok: false,
      status: 400,
      message: "Informe um nome valido.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      status: 400,
      message: "Informe um e-mail valido.",
    };
  }

  if (password.length < 4) {
    return {
      ok: false,
      status: 400,
      message: "A senha deve ter pelo menos 4 caracteres.",
    };
  }

  if (findUserByEmailAndRole(email, role)) {
    return {
      ok: false,
      status: 409,
      message: "Este e-mail ja esta cadastrado para esse acesso.",
    };
  }

  const passwordDigest = createPasswordDigest(password);
  const user = sanitizeUser({
    id: crypto.randomUUID(),
    login,
    email,
    role,
    phone: "",
    avatar: DEFAULT_AVATAR,
    profileStatus: STATUS_BY_ROLE[role] || "Conta ativa",
    recentDestinations: [],
    passwordHash: passwordDigest.hash,
    passwordSalt: passwordDigest.salt,
  });

  db.users = [...getUsers(), user];
  persistDatabase();

  return {
    ok: true,
    status: 201,
    user: toPublicUser(user),
  };
}

function authenticateUser(rawCredentials) {
  const role = normalizeRole(rawCredentials?.role);
  const email = String(rawCredentials?.email || "").trim().toLowerCase();
  const password = String(rawCredentials?.password || "");

  if (!role || !email || !password) {
    return {
      ok: false,
      status: 400,
      message: "Informe e-mail, senha e tipo de acesso.",
    };
  }

  const user = findUserByEmailAndRole(email, role);

  if (!user || !verifyPassword(password, user)) {
    return {
      ok: false,
      status: 401,
      message: "E-mail ou senha incorretos.",
    };
  }

  return {
    ok: true,
    status: 200,
    user,
  };
}

function updateUser(userId, rawUpdates) {
  const currentUser = findUserById(userId);

  if (!currentUser) {
    return {
      ok: false,
      status: 404,
      message: "Usuario nao encontrado.",
    };
  }

  const nextEmail =
    rawUpdates?.email !== undefined
      ? String(rawUpdates.email || "").trim().toLowerCase()
      : currentUser.email;
  const nextLogin =
    rawUpdates?.login !== undefined
      ? String(rawUpdates.login || "").trim()
      : currentUser.login;

  if (!nextLogin || nextLogin.length < 2) {
    return {
      ok: false,
      status: 400,
      message: "Informe um nome valido.",
    };
  }

  if (!isValidEmail(nextEmail)) {
    return {
      ok: false,
      status: 400,
      message: "Informe um e-mail valido.",
    };
  }

  const hasDuplicateEmail = getUsers().some((user) => {
    return user.email === nextEmail && user.role === currentUser.role && user.id !== currentUser.id;
  });

  if (hasDuplicateEmail) {
    return {
      ok: false,
      status: 409,
      message: "Este e-mail ja esta em uso para esse tipo de conta.",
    };
  }

  const updatedUser = sanitizeUser({
    ...currentUser,
    login: nextLogin,
    email: nextEmail,
    phone:
      rawUpdates?.phone !== undefined ? String(rawUpdates.phone || "").trim() : currentUser.phone,
    avatar:
      rawUpdates?.avatar !== undefined
        ? String(rawUpdates.avatar || "").trim() || DEFAULT_AVATAR
        : currentUser.avatar,
    profileStatus:
      rawUpdates?.profileStatus !== undefined
        ? String(rawUpdates.profileStatus || "").trim()
        : currentUser.profileStatus,
    recentDestinations:
      rawUpdates?.recentDestinations !== undefined
        ? sanitizeRecentDestinations(rawUpdates.recentDestinations)
        : currentUser.recentDestinations,
    passwordHash: currentUser.passwordHash,
    passwordSalt: currentUser.passwordSalt,
  });

  db.users = getUsers().map((user) => (user.id === updatedUser.id ? updatedUser : user));
  persistDatabase();

  return {
    ok: true,
    status: 200,
    user: toPublicUser(updatedUser),
  };
}

function upsertRequest(rawRequest) {
  const nextRequest = sanitizeRequest({
    ...rawRequest,
    updatedAt: new Date().toISOString(),
  });

  if (!nextRequest) {
    return {
      ok: false,
      status: 400,
      message: "Dados invalidos para a solicitacao.",
    };
  }

  const activeRequest = getActiveRequestForPassenger(nextRequest.passenger.id);

  if (
    activeRequest &&
    activeRequest.id !== nextRequest.id &&
    ACTIVE_STATUSES.has(nextRequest.status)
  ) {
    return {
      ok: false,
      status: 409,
      message: "Este passageiro ja possui uma solicitacao ativa.",
    };
  }

  const requests = listRequestRecords().slice();
  const existingIndex = requests.findIndex((request) => request.id === nextRequest.id);

  if (existingIndex >= 0) {
    requests[existingIndex] = nextRequest;
  } else {
    requests.push(nextRequest);
  }

  db.requests = requests;
  persistDatabase();

  return {
    ok: true,
    status: 200,
    request: nextRequest,
  };
}

function cancelRequest(requestId, actor) {
  const requests = listRequestRecords().slice();
  const requestIndex = requests.findIndex((request) => request.id === String(requestId));

  if (requestIndex < 0) {
    return {
      ok: false,
      status: 404,
      message: "Solicitacao nao encontrada.",
    };
  }

  const currentRequest = requests[requestIndex];

  if (!ACTIVE_STATUSES.has(currentRequest.status)) {
    return {
      ok: false,
      status: 400,
      message: "Esta solicitacao nao esta mais ativa.",
    };
  }

  requests[requestIndex] = sanitizeRequest({
    ...currentRequest,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelledBy: sanitizeParty(actor),
    updatedAt: new Date().toISOString(),
  });

  db.requests = requests;
  persistDatabase();

  return {
    ok: true,
    status: 200,
    request: requests[requestIndex],
  };
}

function acceptRequest(requestId, driver) {
  const normalizedDriver = sanitizeParty(driver);

  if (!normalizedDriver) {
    return {
      ok: false,
      status: 400,
      message: "Motorista invalido.",
    };
  }

  const activeTrip = getAcceptedRequestForDriver(normalizedDriver.id);

  if (activeTrip && activeTrip.id !== String(requestId)) {
    return {
      ok: false,
      status: 409,
      message: "Voce ja possui uma solicitacao aceita.",
    };
  }

  const requests = listRequestRecords().slice();
  const requestIndex = requests.findIndex((request) => request.id === String(requestId));

  if (requestIndex < 0) {
    return {
      ok: false,
      status: 404,
      message: "Solicitacao nao encontrada.",
    };
  }

  const currentRequest = requests[requestIndex];

  if (currentRequest.status !== "searching") {
    return {
      ok: false,
      status: 400,
      message: "Esta solicitacao nao esta mais disponivel.",
    };
  }

  requests[requestIndex] = sanitizeRequest({
    ...currentRequest,
    status: "accepted",
    driver: normalizedDriver,
    acceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.requests = requests;
  persistDatabase();

  return {
    ok: true,
    status: 200,
    request: requests[requestIndex],
  };
}

function registerAuthApi(app) {
  app.post("/api/auth/register", (req, res) => {
    const result = createUser(req.body);

    if (!result.ok) {
      res.status(result.status).json({ ok: false, message: result.message });
      return;
    }

    res.status(result.status).json({ ok: true, user: result.user });
  });

  app.post("/api/auth/login", (req, res) => {
    const result = authenticateUser(req.body);

    if (!result.ok) {
      clearSessionCookie(res);
      res.status(result.status).json({ ok: false, message: result.message });
      return;
    }

    const session = createSession(result.user.id);
    setSessionCookie(res, session);
    res.json({ ok: true, user: toPublicUser(result.user) });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.currentUserRecord || !req.currentSession) {
      clearSessionCookie(res);
      res.status(401).json({ ok: false, message: "Nenhuma sessao ativa." });
      return;
    }

    res.json({ ok: true, user: toPublicUser(req.currentUserRecord) });
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.currentSession?.token) {
      deleteSession(req.currentSession.token);
    }

    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get("/api/users/me", requireAuthenticatedUser, (req, res) => {
    res.json({ ok: true, user: toPublicUser(req.currentUserRecord) });
  });

  app.patch("/api/users/me", requireAuthenticatedUser, (req, res) => {
    const result = updateUser(req.currentUserRecord.id, req.body);

    if (!result.ok) {
      res.status(result.status).json({ ok: false, message: result.message });
      return;
    }

    res.json({ ok: true, user: result.user });
  });
}

function registerTripRequestApi(app) {
  app.get("/api/requests", (req, res) => {
    if (req.query.status === "searching") {
      res.json(getPendingRequests());
      return;
    }

    res.json(getRequests());
  });

  app.get("/api/requests/:id", (req, res) => {
    const request = getRequestById(req.params.id);

    if (!request) {
      res.status(404).json({ ok: false, message: "Solicitacao nao encontrada." });
      return;
    }

    res.json(request);
  });

  app.get("/api/requests/passenger/:passengerId/active", (req, res) => {
    res.json(getActiveRequestForPassenger(req.params.passengerId));
  });

  app.get("/api/requests/driver/:driverId/accepted", (req, res) => {
    res.json(getAcceptedRequestForDriver(req.params.driverId));
  });

  app.post("/api/requests", (req, res) => {
    if (req.currentUserRecord && normalizeRole(req.currentUserRecord.role) !== "passenger") {
      res.status(403).json({
        ok: false,
        message: "Apenas passageiros podem abrir solicitacoes autenticadas.",
      });
      return;
    }

    const payload =
      req.currentUser?.role === "passenger"
        ? {
            ...req.body,
            passenger: toPartyFromUser(req.currentUserRecord),
          }
        : req.body;
    const result = upsertRequest(payload);

    if (!result.ok) {
      res.status(result.status).json({ ok: false, message: result.message });
      return;
    }

    res.json(result.request);
  });

  app.post("/api/requests/:id/cancel", (req, res) => {
    const actor = req.currentUserRecord ? toPartyFromUser(req.currentUserRecord) : req.body?.actor;
    const result = cancelRequest(req.params.id, actor);
    res.status(result.status).json(result.ok ? result : { ok: false, message: result.message });
  });

  app.post("/api/requests/:id/accept", (req, res) => {
    if (req.currentUserRecord && normalizeRole(req.currentUserRecord.role) !== "driver") {
      res.status(403).json({
        ok: false,
        message: "Apenas motoristas podem aceitar solicitacoes.",
      });
      return;
    }

    const driver =
      req.currentUserRecord && normalizeRole(req.currentUserRecord.role) === "driver"
        ? toPartyFromUser(req.currentUserRecord)
        : req.body?.driver;
    const result = acceptRequest(req.params.id, driver);
    res.status(result.status).json(result.ok ? result : { ok: false, message: result.message });
  });
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(attachCurrentUser);

  app.use(
    "/assets",
    express.static(ASSETS_DIR, {
      extensions: false,
      index: false,
    })
  );

  registerAuthApi(app);
  registerTripRequestApi(app);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      pages: pageRegistry.length,
      users: getUsers().length,
      requests: getRequests().length,
    });
  });

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    const resolvedRequest = resolvePageRequest(req.path);

    if (!resolvedRequest) {
      next();
      return;
    }

    if (resolvedRequest.type === "redirect") {
      res.redirect(302, resolvedRequest.canonicalRoute);
      return;
    }

    sendHtml(resolvedRequest.filePath, res);
  });

  app.use((_req, res) => {
    res.status(404).send("Pagina nao encontrada.");
  });

  return app;
}

const app = createApp();

function startServer(port = PORT) {
  return app.listen(port, "0.0.0.0", () => {
    console.log(
      `Servidor rodando em http://localhost:${port} com ${pageRegistry.length} paginas registradas.`
    );
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  DATA_FILE,
  app,
  createApp,
  pageRegistry,
  startServer,
};
