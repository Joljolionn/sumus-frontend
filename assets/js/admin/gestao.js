// =========================
// CONFIG
// =========================
const ENV = "mock"; // "mock" ou "api"
const API_URL = "http://localhost:8080/api/admins";

// =========================
// MOCK DATA (fallback)
// =========================
const ADMINS_MOCADOS = [
    {
        id: "m-1",
        nome: "Marcus Aurelius",
        email: "marcus@sumus.com",
        cargo: "Curador Senior",
        status: "active",
        ultimoAcesso: "hoje, 09:42",
        avatarUrl: ""
    },
    {
        id: "m-2",
        nome: "Livia Drusilla",
        email: "livia@sumus.com",
        cargo: "Arquivista",
        status: "active",
        ultimoAcesso: "ontem, 18:15",
        avatarUrl: ""
    },
    {
        id: "m-3",
        nome: "Tiberius Nero",
        email: "tiberius@sumus.com",
        cargo: "Editor Junior",
        status: "inactive",
        ultimoAcesso: "12 out, 2023",
        avatarUrl: ""
    }
];

// =========================
// HELPERS
// =========================
const isMock = () => ENV === "mock";
const isMockId = (id) => String(id).startsWith("m-");

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    fetchAdmins();
    handleFormSubmit();
    handleSearch();
});

// =========================
// FETCH ADMINS (API + FALLBACK)
// =========================
async function fetchAdmins() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error("API error");

        const admins = await response.json();
        renderAdmins(admins);

    } catch (error) {
        console.warn("API offline → usando mock");
        renderAdmins(ADMINS_MOCADOS);

        const info = document.getElementById("pagination-info");
        if (info && isMock()) {
            info.innerHTML = `
                Exibindo <strong>${ADMINS_MOCADOS.length}</strong> registros 
                <span style="color:orange">(Modo Mock)</span>
            `;
        }
    }
}

// =========================
// RENDER UI
// =========================
function renderAdmins(admins) {
    const container = document.getElementById("admin-list-container");
    container.innerHTML = "";

    admins.forEach(admin => {
        const card = document.createElement("article");

        const isInactive = admin.status !== "active";
        card.className = `admin-user-card ${isInactive ? "admin-user-card--muted" : ""}`;

        const avatar = admin.avatarUrl
            ? admin.avatarUrl
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.nome)}`;

        card.innerHTML = `
            <div class="admin-user-card__avatar-wrap">
                <img class="admin-user-card__avatar" src="${avatar}" alt="${admin.nome}" />
                <span class="admin-user-card__status admin-user-card__status--${admin.status === "active" ? "active" : "inactive"}"></span>
            </div>

            <div class="admin-user-card__body">
                <div class="admin-user-card__identity">
                    <h3>${admin.nome}</h3>
                    <span class="admin-user-card__badge">${admin.cargo}</span>
                </div>
                <p class="admin-user-card__email">${admin.email}</p>
                <p class="admin-user-card__meta">Último acesso: ${admin.ultimoAcesso || "Nunca"}</p>
            </div>

            <div class="admin-user-card__actions">
                <button type="button" onclick="editAdmin('${admin.id}')">
                    <span class="material-symbols-outlined">edit_square</span>
                </button>
                <button type="button" onclick="deleteAdmin('${admin.id}')" style="color: var(--error);">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    const info = document.getElementById("pagination-info");
    if (info) {
        info.innerHTML = `Exibindo <strong>${admins.length}</strong> registros`;
    }
}

// =========================
// CREATE ADMIN
// =========================
function handleFormSubmit() {
    const form = document.querySelector(".admin-management-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const novoAdmin = {
            nome: document.getElementById("admin-name").value,
            email: document.getElementById("admin-mail").value,
            cargo: document.getElementById("admin-role").value,
            status: "active",
            ultimoAcesso: "Agora"
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoAdmin)
            });

            if (!response.ok) throw new Error();

            alert("Cadastrado com sucesso!");
            form.reset();
            fetchAdmins();

        } catch {
            alert("Servidor offline — não foi possível salvar.");
        }
    });
}

// =========================
// SEARCH (CLIENT SIDE)
// =========================
function handleSearch() {
    const searchInput = document.getElementById("admin-search");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const cards = document.querySelectorAll(".admin-user-card");

        cards.forEach(card => {
            const nome = card.querySelector("h3").innerText.toLowerCase();
            const cargo = card.querySelector(".admin-user-card__badge").innerText.toLowerCase();

            const match = nome.includes(termo) || cargo.includes(termo);
            card.style.display = match ? "flex" : "none";
        });
    });
}

// =========================
// DELETE ADMIN
// =========================
async function deleteAdmin(id) {
    if (isMockId(id)) {
        alert("Modo mock ativo — exclusão bloqueada.");
        return;
    }

    if (!confirm("Excluir administrador?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error();

        fetchAdmins();

    } catch {
        alert("Erro ao excluir no servidor.");
    }
}

// =========================
// EDIT ADMIN (placeholder)
// =========================
function editAdmin(id) {
    if (isMockId(id)) {
        alert("Modo mock ativo — edição bloqueada.");
        return;
    }

    console.log("Editar admin:", id);
    alert("Edição será implementada no backend.");
}

// =========================
// RESTORE ADMIN (placeholder)
// =========================
function restaurarAdmin(id) {
    if (isMockId(id)) {
        alert("Modo mock ativo.");
        return;
    }

    console.log("Restaurar admin:", id);
}