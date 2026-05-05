document.addEventListener("DOMContentLoaded", () => {
  const SUPPORT_LABELS = {
    embarque: "Apoio para embarque",
    cadeira: "Levar cadeira dobravel",
    acompanhante: "Viajar com acompanhante",
    "sem-apoio": "Sem apoio adicional",
  };

  const defaultLocation = [-23.55052, -46.633308];
  const auth = window.SumusAuth;
  const tripStore = window.SumusTripRequests;

  const elements = {
    gpsToggle: document.getElementById("gps-toggle"),
    gpsStatusText: document.getElementById("gps-status-text"),
    gpsPulseContainer: document.getElementById("gps-pulse-container"),
    recenterMapButton: document.getElementById("recenter-map"),
    requestBadge: document.getElementById("driver-request-badge"),
    requestSummary: document.getElementById("driver-request-summary"),
    requestFeedback: document.getElementById("driver-request-feedback"),
    requestEmpty: document.getElementById("driver-request-empty"),
    requestCard: document.getElementById("driver-request-card"),
    requestStateLabel: document.getElementById("driver-request-state-label"),
    requestStateBadge: document.getElementById("driver-request-state-badge"),
    requestPassenger: document.getElementById("driver-request-passenger"),
    requestRoute: document.getElementById("driver-request-route"),
    requestDistance: document.getElementById("driver-request-distance"),
    requestDuration: document.getElementById("driver-request-duration"),
    requestPrice: document.getElementById("driver-request-price"),
    requestSupport: document.getElementById("driver-request-support"),
    requestTime: document.getElementById("driver-request-time"),
    requestNotes: document.getElementById("driver-request-notes"),
    acceptButton: document.getElementById("accept-trip-request"),
  };

  const state = {
    isGpsActive: true,
    map: null,
    driverMarker: null,
    requestLayer: null,
    visibleRequest: null,
  };

  function getDriverIdentity() {
    const currentDriver = auth?.getSessionForRole("driver");

    if (!currentDriver) return null;

    return {
      id: String(currentDriver.id),
      name: auth.getDisplayName(currentDriver),
      email: currentDriver.email,
    };
  }

  function setFeedback(message, type) {
    elements.requestFeedback.textContent = message || "";

    if (type) {
      elements.requestFeedback.dataset.state = type;
      return;
    }

    delete elements.requestFeedback.dataset.state;
  }

  function formatPendingCount(count) {
    const suffix = count === 1 ? "pendente" : "pendentes";
    return `${count} ${suffix}`;
  }

  function formatRequestTime(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  function createRequestMarker(coords, type) {
    return window.L.marker(coords, {
      icon: window.L.divIcon({
        className: `driver-trip-marker driver-trip-marker--${type}`,
        html: '<span class="driver-trip-marker__dot"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    });
  }

  function drawRequestRoute(request) {
    if (!state.requestLayer) return;

    state.requestLayer.clearLayers();

    if (!request?.origin?.coords || !request?.destination?.coords) return;

    createRequestMarker(request.origin.coords, "origin").addTo(state.requestLayer);
    createRequestMarker(request.destination.coords, "destination").addTo(state.requestLayer);

    const geometry = Array.isArray(request.route?.geometry) && request.route.geometry.length > 1
      ? request.route.geometry
      : [request.origin.coords, request.destination.coords];

    const routeLine = window.L.polyline(geometry, {
      color: request.route?.approximate ? "#0f766e" : "#00685a",
      weight: 5,
      opacity: 0.84,
      lineJoin: "round",
      dashArray: request.route?.approximate ? "10 10" : "",
    });

    routeLine.addTo(state.requestLayer);
    state.map.fitBounds(routeLine.getBounds(), {
      padding: [48, 48],
      animate: true,
    });
  }

  // AGORA É ASSÍNCRONO
  async function getDriverDashboardState() {
    const driver = getDriverIdentity();
    const acceptedRequest = driver && tripStore
      ? await tripStore.getAcceptedRequestForDriver(driver.id)
      : null;
    const pendingRequests = tripStore ? await tripStore.getPendingRequests() : [];
    const visibleRequest = acceptedRequest || pendingRequests[0] || null;

    return {
      acceptedRequest,
      pendingRequests,
      visibleRequest,
    };
  }

  // AGORA É ASSÍNCRONO
  async function renderRequestCard() {
    const { acceptedRequest, pendingRequests, visibleRequest } = await getDriverDashboardState();
    const hasAcceptedRequest = Boolean(acceptedRequest);

    state.visibleRequest = visibleRequest;
    elements.requestBadge.textContent = formatPendingCount(pendingRequests.length);

    if (!visibleRequest) {
      elements.requestCard.hidden = true;
      elements.requestEmpty.hidden = false;
      elements.requestSummary.textContent =
        state.isGpsActive
          ? "Fique online para receber solicitacoes de passageiros em tempo real."
          : "Voce esta offline. Ative o GPS para voltar a receber solicitacoes.";
      drawRequestRoute(null);
      return;
    }

    elements.requestCard.hidden = false;
    elements.requestEmpty.hidden = true;

    elements.requestStateLabel.textContent = hasAcceptedRequest
      ? "Corrida aceita"
      : "Nova solicitacao";
    elements.requestStateBadge.textContent = hasAcceptedRequest ? "Em rota" : "Aguardando";
    elements.requestPassenger.textContent = visibleRequest.passenger?.name || "Passageiro";
    elements.requestRoute.textContent =
      `${visibleRequest.origin.address} -> ${visibleRequest.destination.address}`;
    elements.requestDistance.textContent =
      visibleRequest.estimate?.distanceLabel || "Distancia indisponivel";
    elements.requestDuration.textContent =
      visibleRequest.estimate?.durationLabel || "Tempo indisponivel";
    elements.requestPrice.textContent =
      visibleRequest.estimate?.fareLabel || "Valor indisponivel";
    elements.requestSupport.textContent =
      SUPPORT_LABELS[visibleRequest.support] || "Sem apoio informado";
    elements.requestTime.textContent = hasAcceptedRequest
      ? `Aceita as ${formatRequestTime(visibleRequest.acceptedAt || visibleRequest.updatedAt)}`
      : `Solicitada as ${formatRequestTime(visibleRequest.createdAt)}`;
    elements.requestNotes.textContent = visibleRequest.notes
      ? `Obs.: ${visibleRequest.notes}`
      : "Sem observacoes adicionais.";

    elements.acceptButton.hidden = hasAcceptedRequest;
    elements.acceptButton.disabled = !state.isGpsActive;
    elements.acceptButton.textContent = state.isGpsActive
      ? "Aceitar solicitacao"
      : "Fique online para aceitar";

    if (hasAcceptedRequest) {
      elements.requestSummary.textContent =
        "Esta corrida ja foi vinculada a voce. Use o mapa para seguir ate a origem.";
    } else if (state.isGpsActive) {
      elements.requestSummary.textContent =
        "Ha uma solicitacao aguardando aceite. Revise o trajeto antes de confirmar.";
    } else {
      elements.requestSummary.textContent =
        "Ha solicitacoes disponiveis, mas voce precisa ficar online para aceitar.";
    }

    drawRequestRoute(visibleRequest);
  }

  function setGpsState(active) {
    state.isGpsActive = active;
    elements.gpsToggle.setAttribute("aria-checked", String(active));
    elements.gpsToggle.classList.toggle("gps-toggle--active", active);
    elements.gpsToggle.classList.toggle("gps-toggle--inactive", !active);
    elements.gpsStatusText.textContent = active ? "Online" : "Offline";

    elements.gpsPulseContainer.innerHTML = active
      ? '<span class="gps-status__pulse-ring"></span><span class="gps-status__pulse-dot"></span>'
      : '<span class="gps-status__pulse-dot gps-status__pulse-dot--inactive"></span>';

    renderRequestCard();
  }

  function initializeMap() {
    const driverMap = window.L.map("driver-map", {
      zoomControl: false,
    }).setView(defaultLocation, 14);

    window.L.control.zoom({ position: "bottomright" }).addTo(driverMap);

    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(driverMap);

    driverMap.attributionControl.setPrefix("");

    state.map = driverMap;
    state.driverMarker = window.L.marker(defaultLocation).addTo(driverMap);
    state.requestLayer = window.L.layerGroup().addTo(driverMap);
  }

  function bindEvents() {
    elements.gpsToggle.addEventListener("click", () => {
      setGpsState(!state.isGpsActive);
    });

    elements.recenterMapButton.addEventListener("click", () => {
      state.map.setView(state.driverMarker.getLatLng(), 16, { animate: true });
    });

    // AGORA É ASSÍNCRONO
    elements.acceptButton.addEventListener("click", async () => {
      const driver = getDriverIdentity();

      if (!driver || !tripStore || !state.visibleRequest) {
        setFeedback("Nao foi possivel localizar a solicitacao selecionada.", "error");
        return;
      }

      if (!state.isGpsActive) {
        setFeedback("Fique online para aceitar a corrida.", "error");
        return;
      }

      const result = await tripStore.acceptRequest(state.visibleRequest.id, driver);

      if (!result.ok) {
        setFeedback(result.message, "error");
        await renderRequestCard();
        return;
      }

      setFeedback("Solicitacao aceita. O passageiro ja pode ver seu aceite.", "success");
      await renderRequestCard();
    });
  }

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        state.driverMarker.setLatLng(userLocation);

        if (!state.visibleRequest) {
          state.map.setView(userLocation, 16);
        }
      },
      () => {
        state.map.setView(defaultLocation, 14);
      }
    );
  }

  initializeMap();
  bindEvents();
  renderRequestCard();
  requestCurrentLocation();

  // POLLING: Busca viagens do servidor a cada 5 segundos para manter a tela atualizada
  setInterval(() => {
    if (state.isGpsActive) {
      renderRequestCard();
    }
  }, 5000);
});
