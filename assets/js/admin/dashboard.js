// ==========================
// CONFIG
// ==========================
const API_URL = "http://localhost:8080/dashboard";

// ==========================
// RENDER METRICS
// ==========================
function renderMetrics(metrics) {
  const container = document.getElementById("metrics");

  if (!container) return;

  container.innerHTML = "";

  metrics.forEach(metric => {
    const card = document.createElement("article");
    card.classList.add("metric-card");

    card.innerHTML = `
      <div class="metric-card__top">
        <span class="metric-card__label">${metric.label}</span>
        <span class="material-symbols-outlined metric-card__icon">${metric.icon}</span>
      </div>
      <div class="metric-card__value-wrap">
        <strong class="metric-card__value">${metric.value}</strong>
        <span class="metric-card__delta metric-card__delta--${metric.type}">
          ${metric.delta}
        </span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ==========================
// MOCK (fallback)
// ==========================
function getMockMetrics() {
  return [
    { label: "Corridas ativas", icon: "map", value: 0, delta: "0%", type: "positive" },
    { label: "Motoristas online", icon: "directions_car", value: 0, delta: "0%", type: "positive" },
    { label: "Faturamento do dia", icon: "payments", value: "R$ 0", delta: "0%", type: "positive" },
    { label: "Taxa de cancelamento", icon: "cancel", value: "0%", delta: "0%", type: "positive" }
  ];
}

// ==========================
// FETCH API
// ==========================
async function loadMetrics() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erro na API");
    }

    const data = await response.json();

    renderMetrics(data);

  } catch (error) {
    console.warn("Usando mock (API indisponível):", error);

    const mock = getMockMetrics();
    renderMetrics(mock);
  }
}

// ==========================
// INIT
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  loadMetrics();

  // Atualiza a cada 10s (opcional)
  setInterval(loadMetrics, 10000);
});