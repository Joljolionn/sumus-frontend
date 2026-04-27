const API_URL = "http://localhost:8080/motoristas/pendentes";

async function loadMotoristas() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    renderMotoristas(data);
  } catch (error) {
    console.warn("API indisponível, usando mock");
    renderMotoristas(getMock());
  }
}

function renderMotoristas(lista) {
  const container = document.getElementById("motoristas-lista");
  container.innerHTML = "";

  lista.forEach(m => {
    const card = document.createElement("article");
    card.classList.add("approval-card");

    card.innerHTML = `
      <div class="approval-card__profile">
        <div class="approval-card__avatar-wrap">
          <img class="approval-card__avatar"
            src="${m.foto || 'https://via.placeholder.com/40'}"
            alt="${m.nome}" />

          <span class="approval-card__status ${getStatusClass(m.status)}"></span>
        </div>

        <div>
          <h2 class="approval-card__name">${m.nome}</h2>
          <p class="approval-card__meta">${m.tempo || "Agora"}</p>
        </div>
      </div>

      <div class="approval-card__documents">
        <p class="approval-card__label">Documentos</p>
        <div class="approval-card__document-list">
          ${(m.documentos || []).map(doc => `
            <button class="approval-card__document"
              onclick="abrirModal('${doc.url}')">
              <span class="material-symbols-outlined">${doc.icone}</span>
              <span>${doc.nome}</span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="approval-card__vehicle">
        <p class="approval-card__label">Veículo</p>
        <h3>${m.veiculo}</h3>

        <span class="approval-card__badge ${getVehicleBadge(m.adaptado)}">
          ${m.adaptado ? `
            <span class="material-symbols-outlined">accessible</span>
            <span>Veículo adaptado</span>
          ` : `
            <span>Não adaptado</span>
          `}
        </span>
      </div>

      <div class="approval-card__actions">
        <button class="approval-card__action approval-card__action--danger"
          onclick="rejeitar(${m.id})">
          <span class="material-symbols-outlined">close</span>
          <span>Recusar</span>
        </button>

        <button class="approval-card__action approval-card__action--success"
          onclick="aprovar(${m.id})">
          <span class="material-symbols-outlined">check</span>
          <span>Aprovar</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

//
// 🔥 HELPERS
//

function getStatusClass(status) {
  if (status === "aprovado") return "approval-card__status--approved";
  if (status === "rejeitado") return "approval-card__status--rejected";
  return "approval-card__status--pending";
}

function getVehicleBadge(adaptado) {
  return adaptado
    ? "approval-card__badge--adapted"
    : "approval-card__badge--default";
}

//
// 🔁 AÇÕES
//

async function aprovar(id) {
  try {
    await fetch(`http://localhost:8080/motoristas/${id}/aprovar`, {
      method: "POST"
    });

    loadMotoristas();
  } catch (e) {
    console.error("Erro ao aprovar");
  }
}

async function rejeitar(id) {
  try {
    await fetch(`http://localhost:8080/motoristas/${id}/rejeitar`, {
      method: "POST"
    });

    loadMotoristas();
  } catch (e) {
    console.error("Erro ao rejeitar");
  }
}

//
// 🧪 MOCK (IMPORTANTE PRA TESTE AGORA)
//

function getMock() {
  return [
    {
      id: 1,
      nome: "Ricardo Silveira",
      tempo: "Solicitado há 2h",
      veiculo: "Toyota Corolla Hybrid",
      adaptado: true,
      status: "pendente",
      documentos: [
        {
          nome: "CNH.pdf",
          url: "https://www.orimi.com/pdf-test.pdf",
          icone: "badge"
        },
        {
          nome: "CRLV.pdf",
          url: "https://www.orimi.com/pdf-test.pdf",
          icone: "description"
        }
      ]
    },
    {
      id: 2,
      nome: "Amanda Soares",
      tempo: "Solicitado há 5h",
      veiculo: "Honda Civic Touring",
      adaptado: false,
      status: "pendente",
      documentos: [
        {
          nome: "CNH.pdf",
          url: "https://www.orimi.com/pdf-test.pdf",
          icone: "badge"
        }
      ]
    },
    {
      id: 3,
      nome: "João Paulo",
      tempo: "Solicitado há 12h",
      veiculo: "BYD Dolphin",
      adaptado: true,
      status: "aprovado",
      documentos: [
        {
          nome: "CRLV.pdf",
          url: "https://www.orimi.com/pdf-test.pdf",
          icone: "description"
        }
      ]
    }
  ];
}

//
// 🚀 INIT
//
window.onload = loadMotoristas;