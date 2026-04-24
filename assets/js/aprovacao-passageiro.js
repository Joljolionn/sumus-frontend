const API_URL = "http://localhost:8080/passageiros/pendentes";

async function loadPassageiros() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    renderPassageiros(data);
  } catch (error) {
    console.warn("API indisponível, usando mock");
    renderPassageiros(getMock());
  }
}

function renderPassageiros(lista) {
  const container = document.getElementById("passageiros-lista");
  container.innerHTML = "";

  lista.forEach(p => {
    const card = document.createElement("article");
    card.classList.add("approval-card");

    card.innerHTML = `
      <div class="approval-card__profile">
        <div class="approval-card__avatar-wrap">
          <img class="approval-card__avatar"
            src="${p.foto || 'https://via.placeholder.com/40'}"
            alt="${p.nome}" />

          <span class="approval-card__status ${getStatusClass(p.status)}"></span>
        </div>

        <div>
          <h2 class="approval-card__name">${p.nome}</h2>
          <p class="approval-card__meta">${p.tempo || "Agora"}</p>
        </div>
      </div>

      <div class="approval-card__documents">
        <p class="approval-card__label">Documentos PCD</p>
        <div class="approval-card__document-list">
          ${(p.documentos || []).map(doc => `
            <button class="approval-card__document"
              onclick="abrirModal('${doc.url}')">
              <span class="material-symbols-outlined">assignment</span>
              <span>${doc.nome}</span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="approval-card__condition">
        <p class="approval-card__label">Deficiencia</p>
        <h3>${p.deficiencia}</h3>

        <span class="approval-card__badge ${getBadgeClass(p.deficiencia)}">
          <span class="material-symbols-outlined">
            ${getIcon(p.deficiencia)}
          </span>
          <span>${p.detalhe}</span>
        </span>
      </div>

      <div class="approval-card__actions">
        <button class="approval-card__action approval-card__action--danger"
          onclick="rejeitar(${p.id})">
          <span class="material-symbols-outlined">close</span>
          <span>Recusar</span>
        </button>

        <button class="approval-card__action approval-card__action--success"
          onclick="aprovar(${p.id})">
          <span class="material-symbols-outlined">check</span>
          <span>Aprovar</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

//
// 🔥 HELPERS (isso aqui deixa pixel perfect)
//

function getStatusClass(status) {
  if (status === "aprovado") return "approval-card__status--approved";
  if (status === "rejeitado") return "approval-card__status--rejected";
  return "approval-card__status--pending";
}

function getBadgeClass(deficiencia) {
  if (deficiencia === "Motora") return "approval-card__badge--mobility";
  if (deficiencia === "Auditiva") return "approval-card__badge--hearing";
  if (deficiencia === "Visual") return "approval-card__badge--vision";
  return "";
}

function getIcon(deficiencia) {
  if (deficiencia === "Motora") return "accessible";
  if (deficiencia === "Auditiva") return "hearing";
  if (deficiencia === "Visual") return "visibility_off";
  return "info";
}

//
// 🔁 AÇÕES
//

async function aprovar(id) {
  await fetch(`http://localhost:8080/passageiros/${id}/aprovar`, {
    method: "POST"
  });

  loadPassageiros();
}

async function rejeitar(id) {
  await fetch(`http://localhost:8080/passageiros/${id}/rejeitar`, {
    method: "POST"
  });

  loadPassageiros();
}

//
// 🧪 MOCK (pra você testar agora)
//

function getMock() {
  return [
    {
      id: 1,
      nome: "Ricardo Silveira",
      tempo: "Solicitado há 2h",
      deficiencia: "Motora",
      detalhe: "Cadeira de rodas",
      status: "pendente",
      documentos: [
        {
          nome: "Laudo.pdf",
          url: "https://www.orimi.com/pdf-test.pdf"
        },
        {
          nome: "CIPCD.pdf",
          url: "https://www.orimi.com/pdf-test.pdf"
        }
      ]
    },
    {
      id: 2,
      nome: "Amanda Soares",
      tempo: "Solicitado há 5h",
      deficiencia: "Auditiva",
      detalhe: "Surdez parcial",
      status: "pendente",
      documentos: [
        {
          nome: "Laudo.pdf",
          url: "https://www.orimi.com/pdf-test.pdf"
        }
      ]
    },
    {
      id: 3,
      nome: "Joao Paulo",
      tempo: "Solicitado há 12h",
      deficiencia: "Visual",
      detalhe: "Baixa visão",
      status: "aprovado",
      documentos: [
        {
          nome: "Laudo.pdf",
          url: "https://www.orimi.com/pdf-test.pdf"
        }
      ]
    }
  ];
}

//
// 🚀 INIT
//
window.onload = loadPassageiros;