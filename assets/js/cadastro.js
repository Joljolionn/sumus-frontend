document.addEventListener("focusin", function(e) {
    if (e.target.classList.contains("entrada-formulario")) {
        
        const tooltip = document.getElementById("input-tooltip");
        const helpText = e.target.dataset.help;

        if (!helpText) {
            tooltip.style.display = "none";
            return;
        }

        tooltip.innerHTML = helpText;
        tooltip.style.display = "block";

        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = window.scrollY + rect.bottom + 6 + "px";
        tooltip.style.left = rect.left + "px";
    }
});

document.addEventListener("click", function(e) {
    const tooltip = document.getElementById("input-tooltip");
    const isInput = e.target.classList.contains("entrada-formulario");

    if (!isInput && !tooltip.contains(e.target)) {
        tooltip.style.display = "none";
    }
});


// =======================================
// DEFINIR TIPO DE CADASTRO (motorista / usuario)
// =======================================
function setTipoCadastro(tipo) {
	localStorage.setItem("tipoCadastro", tipo);
}

// =======================================
// OBTER CHAVE CERTA
// =======================================
function getStorageKey() {
	const tipo = localStorage.getItem("tipoCadastro") || "usuario";
	return tipo === "motorista" ? "cadastroMotorista" : "cadastroUsuario";
}

// =======================================
// CARREGAR CADASTRO
// =======================================
function getCadastro() {
	return JSON.parse(localStorage.getItem(getStorageKey())) || {};
}

// =======================================
// SALVAR CADASTRO
// =======================================
function saveCadastro(cadastro) {
	localStorage.setItem(getStorageKey(), JSON.stringify(cadastro));
}

// =======================================
// PASSO 1 – TIPO DE CONTA
// =======================================
function initCadastro() {
	if (!localStorage.getItem("cadastroUsuario"))
		localStorage.setItem("cadastroUsuario", JSON.stringify(null));

	if (!localStorage.getItem("cadastroMotorista"))
		localStorage.setItem("cadastroMotorista", JSON.stringify(null));
}

function salvarPasso1() {
	const tipo = document.querySelector(
		'input[name="tipo-conta"]:checked',
	)?.value;
	if (!tipo) return alert("Selecione um tipo de conta.");

	// MOTORISTA
	if (tipo === "motorista") {
		localStorage.setItem("cadastroMotorista", JSON.stringify({}));
		return (location.href = "/driver/signup/2");
	}

	// PASSAGEIRO PRIORITÁRIO
	if (tipo === "prioritario") {
		const data = {
			isPcd: true,
			responsible: null,
			conditions: [],
		};
		localStorage.setItem("cadastroUsuario", JSON.stringify(data));
		return (location.href = "/passenger/signup/2");
	}

	// PASSAGEIRO COMUM
	if (tipo === "comum") {
		const data = {
			isPcd: false,
			conditions: [],
		};
		localStorage.setItem("cadastroUsuario", JSON.stringify(data));
		return (location.href = "cadastro_comum_passo1.html");
	}
}

// =======================================
// PASSO 2 – RESPONSÁVEL (USUÁRIO)
// =======================================
function salvarPasso2() {
	let cadastro = getCadastro();

	const phone = document.getElementById("celular").value.trim();
	const email = document.getElementById("email").value.trim();
	const name = document.getElementById("nome").value.trim();

	cadastro.responsible =
		phone || email || name ? { phone, email, name } : null;

	saveCadastro(cadastro);
	location.href = "/passenger/signup/3";
}

function carregarPasso2() {
	const cadastro = getCadastro();
	if (!cadastro.responsible) return;

	document.getElementById("celular").value = cadastro.responsible.phone ?? "";
	document.getElementById("email").value = cadastro.responsible.email ?? "";
	document.getElementById("nome").value = cadastro.responsible.name ?? "";
}

// =======================================
// VALIDADORES (E-MAIL E SENHA)
// =======================================

// VALIDADORES
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
}

function validarSenha(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(senha);
}

document.addEventListener("click", function (e) {
    const senhaInput = document.getElementById("senha");
    const box = document.getElementById("senha-rules");

    // Se clicou fora do input de senha OU fora da caixa
    if (!senhaInput.contains(e.target) && !box.contains(e.target)) {
        box.style.display = "none";
    }
});

function mostrarRegrasSenha() {
    const box = document.getElementById("senha-rules");
    box.style.display = "block";
}

// =======================================
// MOSTRAR/OCULTAR SENHA
// =======================================
function toggleSenha(idCampo, botao) {
    const campo = document.getElementById(idCampo);
    const isHidden = campo.type === "password";

    campo.type = isHidden ? "text" : "password";

    botao.innerHTML = isHidden
        ? `<svg class="icone-olho" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
             <path d="M12 5c4.97 0 9.24 3.11 11 7-1.06 2.4-3.07 4.47-5.57 5.74l1.45 1.45-1.41 1.41L3.51 4.48l1.41-1.41 3.12 3.12A13.1 13.1 0 0112 5zm-9 7c.8-1.8 2.19-3.38 3.99-4.53l1.52 1.52A7.13 7.13 0 005 12c.8 1.8 2.19 3.38 3.99 4.53l1.52 1.52A13.1 13.1 0 013 12zm9 5a7 7 0 01-7-7c0-.46.05-.91.14-1.35l9.21 9.21A6.93 6.93 0 0112 17z"/>
           </svg>`
        : `<svg class="icone-olho" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
             <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/>
           </svg>`;
}

// =======================================
// VALIDAÇÃO AO DIGITAR — SENHA
// =======================================
function validarSenhaLive() {
    const senha = document.getElementById("senha").value;
    const rulesBox = document.getElementById("senha-rules");

    rulesBox.style.display = "block";

    const rMin = document.getElementById("r-min");
    const rLower = document.getElementById("r-lower");
    const rUpper = document.getElementById("r-upper");
    const rNum = document.getElementById("r-num");
    const rSpecial = document.getElementById("r-special");

    const temMin = senha.length >= 8;
    const temLower = /[a-z]/.test(senha);
    const temUpper = /[A-Z]/.test(senha);
    const temNum = /\d/.test(senha);
    const temSpecial = /[@$!%*?&]/.test(senha);

    toggleRule(rMin, temMin);
    toggleRule(rLower, temLower);
    toggleRule(rUpper, temUpper);
    toggleRule(rNum, temNum);
    toggleRule(rSpecial, temSpecial);

    const input = document.getElementById("senha");

    if (temMin && temLower && temUpper && temNum && temSpecial) {
        input.classList.remove("erro");
        input.classList.add("ok");
    } else {
        input.classList.add("erro");
        input.classList.remove("ok");
    }

    validarConfirmacao();
}

function toggleRule(element, ok) {
    if (ok) element.classList.add("ok");
    else element.classList.remove("ok");
}

// =======================================
// VALIDAÇÃO AO DIGITAR — CONFIRMAR SENHA
// =======================================
function validarConfirmacao() {
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmar-senha");
    const msg = document.getElementById("confirm-msg");

    if (!confirmar.value) {
        confirmar.classList.remove("erro", "ok");
        msg.style.display = "none";
        return;
    }

    msg.style.display = "block";

    if (confirmar.value === senha && senha !== "") {
        confirmar.classList.add("ok");
        confirmar.classList.remove("erro");

        msg.classList.add("ok");
        msg.textContent = "As senhas coincidem.";
    } else {
        confirmar.classList.add("erro");
        confirmar.classList.remove("ok");

        msg.classList.remove("ok");
        msg.textContent = "As senhas devem ser iguais.";
    }
}

// =======================================
// PASSO 3 – DADOS PESSOAIS USUÁRIO
// =======================================
function salvarPasso3Usuario() {
	const nome = document.getElementById("nome-completo").value.trim();
	const email = document.getElementById("email").value.trim();
	const celular = document.getElementById("celular").value.trim();
	const cond = document.getElementById("condictions").value.trim();
	const senha = document.getElementById("senha").value.trim();
	const confirmar = document.getElementById("confirmar-senha").value.trim();

  // revalida ao enviar
  if (!validarEmail(email)) return;
  if (!validarSenha(senha)) return;
  if (senha !== confirmar) return;

	let cadastro = getCadastro();

	cadastro.name = nome;
	cadastro.email = email;
	cadastro.phone = celular;
	cadastro.password = senha;
	cadastro.conditions = cond ? cond.split(",").map((c) => c.trim()) : [];

	saveCadastro(cadastro);
	location.href = "/passenger/signup/4";
}

// =======================================
// CARREGAR PASSO 3
// =======================================
function carregarPasso3Usuario() {
	const cadastro = getCadastro();

	document.getElementById("nome-completo").value = cadastro.name ?? "";
	document.getElementById("email").value = cadastro.email ?? "";
	document.getElementById("celular").value = cadastro.phone ?? "";
	document.getElementById("condictions").value =
		cadastro.conditions?.join(", ") ?? "";
}

// =======================================
// PASSO 4 – OTP USUÁRIO
// =======================================
function salvarPasso4Usuario() {
	const inputs = document.querySelectorAll(".entrada-otp");
	let codigo = [...inputs].map((i) => i.value.trim()).join("");

	if (codigo.length !== 6) return alert("Digite os 6 dígitos.");

	//let cadastro = getCadastro();
	//cadastro.otp = codigo;

	//saveCadastro(cadastro);
	location.href = "/passenger/signup/5";
}

function carregarPasso4Usuario() {
	const cadastro = getCadastro();
	if (!cadastro?.otp) return;

	const inputs = document.querySelectorAll(".entrada-otp");
	inputs.forEach((input, i) => (input.value = cadastro.otp[i] ?? ""));
}

// =======================================
// PASSO 1 MOTORISTA
// =======================================
function salvarMotoristaPasso1() {
	const nome = document.getElementById("nomeMotorista").value.trim();
	const email = document.getElementById("emailMotorista").value.trim();
	const phone = document.getElementById("celularMotorista").value.trim();
	const senha = document.getElementById("senhaMotorista").value.trim();
	const confirmar = document
		.getElementById("confirmarSenhaMotorista")
		.value.trim();

	if (senha !== confirmar) return alert("As senhas não conferem.");

	const cadastro = { name: nome, email, phone, password: senha };

	setTipoCadastro("motorista");
	saveCadastro(cadastro);

	location.href = "/driver/signup/3";
}

function carregarMotoristaPasso1() {
	const cadastro = getCadastro();

	document.getElementById("nomeMotorista").value = cadastro.name ?? "";
	document.getElementById("emailMotorista").value = cadastro.email ?? "";
	document.getElementById("celularMotorista").value = cadastro.phone ?? "";
}

// =======================================
// OTP MOTORISTA
// =======================================
function salvarMotoristaPasso2() {
	const inputs = document.querySelectorAll(".entrada-otp");
	let codigo = [...inputs].map((i) => i.value.trim()).join("");

	if (codigo.length !== 6) return alert("Digite os 6 dígitos.");

	//let cadastro = getCadastro();
	//cadastro.otp = codigo;

	//saveCadastro(cadastro);
	location.href = "/driver/signup/4";
}

function carregarMotoristaPasso2() {
	const cadastro = getCadastro();
	if (!cadastro?.otp) return;

	const inputs = document.querySelectorAll(".entrada-otp");
	inputs.forEach((input, i) => (input.value = cadastro.otp[i] ?? ""));
}

// =======================================
// OTP AUTO-TAB
// =======================================
function ativarOtpAutoTab() {
	document.querySelectorAll(".entrada-otp").forEach((input, index, arr) => {
		input.addEventListener("input", () => {
			input.value = input.value.replace(/\D/g, "");
			if (input.value.length === 1 && index < arr.length - 1)
				arr[index + 1].focus();
		});

		input.addEventListener("keydown", (e) => {
			if (e.key === "Backspace" && input.value === "" && index > 0)
				arr[index - 1].focus();
		});
	});
}

// =======================================
// UPLOAD – SUPORTE MULTI ÁREA
// =======================================
let cadastroDocs = getCadastro();
cadastroDocs.documentos = cadastroDocs.documentos || [];

document.querySelectorAll(".upload-area").forEach((area, index) => {
	const input = area.querySelector("input[type='file']");
	const preview = area.querySelector(".preview-area");
	const label = area.querySelector(".upload-label");

	let arquivos = [];
	area.dataset.areaIndex = index;

	area.addEventListener("click", () => input.click());
	area.addEventListener("dragover", (e) => {
		e.preventDefault();
		area.classList.add("drag-over");
	});
	area.addEventListener("dragleave", () =>
		area.classList.remove("drag-over"),
	);
	area.addEventListener("drop", (e) => {
		e.preventDefault();
		area.classList.remove("drag-over");
		handleFiles(e.dataTransfer.files, arquivos, preview, label, index);
	});

	input.addEventListener("change", (e) => {
		handleFiles(e.target.files, arquivos, preview, label, index);
	});
});

// =======================================
// LIDAR COM ARQUIVOS
// =======================================
function handleFiles(
	files,
	arquivosLocal,
	previewArea,
	uploadLabel,
	areaIndex,
) {
	esconderMensagem(uploadLabel);

	[...files].forEach((file) => {
		const isImage = file.type.startsWith("image/");
		const isPdf = file.type === "application/pdf";
		const isDoc = file.name.endsWith(".docx") || file.type === "text/plain";

		if (!isImage && !isPdf && !isDoc) {
			alert(`Arquivo não permitido: ${file.name}`);
			return;
		}

		converterArquivo(file).then((base64) => {
			const doc = {
				id: crypto.randomUUID(),
				nome: file.name,
				tipo: file.type,
				base64,
				area: areaIndex,
			};

			arquivosLocal.push(doc);
			cadastroDocs.documentos.push(doc);

			gerarPreviewCard(doc, previewArea, arquivosLocal);
		});
	});
}

// =======================================
// PREVIEW
// =======================================
function gerarPreviewCard(doc, previewArea, arquivosLocal) {
	const isPdf = doc.tipo === "application/pdf";
	const card = document.createElement("div");

	card.className = "file-card";
	card.dataset.id = doc.id;

	const thumb = document.createElement(isPdf ? "iframe" : "img");
	thumb.className = isPdf ? "pdf-thumb" : "img-thumb";
	thumb.src = isPdf ? `${doc.base64}#page=1&toolbar=0` : doc.base64;

	const meta = document.createElement("div");
	meta.className = "file-meta";
	meta.innerHTML = `
        <div class="file-name">${encurtarNome(doc.nome, 30)}</div>
        <div class="file-size">Documento</div>
    `;

	const actions = document.createElement("div");
	actions.className = "file-actions";
	actions.innerHTML = `<a href="${doc.base64}" target="_blank">Abrir</a>`;

	const deletar = document.createElement("button");
	deletar.className = "delete-btn";
	deletar.textContent = "×";
	deletar.onclick = () => removerArquivo(doc.id, arquivosLocal, previewArea);

	card.appendChild(deletar);
	card.appendChild(thumb);
	card.appendChild(meta);
	card.appendChild(actions);

	previewArea.appendChild(card);
}

// =======================================
// REMOVER DOCUMENTO
// =======================================
function removerArquivo(id, arquivosLocal, previewArea) {
	arquivosLocal = arquivosLocal.filter((a) => a.id !== id);
	cadastroDocs.documentos = cadastroDocs.documentos.filter(
		(a) => a.id !== id,
	);

	const card = previewArea.querySelector(`[data-id="${id}"]`);
	if (card) card.remove();
}

// =======================================
// SALVAR DOCUMENTOS (PASSAGEIRO OU MOTORISTA)
// =======================================
function salvarDocumentos() {
	if (!cadastroDocs.documentos || cadastroDocs.documentos.length === 0) {
		return alert("Envie pelo menos 1 documento!");
	}

	saveCadastro(cadastroDocs);
	alert("Documentos enviados com sucesso!");
	console.log("JSON FINAL:", cadastroDocs);
}

// =======================================
// HELPERS
// =======================================
function esconderMensagem(label) {
	if (label) label.style.display = "none";
}

function encurtarNome(str, max) {
	return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function converterArquivo(file) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.readAsDataURL(file);
	});
}

async function pularEnvioDocumentos() {
	let cadastro = getCadastro();

	// 1. Lógica de atualização e salvamento local (síncrono)
	cadastro.documentos = cadastro.documentos || [];
	cadastro.status = "pendente_documentos";
	saveCadastro(cadastro); // Salva no localStorage (síncrono)

	// 2. Lógica de envio da requisição (assíncrono)
	const storageKey = getStorageKey();

	const BASE_URL =
		storageKey === "cadastroMotorista"
			? "http://localhost:8080/driver/"
			: "http://localhost:8080/passenger/";

	try {
		const response = await fetch(BASE_URL + "signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			// Envia o objeto 'cadastro' atualizado como corpo da requisição
			body: JSON.stringify(cadastro),
		});

		// 3. Verifica o sucesso do envio
		if (!response.ok) {
			const errorText = await response.text();
			console.error("Detalhes do erro:", errorText);
			// Lança um erro que será capturado pelo bloco catch abaixo
			throw new Error(
				`Erro ao finalizar cadastro. Status: ${response.status}`,
			);
		}

		// 4. Redireciona somente se a requisição foi bem-sucedida
		location.href = "/login";
	} catch (error) {
		// 5. Trata erros
		console.error("Erro ao enviar cadastro para o servidor:", error);
		alert(
			"Não foi possível finalizar o cadastro no servidor. Tente novamente.",
		);
	}
}
