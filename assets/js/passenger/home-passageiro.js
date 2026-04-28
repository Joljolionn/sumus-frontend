document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEYS = {
    activeRequest: "sumus-passenger-active-request",
    recentDestinations: "sumus-passenger-recent-destinations",
  };

  const SUPPORT_LABELS = {
    embarque: "Apoio para embarque",
    cadeira: "Levar cadeira dobravel",
    acompanhante: "Viajar com acompanhante",
    "sem-apoio": "Sem apoio adicional",
  };

  const SUPPORT_SURCHARGE = {
    embarque: 4,
    cadeira: 6,
    acompanhante: 3,
    "sem-apoio": 0,
  };

  const ROUTE_BADGES = {
    idle: "Defina os pontos",
    locating: "Validando endereco",
    loading: "Calculando rota",
    ready: "Rota pronta",
    fallback: "Rota aproximada",
    error: "Endereco incompleto",
  };

  const defaultLocation = [-23.55052, -46.633308];
  const auth = window.SumusAuth;
  const tripStore = window.SumusTripRequests;
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const defaultPlaces = [
    {
      id: "home",
      label: "Casa",
      address: "Rua das Flores, 123 - Bela Vista",
      coords: [-23.561399, -46.655881],
      icon: "home",
      tag: "Favorito",
    },
    {
      id: "work",
      label: "Trabalho",
      address: "Av. Paulista, 1578 - Bela Vista",
      coords: [-23.561684, -46.656139],
      icon: "work",
      tag: "Favorito",
    },
    {
      id: "clinic",
      label: "Clinica",
      address: "Rua Augusta, 2400 - Cerqueira Cesar",
      coords: [-23.556044, -46.664308],
      icon: "medical_services",
      tag: "Saude",
    },
    {
      id: "hospital",
      label: "Hospital",
      address: "Rua Frei Caneca, 735 - Consolacao",
      coords: [-23.550691, -46.651311],
      icon: "local_hospital",
      tag: "Atendimento",
    },
  ];

  const elements = {
    originInput: document.getElementById("trip-origin"),
    destinationInput: document.getElementById("trip-destination"),
    supportSelect: document.getElementById("trip-support"),
    notesInput: document.getElementById("trip-notes"),
    form: document.getElementById("trip-request-form"),
    swapButton: document.getElementById("swap-trip-points"),
    useCurrentLocationButton: document.getElementById("use-current-location"),
    fillDemoRouteButton: document.getElementById("fill-demo-route"),
    recenterMapButton: document.getElementById("recenter-passenger-map"),
    clearRouteButton: document.getElementById("clear-passenger-route"),
    distanceValue: document.getElementById("trip-distance"),
    durationValue: document.getElementById("trip-duration"),
    fareValue: document.getElementById("trip-fare"),
    statusBadge: document.getElementById("trip-status-badge"),
    previewOrigin: document.getElementById("preview-origin"),
    previewDestination: document.getElementById("preview-destination"),
    feedback: document.getElementById("trip-feedback"),
    submitButton: document.getElementById("trip-submit"),
    suggestions: document.getElementById("trip-suggestions"),
    recentDestinations: document.getElementById("recent-destinations"),
    clearRecentsButton: document.getElementById("clear-recent-places"),
    activeRequestCard: document.getElementById("active-request-card"),
    activeRequestTitle: document.getElementById("active-request-title"),
    activeRequestStatus: document.getElementById("active-request-status"),
    activeRequestRoute: document.getElementById("active-request-route"),
    activeRequestTime: document.getElementById("active-request-time"),
    activeRequestPrice: document.getElementById("active-request-price"),
    activeRequestSupport: document.getElementById("active-request-support"),
    activeRequestDriver: document.getElementById("active-request-driver"),
    activeRequestNotes: document.getElementById("active-request-notes"),
    cancelActiveRequestButton: document.getElementById("cancel-active-request"),
    fieldControls: Array.from(document.querySelectorAll(".field-group__control")),
  };

  const state = {
    activeField: "destination",
    currentLocation: null,
    origin: null,
    destination: null,
    map: null,
    routeLayer: null,
    recentPlaces: readJson(STORAGE_KEYS.recentDestinations, []),
    searchPlaces: [],
    routeData: null,
    routeStatus: "idle",
    routeSyncToken: 0,
    suggestionTimers: {
      origin: 0,
      destination: 0,
    },
    suggestionControllers: {
      origin: null,
      destination: null,
    },
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clonePlace(rawPlace) {
    if (!rawPlace) return null;

    return {
      id: rawPlace.id || `place-${Date.now()}`,
      label: rawPlace.label || rawPlace.address || "Ponto",
      address: rawPlace.address || rawPlace.label || "Ponto",
      coords: Array.isArray(rawPlace.coords) ? [...rawPlace.coords] : null,
      icon: rawPlace.icon || "place",
      tag: rawPlace.tag || "",
    };
  }

  function cloneRouteData(rawRouteData) {
    if (!rawRouteData) return null;

    return {
      geometry: Array.isArray(rawRouteData.geometry)
        ? rawRouteData.geometry.map((point) => [...point])
        : [],
      distanceMeters: Number(rawRouteData.distanceMeters) || 0,
      durationSeconds: Number(rawRouteData.durationSeconds) || 0,
      approximate: Boolean(rawRouteData.approximate),
      source: rawRouteData.source || "",
    };
  }

  function getQuickPlaces() {
    const uniquePlaces = new Map();

    [...state.recentPlaces, ...defaultPlaces].forEach((rawPlace) => {
      const place = clonePlace(rawPlace);

      if (!place) {
        return;
      }

      const key = normalizeText(getPlaceDisplay(place));

      if (!key || uniquePlaces.has(key)) {
        return;
      }

      uniquePlaces.set(key, place);
    });

    return [...uniquePlaces.values()];
  }

  function getAllPlaces() {
    const uniquePlaces = new Map();

    [...state.searchPlaces, ...getQuickPlaces()].forEach((rawPlace) => {
      const place = clonePlace(rawPlace);

      if (!place) {
        return;
      }

      const key = normalizeText(getPlaceDisplay(place));

      if (!key || uniquePlaces.has(key)) {
        return;
      }

      uniquePlaces.set(key, place);
    });

    return [...uniquePlaces.values()];
  }

  function getPlaceDisplay(place) {
    if (!place) return "";
    return place.address || place.label || "";
  }

  function setFeedback(message, type) {
    elements.feedback.textContent = message || "";

    if (type) {
      elements.feedback.dataset.state = type;
      return;
    }

    delete elements.feedback.dataset.state;
  }

  function setActiveField(fieldName) {
    state.activeField = fieldName;

    elements.fieldControls.forEach((control) => {
      control.classList.toggle(
        "field-group__control--active",
        control.dataset.field === fieldName
      );
    });
  }

  function getInputForField(fieldName) {
    return fieldName === "origin" ? elements.originInput : elements.destinationInput;
  }

  function serializePlace(place) {
    if (!place) return null;

    return {
      id: place.id,
      label: place.label,
      address: place.address,
      coords: Array.isArray(place.coords) ? [...place.coords] : null,
      icon: place.icon || "place",
      tag: place.tag || "",
    };
  }

  function getPassengerIdentity() {
    const currentPassenger = auth?.getSessionForRole("passenger");

    if (!currentPassenger) {
      return null;
    }

    return {
      id: String(currentPassenger.id),
      name: auth.getDisplayName(currentPassenger),
      email: currentPassenger.email,
    };
  }

  function resolveKnownPlace(value) {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      return null;
    }

    return (
      getAllPlaces().find((place) => {
        return [
          place.label,
          place.address,
          `${place.label} ${place.address}`,
        ].some((textValue) => normalizeText(textValue) === normalizedValue);
      }) || null
    );
  }

  function buildPlaceFromValue(fieldName, rawValue) {
    const trimmedValue = String(rawValue || "").trim();

    if (!trimmedValue) {
      return null;
    }

    const resolvedPlace = resolveKnownPlace(trimmedValue);

    if (resolvedPlace) {
      return clonePlace(resolvedPlace);
    }

    return {
      id: `${fieldName}-custom-${Date.now()}`,
      label: fieldName === "origin" ? "Origem personalizada" : "Destino personalizado",
      address: trimmedValue,
      coords: null,
      icon: fieldName === "origin" ? "trip_origin" : "place",
      tag: "Texto livre",
    };
  }

  function setPlace(fieldName, place, options = {}) {
    const normalizedPlace = clonePlace(place);
    const shouldUpdateInput = options.updateInput !== false;
    const shouldSyncRoute = !options.skipRouteSync && !options.deferRouteSync;

    state[fieldName] = normalizedPlace;
    state.routeData = null;

    if (!state.origin || !state.destination) {
      state.routeStatus = "idle";
    } else {
      state.routeStatus = normalizedPlace?.coords ? "loading" : "locating";
    }

    if (shouldUpdateInput) {
      getInputForField(fieldName).value = normalizedPlace ? getPlaceDisplay(normalizedPlace) : "";
    }

    updateEstimate();
    renderRouteOnMap();

    if (shouldSyncRoute) {
      void syncRouteAnalysis({ silent: true });
    }
  }

  function syncFieldFromInput(fieldName, options = {}) {
    const input = getInputForField(fieldName);
    const previousPlace = state[fieldName];
    const nextPlace = buildPlaceFromValue(fieldName, input.value);

    if (!nextPlace) {
      setPlace(fieldName, null, {
        updateInput: false,
        deferRouteSync: options.deferRouteSync,
        skipRouteSync: options.skipRouteSync,
      });
      return;
    }

    const isSameDisplay =
      previousPlace &&
      normalizeText(getPlaceDisplay(previousPlace)) === normalizeText(getPlaceDisplay(nextPlace));
    const hasSameCoords =
      Boolean(previousPlace) &&
      JSON.stringify(previousPlace.coords || []) === JSON.stringify(nextPlace.coords || []);

    if (isSameDisplay && hasSameCoords) {
      return;
    }

    setPlace(fieldName, nextPlace, {
      updateInput: false,
      deferRouteSync: options.deferRouteSync,
      skipRouteSync: options.skipRouteSync,
    });
  }

  function syncFormFields(options = {}) {
    syncFieldFromInput("origin", options);
    syncFieldFromInput("destination", options);
  }

  function degreesToRadians(value) {
    return (value * Math.PI) / 180;
  }

  function calculateDistanceInKm(originCoords, destinationCoords) {
    const [originLat, originLng] = originCoords;
    const [destinationLat, destinationLng] = destinationCoords;
    const earthRadius = 6371;

    const deltaLat = degreesToRadians(destinationLat - originLat);
    const deltaLng = degreesToRadians(destinationLng - originLng);

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(degreesToRadians(originLat)) *
        Math.cos(degreesToRadians(destinationLat)) *
        Math.sin(deltaLng / 2) ** 2;

    return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function calculateFare(distanceKm) {
    const supportValue = elements.supportSelect.value;
    return 12 + distanceKm * 3.65 + (SUPPORT_SURCHARGE[supportValue] || 0);
  }

  function createEstimateFromMetrics(distanceKm, durationMinutes, approximate) {
    const fareValue = calculateFare(distanceKm);

    return {
      canSubmit: true,
      badge: approximate ? ROUTE_BADGES.fallback : ROUTE_BADGES.ready,
      distanceLabel: `${distanceKm.toFixed(1)} km`,
      durationLabel: `${durationMinutes} min`,
      fareLabel: currencyFormatter.format(fareValue),
      distanceKm,
      durationMinutes,
      fareValue,
      approximate,
    };
  }

  function buildFallbackRouteData(originCoords, destinationCoords) {
    const distanceKm = calculateDistanceInKm(originCoords, destinationCoords);
    const durationMinutes = Math.max(8, Math.round(distanceKm * 3.8 + 6));

    return {
      geometry: [originCoords, destinationCoords],
      distanceMeters: Math.round(distanceKm * 1000),
      durationSeconds: durationMinutes * 60,
      approximate: true,
      source: "fallback",
    };
  }

  function getEstimateData() {
    const hasOrigin = Boolean(state.origin);
    const hasDestination = Boolean(state.destination);
    const hasBothPoints = hasOrigin && hasDestination;
    const samePoints =
      hasBothPoints &&
      normalizeText(getPlaceDisplay(state.origin)) ===
        normalizeText(getPlaceDisplay(state.destination));

    if (!hasBothPoints) {
      return {
        canSubmit: false,
        badge: ROUTE_BADGES.idle,
        distanceLabel: "-",
        durationLabel: "-",
        fareLabel: "-",
      };
    }

    if (samePoints) {
      return {
        canSubmit: false,
        badge: "Pontos iguais",
        distanceLabel: "-",
        durationLabel: "-",
        fareLabel: "-",
      };
    }

    if (state.routeStatus === "locating") {
      return {
        canSubmit: false,
        badge: ROUTE_BADGES.locating,
        distanceLabel: "Validando",
        durationLabel: "Aguarde",
        fareLabel: "Aguarde",
      };
    }

    if (state.routeStatus === "loading") {
      return {
        canSubmit: false,
        badge: ROUTE_BADGES.loading,
        distanceLabel: "Calculando",
        durationLabel: "Calculando",
        fareLabel: "Calculando",
      };
    }

    if (state.routeData?.distanceMeters && state.routeData?.durationSeconds) {
      const distanceKm = state.routeData.distanceMeters / 1000;
      const durationMinutes = Math.max(6, Math.ceil(state.routeData.durationSeconds / 60));

      return createEstimateFromMetrics(
        distanceKm,
        durationMinutes,
        Boolean(state.routeData.approximate)
      );
    }

    if (state.origin?.coords && state.destination?.coords) {
      const distanceKm = calculateDistanceInKm(state.origin.coords, state.destination.coords);
      const durationMinutes = Math.max(8, Math.round(distanceKm * 3.8 + 6));

      return createEstimateFromMetrics(distanceKm, durationMinutes, true);
    }

    return {
      canSubmit: false,
      badge: ROUTE_BADGES.error,
      distanceLabel: "Revise",
      durationLabel: "Revise",
      fareLabel: "Revise",
    };
  }

  function updateEstimate() {
    const estimate = getEstimateData();

    elements.distanceValue.textContent = estimate.distanceLabel;
    elements.durationValue.textContent = estimate.durationLabel;
    elements.fareValue.textContent = estimate.fareLabel;
    elements.statusBadge.textContent = estimate.badge;

    elements.previewOrigin.textContent = state.origin
      ? getPlaceDisplay(state.origin)
      : "Origem nao definida";
    elements.previewDestination.textContent = state.destination
      ? getPlaceDisplay(state.destination)
      : "Destino nao definido";

    elements.submitButton.disabled = !estimate.canSubmit;
  }

  function createMapMarker(coords, type) {
    return window.L.marker(coords, {
      icon: window.L.divIcon({
        className: `trip-map-marker trip-map-marker--${type}`,
        html: '<span class="trip-map-marker__dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    });
  }

  function renderRouteOnMap() {
    if (!state.routeLayer) {
      return;
    }

    state.routeLayer.clearLayers();

    const points = [];

    if (state.origin?.coords) {
      createMapMarker(state.origin.coords, "origin").addTo(state.routeLayer);
      points.push(state.origin.coords);
    }

    if (state.destination?.coords) {
      createMapMarker(state.destination.coords, "destination").addTo(state.routeLayer);
      points.push(state.destination.coords);
    }

    if (state.routeData?.geometry?.length > 1) {
      const routeLine = window.L.polyline(state.routeData.geometry, {
        color: state.routeData.approximate ? "#0f766e" : "#006782",
        weight: 5,
        opacity: 0.86,
        lineJoin: "round",
        dashArray: state.routeData.approximate ? "10 10" : "",
      });

      routeLine.addTo(state.routeLayer);
      state.map.fitBounds(routeLine.getBounds(), {
        padding: [48, 48],
        animate: true,
      });
      return;
    }

    if (state.origin?.coords && state.destination?.coords) {
      const routeLine = window.L.polyline([state.origin.coords, state.destination.coords], {
        color: "#0f766e",
        weight: 5,
        opacity: 0.7,
        lineJoin: "round",
        dashArray: "10 10",
      });

      routeLine.addTo(state.routeLayer);
      state.map.fitBounds(routeLine.getBounds(), {
        padding: [48, 48],
        animate: true,
      });
      return;
    }

    if (points.length === 1) {
      state.map.setView(points[0], 16, { animate: true });
    }
  }

  function hydrateRecentPlaces() {
    const normalizedPlaces = Array.isArray(state.recentPlaces)
      ? state.recentPlaces.map(clonePlace).filter(Boolean)
      : [];

    state.recentPlaces = normalizedPlaces;
  }

  function renderSuggestions() {
    const suggestionOptions = getAllPlaces();

    elements.suggestions.innerHTML = suggestionOptions
      .map((place) => {
        const displayValue = escapeHtml(getPlaceDisplay(place));
        return `<option value="${displayValue}"></option>`;
      })
      .join("");
  }

  function renderRecentDestinations() {
    const visiblePlaces = getQuickPlaces().slice(0, 6);

    elements.recentDestinations.innerHTML = visiblePlaces
      .map((place, index) => {
        const title = escapeHtml(place.label);
        const address = escapeHtml(place.address);
        const tag = place.tag ? `<span class="destination-item__tag">${escapeHtml(place.tag)}</span>` : "";

        return `
          <button class="destination-item" type="button" data-place-index="${index}">
            <div class="destination-item__icon">
              <span class="material-symbols-outlined">${escapeHtml(place.icon || "place")}</span>
            </div>
            <div class="destination-item__content">
              <p class="destination-item__title">${title}</p>
              <p class="destination-item__text">${address}</p>
              ${tag}
            </div>
          </button>
        `;
      })
      .join("");

    const renderedPlaces = visiblePlaces.map(clonePlace);

    elements.recentDestinations
      .querySelectorAll(".destination-item")
      .forEach((buttonElement) => {
        buttonElement.addEventListener("click", () => {
          const index = Number.parseInt(buttonElement.dataset.placeIndex, 10);
          const place = renderedPlaces[index];

          if (!place) {
            return;
          }

          if (!state.origin && state.currentLocation) {
            setPlace("origin", state.currentLocation);
          }

          setPlace("destination", place);
          setActiveField("destination");
          setFeedback("Destino preenchido a partir da sua lista rapida.", "info");
        });
      });
  }

  function saveRecentDestination(place) {
    if (!place) {
      return;
    }

    const normalizedPlace = serializePlace(place);
    const normalizedAddress = normalizeText(getPlaceDisplay(normalizedPlace));
    const nextRecentPlaces = [
      normalizedPlace,
      ...state.recentPlaces.filter((currentPlace) => {
        return normalizeText(getPlaceDisplay(currentPlace)) !== normalizedAddress;
      }),
    ].slice(0, 6);

    state.recentPlaces = nextRecentPlaces;
    writeJson(STORAGE_KEYS.recentDestinations, nextRecentPlaces);
    renderSuggestions();
    renderRecentDestinations();
  }

  function createRequestTimeLabel(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  function renderActiveRequest(request) {
    if (!request) {
      elements.activeRequestCard.hidden = true;
      return;
    }

    const isAccepted = request.status === "accepted";
    const supportLabel = SUPPORT_LABELS[request.support] || "Apoio nao informado";

    elements.activeRequestCard.hidden = false;
    elements.activeRequestTitle.textContent = isAccepted
      ? "Motorista a caminho"
      : "Motorista sendo procurado";
    elements.activeRequestStatus.textContent = isAccepted ? "Aceita" : "Em busca";
    elements.activeRequestRoute.textContent =
      `${request.origin.address} -> ${request.destination.address}`;
    elements.activeRequestTime.textContent = isAccepted
      ? `Aceita as ${createRequestTimeLabel(request.acceptedAt || request.updatedAt)}`
      : `Solicitado as ${createRequestTimeLabel(request.createdAt)}`;
    elements.activeRequestPrice.textContent =
      `Estimativa ${request.estimate?.fareLabel || "-"}`;
    elements.activeRequestSupport.textContent = supportLabel;
    elements.activeRequestDriver.textContent =
      isAccepted && request.driver?.name
        ? `Motorista: ${request.driver.name}`
        : "Aguardando aceite de um motorista.";
    elements.activeRequestNotes.textContent = request.notes
      ? `Obs.: ${request.notes}`
      : "Sem observacoes adicionais.";
    elements.cancelActiveRequestButton.textContent = isAccepted
      ? "Cancelar corrida"
      : "Cancelar solicitacao";
  }

  function applyRequestToState(request) {
    if (!request) {
      return;
    }

    setPlace("origin", request.origin, { skipRouteSync: true });
    setPlace("destination", request.destination, { skipRouteSync: true });

    if (request.route?.geometry?.length > 1) {
      state.routeData = cloneRouteData(request.route);
      state.routeStatus = request.route.approximate ? "fallback" : "ready";
      updateEstimate();
      renderRouteOnMap();
      return;
    }

    state.routeData = null;
    state.routeStatus = "idle";
    updateEstimate();
    renderRouteOnMap();
    void syncRouteAnalysis({ silent: true });
  }

  function migrateLegacyActiveRequest() {
    const legacyRequest = readJson(STORAGE_KEYS.activeRequest, null);
    const passenger = getPassengerIdentity();

    if (!legacyRequest || !tripStore || !passenger) {
      return;
    }

    const sharedRequest = tripStore.getActiveRequestForPassenger(passenger.id);

    if (sharedRequest) {
      return;
    }

    const migratedRequest = tripStore.upsertRequest({
      ...legacyRequest,
      passenger,
      status: legacyRequest.status || "searching",
    });

    if (migratedRequest) {
      writeJson(STORAGE_KEYS.activeRequest, migratedRequest);
    }
  }

  function restoreActiveRequest() {
    migrateLegacyActiveRequest();

    const passenger = getPassengerIdentity();
    const storedRequest =
      tripStore && passenger
        ? tripStore.getActiveRequestForPassenger(passenger.id)
        : readJson(STORAGE_KEYS.activeRequest, null);

    if (!storedRequest) {
      renderActiveRequest(null);
      return;
    }

    if (storedRequest.support && SUPPORT_LABELS[storedRequest.support]) {
      elements.supportSelect.value = storedRequest.support;
    }

    elements.notesInput.value = storedRequest.notes || "";
    applyRequestToState(storedRequest);
    renderActiveRequest(storedRequest);
  }

  function clearRoute(preserveCurrentLocation) {
    const shouldRestoreCurrentLocation = preserveCurrentLocation && state.currentLocation;

    setPlace("destination", null, { skipRouteSync: true });
    setPlace("origin", shouldRestoreCurrentLocation ? state.currentLocation : null, {
      skipRouteSync: true,
    });
    state.routeData = null;
    state.routeStatus = shouldRestoreCurrentLocation ? "idle" : "idle";
    elements.notesInput.value = "";
    elements.supportSelect.value = "embarque";
    setFeedback("", "");
    setActiveField(shouldRestoreCurrentLocation ? "destination" : "origin");
    updateEstimate();
    renderRouteOnMap();
  }

  function createMapPoint(fieldName, latlng) {
    const latitude = latlng.lat.toFixed(5);
    const longitude = latlng.lng.toFixed(5);

    return {
      id: `${fieldName}-map-${Date.now()}`,
      label: fieldName === "origin" ? "Origem no mapa" : "Destino no mapa",
      address: `Ponto marcado no mapa (${latitude}, ${longitude})`,
      coords: [latlng.lat, latlng.lng],
      icon: fieldName === "origin" ? "trip_origin" : "location_on",
      tag: "Mapa",
    };
  }

  function mergeSearchPlaces(places) {
    const nextPlaces = [...places, ...state.searchPlaces]
      .map(clonePlace)
      .filter(Boolean);
    const uniquePlaces = new Map();

    nextPlaces.forEach((place) => {
      const key = normalizeText(getPlaceDisplay(place));

      if (!key || uniquePlaces.has(key)) {
        return;
      }

      uniquePlaces.set(key, place);
    });

    state.searchPlaces = [...uniquePlaces.values()].slice(0, 10);
    renderSuggestions();
  }

  function createSearchPlace(result, fieldName) {
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    const address = String(result?.display_name || "").trim();

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !address) {
      return null;
    }

    return {
      id: `search-${result.place_id || Date.now()}`,
      label: address.split(",")[0].trim() || (fieldName === "origin" ? "Origem" : "Destino"),
      address,
      coords: [latitude, longitude],
      icon: fieldName === "origin" ? "trip_origin" : "location_on",
      tag: "Busca",
    };
  }

  async function requestPlaces(query, fieldName, options = {}) {
    const normalizedQuery = String(query || "").trim();

    if (normalizedQuery.length < 3) {
      return [];
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", String(options.limit || 5));
    url.searchParams.set("accept-language", "pt-BR");
    url.searchParams.set("q", normalizedQuery);

    const response = await window.fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error("Falha ao consultar enderecos.");
    }

    const results = await response.json();

    return Array.isArray(results)
      ? results.map((result) => createSearchPlace(result, fieldName)).filter(Boolean)
      : [];
  }

  function scheduleSuggestionSearch(fieldName, rawValue) {
    const query = String(rawValue || "").trim();

    window.clearTimeout(state.suggestionTimers[fieldName]);

    if (query.length < 3) {
      return;
    }

    state.suggestionTimers[fieldName] = window.setTimeout(async () => {
      state.suggestionControllers[fieldName]?.abort();

      const controller = new AbortController();
      state.suggestionControllers[fieldName] = controller;

      try {
        const places = await requestPlaces(query, fieldName, {
          limit: 5,
          signal: controller.signal,
        });

        if (normalizeText(getInputForField(fieldName).value) !== normalizeText(query)) {
          return;
        }

        mergeSearchPlaces(places);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);
        }
      }
    }, 350);
  }

  async function ensurePlaceCoordinates(fieldName) {
    const currentPlace = state[fieldName];

    if (!currentPlace) {
      return null;
    }

    if (currentPlace.coords) {
      return currentPlace;
    }

    const displayValue = getPlaceDisplay(currentPlace);
    const knownPlace = resolveKnownPlace(displayValue);

    if (knownPlace?.coords) {
      const normalizedKnownPlace = {
        ...knownPlace,
        icon: fieldName === "origin" ? "trip_origin" : "location_on",
      };

      setPlace(fieldName, normalizedKnownPlace, { skipRouteSync: true });
      return state[fieldName];
    }

    try {
      const places = await requestPlaces(displayValue, fieldName, { limit: 1 });
      const resolvedPlace = places[0];

      if (!resolvedPlace) {
        return null;
      }

      mergeSearchPlaces([resolvedPlace]);
      setPlace(fieldName, resolvedPlace, { skipRouteSync: true });
      return state[fieldName];
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function fetchRouteData(originCoords, destinationCoords) {
    const [originLat, originLng] = originCoords;
    const [destinationLat, destinationLng] = destinationCoords;
    const routeUrl = new URL(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}`
    );

    routeUrl.searchParams.set("overview", "full");
    routeUrl.searchParams.set("geometries", "geojson");
    routeUrl.searchParams.set("steps", "false");
    routeUrl.searchParams.set("alternatives", "false");

    const response = await window.fetch(routeUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao calcular o trajeto.");
    }

    const payload = await response.json();
    const primaryRoute = Array.isArray(payload.routes) ? payload.routes[0] : null;

    if (!primaryRoute?.geometry?.coordinates?.length) {
      throw new Error("Rota nao disponivel.");
    }

    return {
      geometry: primaryRoute.geometry.coordinates.map((point) => [point[1], point[0]]),
      distanceMeters: Number(primaryRoute.distance) || 0,
      durationSeconds: Number(primaryRoute.duration) || 0,
      approximate: false,
      source: "osrm",
    };
  }

  async function syncRouteAnalysis(options = {}) {
    const routeSyncToken = ++state.routeSyncToken;
    const hasOrigin = Boolean(state.origin);
    const hasDestination = Boolean(state.destination);

    if (!hasOrigin || !hasDestination) {
      state.routeData = null;
      state.routeStatus = "idle";
      updateEstimate();
      renderRouteOnMap();
      return { ok: false };
    }

    const samePoints =
      normalizeText(getPlaceDisplay(state.origin)) ===
      normalizeText(getPlaceDisplay(state.destination));

    if (samePoints) {
      state.routeData = null;
      state.routeStatus = "idle";
      updateEstimate();
      renderRouteOnMap();
      return { ok: false };
    }

    state.routeData = null;
    state.routeStatus =
      state.origin?.coords && state.destination?.coords ? "loading" : "locating";
    updateEstimate();
    renderRouteOnMap();

    const resolvedOrigin = await ensurePlaceCoordinates("origin");

    if (routeSyncToken !== state.routeSyncToken) {
      return { ok: false, stale: true };
    }

    const resolvedDestination = await ensurePlaceCoordinates("destination");

    if (routeSyncToken !== state.routeSyncToken) {
      return { ok: false, stale: true };
    }

    if (!resolvedOrigin?.coords || !resolvedDestination?.coords) {
      state.routeData = null;
      state.routeStatus = "error";
      updateEstimate();
      renderRouteOnMap();

      if (!options.silent) {
        setFeedback(
          "Nao foi possivel localizar um dos enderecos. Se preferir, marque os pontos no mapa.",
          "error"
        );
      }

      return { ok: false };
    }

    state.routeStatus = "loading";
    updateEstimate();

    try {
      const routeData = await fetchRouteData(resolvedOrigin.coords, resolvedDestination.coords);

      if (routeSyncToken !== state.routeSyncToken) {
        return { ok: false, stale: true };
      }

      state.routeData = routeData;
      state.routeStatus = "ready";
      updateEstimate();
      renderRouteOnMap();
      return { ok: true, routeData };
    } catch (error) {
      console.error(error);

      if (routeSyncToken !== state.routeSyncToken) {
        return { ok: false, stale: true };
      }

      state.routeData = buildFallbackRouteData(
        resolvedOrigin.coords,
        resolvedDestination.coords
      );
      state.routeStatus = "fallback";
      updateEstimate();
      renderRouteOnMap();

      if (!options.silent) {
        setFeedback(
          "Nao foi possivel carregar o trajeto viario agora. Exibindo uma aproximacao temporaria.",
          "info"
        );
      }

      return { ok: true, routeData: state.routeData, approximate: true };
    }
  }

  function requestCurrentLocation(forceOrigin, showFailureMessage) {
    if (!navigator.geolocation) {
      if (showFailureMessage) {
        setFeedback("Seu navegador nao liberou geolocalizacao.", "error");
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place = {
          id: "current-location",
          label: "Minha localizacao",
          address: "Minha localizacao atual",
          coords: [position.coords.latitude, position.coords.longitude],
          icon: "my_location",
          tag: "Ao vivo",
        };

        state.currentLocation = place;
        const shouldApplyOrigin = forceOrigin || !state.origin;

        if (shouldApplyOrigin) {
          setPlace("origin", place);
          setActiveField("destination");
          setFeedback("Origem atualizada com sua localizacao.", "info");
          state.map.setView(place.coords, 16, { animate: true });
        }
      },
      () => {
        if (showFailureMessage) {
          setFeedback("Nao foi possivel obter sua localizacao atual.", "error");
        }
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    syncFormFields();

    const originalButtonLabel = elements.submitButton.textContent;
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = "Enviando...";

    try {
      const passenger = getPassengerIdentity();

      if (!passenger || !tripStore) {
        setFeedback("Nao foi possivel preparar a solicitacao nesta sessao.", "error");
        return;
      }

      const routeResult = await syncRouteAnalysis({ silent: false });

      if (!routeResult.ok) {
        return;
      }

      const estimate = getEstimateData();

      if (!estimate.canSubmit) {
        setFeedback("Defina origem e destino validos para solicitar a locomocao.", "error");
        return;
      }

      const currentActiveRequest = tripStore.getActiveRequestForPassenger(passenger.id);

      if (currentActiveRequest?.status === "accepted") {
        setFeedback(
          "Voce ja possui uma corrida aceita. Cancele a atual antes de solicitar outra.",
          "error"
        );
        return;
      }

      const request = {
        id: currentActiveRequest?.id || `request-${Date.now()}`,
        createdAt: currentActiveRequest?.createdAt || new Date().toISOString(),
        status: "searching",
        passenger,
        driver: null,
        origin: serializePlace(state.origin),
        destination: serializePlace(state.destination),
        support: elements.supportSelect.value,
        notes: elements.notesInput.value.trim(),
        estimate: {
          ...estimate,
        },
        route: cloneRouteData(state.routeData),
      };

      const persistedRequest = tripStore.upsertRequest(request);

      if (!persistedRequest) {
        setFeedback("Nao foi possivel salvar a solicitacao.", "error");
        return;
      }

      writeJson(STORAGE_KEYS.activeRequest, persistedRequest);
      saveRecentDestination(state.destination);
      renderActiveRequest(persistedRequest);
      setFeedback(
        "Solicitacao enviada. A rota foi sincronizada e os motoristas ja podem aceitar.",
        "success"
      );
    } finally {
      elements.submitButton.textContent = originalButtonLabel;
      updateEstimate();
    }
  }

  function initializeMap() {
    const passengerMap = window.L.map("passenger-map", {
      zoomControl: false,
    }).setView(defaultLocation, 14);

    window.L.control.zoom({ position: "bottomright" }).addTo(passengerMap);

    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(passengerMap);

    passengerMap.attributionControl.setPrefix("");

    state.map = passengerMap;
    state.routeLayer = window.L.layerGroup().addTo(passengerMap);

    passengerMap.on("click", (event) => {
      const targetField = state.activeField || (state.origin ? "destination" : "origin");
      const place = createMapPoint(targetField, event.latlng);

      setPlace(targetField, place);
      setActiveField(targetField === "origin" ? "destination" : "destination");
      setFeedback(
        `${targetField === "origin" ? "Origem" : "Destino"} marcado no mapa.`,
        "info"
      );
    });
  }

  function bindEvents() {
    elements.originInput.addEventListener("focus", () => {
      setActiveField("origin");
    });

    elements.destinationInput.addEventListener("focus", () => {
      setActiveField("destination");
    });

    elements.originInput.addEventListener("input", () => {
      syncFieldFromInput("origin", { deferRouteSync: true });
      scheduleSuggestionSearch("origin", elements.originInput.value);
      setFeedback("", "");
    });

    elements.destinationInput.addEventListener("input", () => {
      syncFieldFromInput("destination", { deferRouteSync: true });
      scheduleSuggestionSearch("destination", elements.destinationInput.value);
      setFeedback("", "");
    });

    elements.originInput.addEventListener("change", () => {
      syncFieldFromInput("origin");
    });

    elements.destinationInput.addEventListener("change", () => {
      syncFieldFromInput("destination");
    });

    elements.supportSelect.addEventListener("change", () => {
      updateEstimate();
    });

    elements.swapButton.addEventListener("click", () => {
      const previousOrigin = clonePlace(state.origin);
      const previousDestination = clonePlace(state.destination);

      setPlace("origin", previousDestination, { skipRouteSync: true });
      setPlace("destination", previousOrigin, { skipRouteSync: true });
      setActiveField("destination");
      setFeedback("Origem e destino foram invertidos.", "info");
      void syncRouteAnalysis({ silent: true });
    });

    elements.useCurrentLocationButton.addEventListener("click", () => {
      requestCurrentLocation(true, true);
    });

    elements.fillDemoRouteButton.addEventListener("click", () => {
      const suggestedOrigin = state.currentLocation || defaultPlaces[0];
      const suggestedDestination = defaultPlaces[3];

      setPlace("origin", suggestedOrigin, { skipRouteSync: true });
      setPlace("destination", suggestedDestination, { skipRouteSync: true });
      setActiveField("destination");
      setFeedback("Rota sugerida preenchida. Ajuste se quiser antes de solicitar.", "info");
      void syncRouteAnalysis({ silent: true });
    });

    elements.recenterMapButton.addEventListener("click", () => {
      if (state.routeData?.geometry?.length > 1) {
        state.map.fitBounds(state.routeData.geometry, {
          padding: [48, 48],
          animate: true,
        });
        return;
      }

      if (state.origin?.coords && state.destination?.coords) {
        state.map.fitBounds([state.origin.coords, state.destination.coords], {
          padding: [48, 48],
          animate: true,
        });
        return;
      }

      if (state.currentLocation?.coords) {
        state.map.setView(state.currentLocation.coords, 16, { animate: true });
        return;
      }

      state.map.setView(defaultLocation, 14, { animate: true });
    });

    elements.clearRouteButton.addEventListener("click", () => {
      clearRoute(true);
    });

    elements.clearRecentsButton.addEventListener("click", () => {
      state.recentPlaces = [];
      writeJson(STORAGE_KEYS.recentDestinations, []);
      renderSuggestions();
      renderRecentDestinations();
      setFeedback("Historico local de destinos removido.", "info");
    });

    elements.cancelActiveRequestButton.addEventListener("click", () => {
      const passenger = getPassengerIdentity();
      const currentActiveRequest =
        tripStore && passenger
          ? tripStore.getActiveRequestForPassenger(passenger.id)
          : readJson(STORAGE_KEYS.activeRequest, null);

      if (currentActiveRequest && tripStore && passenger) {
        tripStore.cancelRequest(currentActiveRequest.id, passenger);
      }

      window.localStorage.removeItem(STORAGE_KEYS.activeRequest);
      renderActiveRequest(null);
      setFeedback("Solicitacao ativa cancelada nesta interface.", "info");
    });

    elements.form.addEventListener("submit", handleSubmit);

    window.addEventListener("storage", (event) => {
      if (
        event.key === STORAGE_KEYS.activeRequest ||
        event.key === STORAGE_KEYS.recentDestinations ||
        event.key === tripStore?.REQUESTS_KEY
      ) {
        state.recentPlaces = readJson(STORAGE_KEYS.recentDestinations, []);
        hydrateRecentPlaces();
        renderSuggestions();
        renderRecentDestinations();
        restoreActiveRequest();
      }
    });
  }

  hydrateRecentPlaces();
  initializeMap();
  renderSuggestions();
  renderRecentDestinations();
  bindEvents();
  restoreActiveRequest();
  updateEstimate();
  setActiveField("destination");
  requestCurrentLocation(false, false);
});
