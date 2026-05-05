const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config({ quiet: true });

const ROOT_DIR = __dirname;
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");
const LANDING_PAGE = path.join(ROOT_DIR, "index.html");
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const NAVIGATION_SCRIPT_TAG = '<script src="/assets/js/shared/navigation.js"></script>';
const ACTIVE_STATUSES = new Set(["searching", "accepted"]);

let dbRequests = [];

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
  if (!rawParty) return null;

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
  if (!rawPlace) return null;

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

function sanitizeEstimate(rawEstimate) {
  if (!rawEstimate) return null;

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
  if (!rawRoute) return null;

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
  if (!rawRequest) return null;

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

function sortRequests(leftRequest, rightRequest) {
  return new Date(rightRequest.createdAt).getTime() - new Date(leftRequest.createdAt).getTime();
}

function getRequests() {
  return Array.isArray(dbRequests) ? dbRequests.filter(Boolean).sort(sortRequests) : [];
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

function upsertRequest(rawRequest) {
  const nextRequest = sanitizeRequest({
    ...rawRequest,
    updatedAt: new Date().toISOString(),
  });

  if (!nextRequest) {
    return null;
  }

  const requests = getRequests();
  const existingIndex = requests.findIndex((request) => request.id === nextRequest.id);

  if (existingIndex >= 0) {
    requests[existingIndex] = nextRequest;
  } else {
    requests.push(nextRequest);
  }

  dbRequests = requests;
  return nextRequest;
}

function cancelRequest(requestId, actor) {
  const requests = getRequests();
  const requestIndex = requests.findIndex((request) => request.id === String(requestId));

  if (requestIndex < 0) {
    return {
      ok: false,
      message: "Solicitacao nao encontrada.",
    };
  }

  const currentRequest = requests[requestIndex];

  if (!ACTIVE_STATUSES.has(currentRequest.status)) {
    return {
      ok: false,
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

  dbRequests = requests;

  return {
    ok: true,
    request: requests[requestIndex],
  };
}

function acceptRequest(requestId, driver) {
  const normalizedDriver = sanitizeParty(driver);

  if (!normalizedDriver) {
    return {
      ok: false,
      message: "Motorista invalido.",
    };
  }

  const activeTrip = getAcceptedRequestForDriver(normalizedDriver.id);

  if (activeTrip && activeTrip.id !== String(requestId)) {
    return {
      ok: false,
      message: "Voce ja possui uma solicitacao aceita.",
    };
  }

  const requests = getRequests();
  const requestIndex = requests.findIndex((request) => request.id === String(requestId));

  if (requestIndex < 0) {
    return {
      ok: false,
      message: "Solicitacao nao encontrada.",
    };
  }

  const currentRequest = requests[requestIndex];

  if (currentRequest.status !== "searching") {
    return {
      ok: false,
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

  dbRequests = requests;

  return {
    ok: true,
    request: requests[requestIndex],
  };
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
    const request = upsertRequest(req.body);

    if (!request) {
      res.status(400).json({ ok: false, message: "Dados invalidos para a solicitacao." });
      return;
    }

    res.json(request);
  });

  app.post("/api/requests/:id/cancel", (req, res) => {
    const result = cancelRequest(req.params.id, req.body?.actor);
    res.status(result.ok ? 200 : 400).json(result);
  });

  app.post("/api/requests/:id/accept", (req, res) => {
    const result = acceptRequest(req.params.id, req.body?.driver);
    res.status(result.ok ? 200 : 400).json(result);
  });
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.use(
    "/assets",
    express.static(ASSETS_DIR, {
      extensions: false,
      index: false,
    })
  );

  registerTripRequestApi(app);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      pages: pageRegistry.length,
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
  app,
  createApp,
  pageRegistry,
  startServer,
};
