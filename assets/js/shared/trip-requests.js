(function attachSumusTripRequests(window) {
  
  async function getRequests() {
    const response = await fetch('/api/requests');
    return await response.json();
  }

  async function getPendingRequests() {
    const response = await fetch('/api/requests?status=searching');
    return await response.json();
  }

  async function getRequestById(requestId) {
    const response = await fetch(`/api/requests/${requestId}`);
    return await response.json();
  }

  // Busca uma solicitação ativa específica para um passageiro
  async function getActiveRequestForPassenger(passengerId) {
    const response = await fetch(`/api/requests/passenger/${passengerId}/active`);
    return await response.json();
  }

  // Busca uma viagem aceita para um motorista específico
  async function getAcceptedRequestForDriver(driverId) {
    const response = await fetch(`/api/requests/driver/${driverId}/accepted`);
    return await response.json();
  }

  async function upsertRequest(rawRequest) {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawRequest)
    });
    return await response.json();
  }

  async function cancelRequest(requestId, actor) {
    const response = await fetch(`/api/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor })
    });
    return await response.json();
  }

  async function acceptRequest(requestId, driver) {
    const response = await fetch(`/api/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver })
    });
    return await response.json();
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
