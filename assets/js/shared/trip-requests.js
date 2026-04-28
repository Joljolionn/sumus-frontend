(function attachSumusTripRequests(window) {
  const REQUESTS_KEY = "sumus-trip-requests";
  const ACTIVE_STATUSES = new Set(["searching", "accepted"]);

  function readJson(key, fallbackValue) {
    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
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

    const coords = Array.isArray(rawPlace.coords) && rawPlace.coords.length === 2
      ? rawPlace.coords.map((value) => Number(value))
      : null;

    return {
      id: String(rawPlace.id || `place-${Date.now()}`),
      label: String(rawPlace.label || rawPlace.address || "Ponto"),
      address: String(rawPlace.address || rawPlace.label || "Ponto"),
      coords:
        coords && coords.every((value) => Number.isFinite(value))
          ? coords
          : null,
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
    const requests = readJson(REQUESTS_KEY, []);

    return Array.isArray(requests)
      ? requests.map(sanitizeRequest).filter(Boolean).sort(sortRequests)
      : [];
  }

  function saveRequests(requests) {
    const normalizedRequests = Array.isArray(requests)
      ? requests.map(sanitizeRequest).filter(Boolean).sort(sortRequests)
      : [];

    writeJson(REQUESTS_KEY, normalizedRequests);
    return normalizedRequests;
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
        return (
          request.passenger?.id === normalizedPassengerId &&
          ACTIVE_STATUSES.has(request.status)
        );
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

    saveRequests(requests);
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

    saveRequests(requests);

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

    saveRequests(requests);

    return {
      ok: true,
      request: requests[requestIndex],
    };
  }

  window.SumusTripRequests = {
    REQUESTS_KEY,
    acceptRequest,
    cancelRequest,
    getAcceptedRequestForDriver,
    getActiveRequestForPassenger,
    getPendingRequests,
    getRequestById,
    getRequests,
    upsertRequest,
  };
})(window);
