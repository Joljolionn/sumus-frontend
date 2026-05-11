(function attachSumusTripRequests(window) {
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
      return payload || { ok: false, message: "Nao foi possivel concluir a operacao." };
    }

    return payload;
  }

  async function getRequests() {
    return await requestJson("/api/requests");
  }

  async function getPendingRequests() {
    return await requestJson("/api/requests?status=searching");
  }

  async function getRequestById(requestId) {
    return await requestJson(`/api/requests/${requestId}`);
  }

  async function getActiveRequestForPassenger(passengerId) {
    return await requestJson(`/api/requests/passenger/${passengerId}/active`);
  }

  async function getAcceptedRequestForDriver(driverId) {
    return await requestJson(`/api/requests/driver/${driverId}/accepted`);
  }

  async function upsertRequest(rawRequest) {
    return await requestJson("/api/requests", {
      method: "POST",
      body: JSON.stringify(rawRequest),
    });
  }

  async function cancelRequest(requestId, actor) {
    return await requestJson(`/api/requests/${requestId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ actor }),
    });
  }

  async function acceptRequest(requestId, driver) {
    return await requestJson(`/api/requests/${requestId}/accept`, {
      method: "POST",
      body: JSON.stringify({ driver }),
    });
  }

  window.SumusTripRequests = {
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
