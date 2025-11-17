// ================================
// CONFIG
// ================================
const TOKEN = localStorage.getItem("jwtToken");
const USER_TYPE = localStorage.getItem("userType"); // "passenger" ou "driver"

if (!TOKEN || !USER_TYPE) {
	alert("Sessão expirada. Faça login novamente.");
	location.href = "login.html";
}

const API_BASE =
	USER_TYPE === "driver"
		? "http://localhost:8080/driver/"
		: "http://localhost:8080/passenger/";

const API_UPLOAD = API_BASE + "upload";

const authHeaders = {
	"Content-Type": "application/json",
	Authorization: `Bearer ${TOKEN}`,
};

const authHeaderOnly = {
	Authorization: `Bearer ${TOKEN}`,
};

// ================================
// ELEMENTOS
// ================================
const inputName = document.getElementById("input-name");
const inputCell = document.getElementById("input-cell");
const inputEmail = document.getElementById("input-email");
const inputCondicoes = document.getElementById("input-condicoes");

const saveProfileBtn = document.getElementById("save-profile-btn");

const inputNewPass = document.getElementById("input-new-password");
const inputRepeatPass = document.getElementById("input-repeat-password");
const savePasswordBtn = document.getElementById("save-password-btn");

const uploadArea = document.getElementById("upload-area");
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".pdf,.jpg,.png,.jpeg";
fileInput.hidden = true;

uploadArea.appendChild(fileInput);

const fileBox = document.getElementById("file-uploaded");
const fileNameSpan = document.getElementById("file-name");
const removeBtn = document.getElementById("remove-file-btn");

const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

const submitBtn = document.getElementById("submit-btn");

let selectedFile = null;

// ================================
// CARREGAR DADOS DO USUÁRIO
// ================================
async function carregarDados() {
	try {
		const response = await fetch(API_BASE, {
			method: "GET",
			headers: authHeaders,
		});

		if (!response.ok) throw new Error("Erro ao carregar dados.");

		const data = await response.json();

		inputName.value = data.name ?? "";
		inputCell.value = data.phone ?? "";
		inputEmail.value = data.email ?? "";

		const conditions = [];
		const conditionsArray = data.conditions;

		conditionsArray.forEach((condition) => {
			conditions.push(condition.necessity);
		});

		// Só passageiro tem condições
		if (inputCondicoes) {
			inputCondicoes.value = conditions.join(", ");
		}
	} catch (err) {
		console.error(err);
		alert("Falha ao carregar seus dados. Faça login novamente.");
	}
}

carregarDados();

// ================================
// SALVAR PERFIL
// ================================
async function salvarPerfil() {
	const body = {
		nome: inputName.value,
		celular: inputCell.value,
		email: inputEmail.value,
	};

	// Só passageiro tem condições
	if (USER_TYPE === "passenger") {
		body.condicoes = inputCondicoes.value;
	}

	try {
		const response = await fetch(API_BASE, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify(body),
		});

		if (!response.ok) throw new Error();

		alert("Dados atualizados!");
	} catch {
		alert("Erro ao salvar dados.");
	}
}

saveProfileBtn.addEventListener("click", salvarPerfil);

// ================================
// MUDAR SENHA
// ================================
async function salvarSenha() {
	if (inputNewPass.value !== inputRepeatPass.value) {
		return alert("As senhas não conferem.");
	}

	if (inputNewPass.value.length < 6) {
		return alert("Senha muito curta (mínimo 6 caracteres).");
	}

	const body = { novaSenha: inputNewPass.value };

	try {
		const response = await fetch(API_BASE + "/password", {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify(body),
		});

		if (!response.ok) throw new Error();

		alert("Senha alterada!");
	} catch {
		alert("Erro ao alterar senha.");
	}
}

savePasswordBtn.addEventListener("click", salvarSenha);

// ================================
// UPLOAD
// ================================
uploadArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => handleFiles(fileInput.files));

uploadArea.addEventListener("dragover", (e) => {
	e.preventDefault();
	uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
	uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (e) => {
	e.preventDefault();
	uploadArea.classList.remove("drag-over");
	handleFiles(e.dataTransfer.files);
});

// ================================
// ARQUIVO
// ================================
function handleFiles(files) {
	const file = files[0];
	if (!file) return;

	const allowed = ["application/pdf", "image/jpeg", "image/png"];
	if (!allowed.includes(file.type)) {
		alert("Arquivo inválido!");
		return;
	}

	selectedFile = file;
	fileNameSpan.textContent = file.name;
	fileBox.style.display = "flex";
}

// Remover arquivo
removeBtn.addEventListener("click", () => {
	selectedFile = null;
	fileBox.style.display = "none";
});

// ================================
// ENVIAR ARQUIVO
// ================================
async function uploadFile() {
	if (!selectedFile) return alert("Nenhum arquivo selecionado.");

	const formData = new FormData();
	formData.append("documento", selectedFile);

	try {
		const response = await fetch(API_UPLOAD, {
			method: "POST",
			headers: authHeaderOnly,
			body: formData,
		});

		if (!response.ok) throw new Error();

		simulateProgress(() => {
			alert("Arquivo enviado com sucesso!");
		});
	} catch {
		alert("Erro ao enviar arquivo.");
	}
}

submitBtn.addEventListener("click", uploadFile);

// ================================
// PROGRESS BAR
// ================================
function simulateProgress(callback) {
	let p = 0;
	const timer = setInterval(() => {
		p += Math.random() * 22;
		if (p >= 100) {
			p = 100;
			clearInterval(timer);
			callback();
		}
		progressFill.style.width = p + "%";
		progressText.textContent = Math.floor(p) + "%";
	}, 200);
}
