// ================================
// CONFIG
// ================================
const TOKEN = localStorage.getItem("jwtToken");
const USER_TYPE = localStorage.getItem("userType"); // "passenger" ou "driver"

if (!TOKEN || !USER_TYPE) {
	alert("Sessão expirada. Faça login novamente.");
	location.href = "/login";
}

const API_BASE =
	USER_TYPE === "driver"
		? "/driver/"
		: "/passenger/";

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

// FOTO
const photoCircle = document.getElementById("photo-circle");
const editPhotoBtn = document.getElementById("edit-photo-btn");
const inputPhoto = document.getElementById("input-photo");

editPhotoBtn.addEventListener("click", () => inputPhoto.click());

inputPhoto.addEventListener("change", function () {
	const file = this.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = () => {
		photoCircle.style.backgroundImage = `url(${reader.result})`;
		photoCircle.style.backgroundSize = "cover";
		photoCircle.style.backgroundPosition = "center";
	};
	reader.readAsDataURL(file);
});


// CAMPOS DE PERFIL
const inputName = document.getElementById("input-name");
const inputCell = document.getElementById("input-cell");
const inputEmail = document.getElementById("input-email");
const inputCondicoes = document.getElementById("input-condicoes");

const saveProfileBtn = document.getElementById("save-profile-btn");

// CAMPOS DE SENHA
const inputNewPass = document.getElementById("input-new-password");
const inputRepeatPass = document.getElementById("input-repeat-password");
const savePasswordBtn = document.getElementById("save-password-btn");

// ARQUIVO
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
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

		// CAMPOS PRINCIPAIS
		inputName.value = data.name ?? "";
		inputCell.value = data.phone ?? "";
		inputEmail.value = data.email ?? "";

		// // FOTO DO PERFIL
		// if (data.photoUrl) {
		// 	photoCircle.style.backgroundImage = `url(${data.photoUrl})`;
		// 	photoCircle.style.backgroundSize = "cover";
		// 	photoCircle.style.backgroundPosition = "center";
		// }

		// CONDIÇÕES (somente passageiro)
		if (inputCondicoes && data.conditions) {
			inputCondicoes.value = data.conditions
				.map((c) => c.necessity)
				.join(", ");
		}

        const responsePhoto = await fetch(API_BASE + "photo", {
            method: "GET",
            headers: authHeaders
        })

        if (responsePhoto.ok) {
            // Converte a resposta binária (byte[]) em um Blob
            const imageBlob = await responsePhoto.blob(); 
            
            // Cria um URL local temporário para a imagem
            const imageObjectURL = URL.createObjectURL(imageBlob);

            // Usa o URL local para exibir a imagem
            photoCircle.style.backgroundImage = `url(${imageObjectURL})`;
            photoCircle.style.backgroundSize = "cover";
            photoCircle.style.backgroundPosition = "center";
            
            // Opcional, mas recomendado: Lembre-se de revogar o URL 
            // quando a página fechar ou a imagem for trocada.
            // (Pode ser ignorado em SPAs simples se não houver vazamento de memória)
            // URL.revokeObjectURL(imageObjectURL); 
        }
	} catch (err) {
		console.error(err);
		alert("Falha ao carregar seus dados. Faça login novamente.");
	}
}

carregarDados();


// ================================
// SALVAR PERFIL (COMPLETO) [MENOS SENHA]
// ================================
async function salvarPerfil() {

    const formData = new FormData();
    formData.append("name", inputName.value)
    formData.append("phone", inputCell.value)
    formData.append("email", inputEmail.value)
    const file = inputPhoto.files && inputPhoto.files.length > 0 ? inputPhoto.files[0] : null;

    if (file) formData.append("photo", file);

    // TODO: O input de condições deve ser imutável por enquanto */
    //
	// if (USER_TYPE === "passenger") {
	// 	body.condicoes = inputCondicoes.value;
	// }

	try {
		const response = await fetch(API_BASE, {
			method: "PUT",
			headers: authHeaderOnly,
			body: formData
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

	const body = { password: inputNewPass.value };

	try {
		const response = await fetch(API_BASE + "password", {
			method: "PATCH",
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
// UPLOAD DE DOCUMENTO
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

// Selecionar arquivo
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

	// PREVIEW NO QUADRADO
	const fileIcon = document.getElementById("file-icon");
	fileIcon.innerHTML = ""; // limpa o que tinha

	if (file.type.startsWith("image/")) {
		const url = URL.createObjectURL(file);
		const img = document.createElement("img");
		img.src = url;
		img.classList.add("img-thumb");
		fileIcon.appendChild(img);
	} else {
		// se for PDF ou outro, deixa só o quadrado padrão
		fileIcon.textContent = "PDF";
		fileIcon.style.display = "flex";
		fileIcon.style.alignItems = "center";
		fileIcon.style.justifyContent = "center";
		fileIcon.style.fontSize = "10px";
	}
}

// Remover arquivo
removeBtn.addEventListener("click", () => {
	selectedFile = null;
	fileBox.style.display = "none";
});


// ================================
// ENVIAR ARQUIVO COM PROGRESSO REAL
// ================================
function uploadFile() {
	if (!selectedFile) return alert("Nenhum arquivo selecionado.");

	const formData = new FormData();
	formData.append("documento", selectedFile);

	const xhr = new XMLHttpRequest();
	xhr.open("POST", API_UPLOAD, true);
	xhr.setRequestHeader("Authorization", `Bearer ${TOKEN}`);

	xhr.upload.onprogress = function (event) {
		if (event.lengthComputable) {
			const percent = Math.round((event.loaded / event.total) * 100);
			progressFill.style.width = percent + "%";
			progressText.textContent = percent + "%";
		}
	};

	xhr.onload = function () {
		if (xhr.status === 200) {
			progressFill.style.width = "100%";
			progressText.textContent = "100%";
			alert("Arquivo enviado com sucesso!");
		} else {
			alert("Erro ao enviar arquivo.");
		}
	};

	xhr.onerror = () => alert("Erro na requisição.");

	xhr.send(formData);
}

submitBtn.addEventListener("click", uploadFile);


