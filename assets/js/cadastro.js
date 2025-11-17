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
    const tipo = document.querySelector('input[name="tipo-conta"]:checked')?.value;
    if (!tipo) return alert("Selecione um tipo de conta.");

    // MOTORISTA
    if (tipo === "motorista") {
        localStorage.setItem("cadastroMotorista", JSON.stringify({}));
        return location.href = "cadastro_motorista_passo1.html";
    }

    // PASSAGEIRO PRIORITÁRIO
    if (tipo === "prioritario") {
        const data = {
            isPcd: true,
            responsible: null,
            conditions: []
        };
        localStorage.setItem("cadastroUsuario", JSON.stringify(data));
        return location.href = "cadastro_passo2.html";
    }

    // PASSAGEIRO COMUM
    if (tipo === "comum") {
        const data = {
            isPcd: false,
            conditions: []
        };
        localStorage.setItem("cadastroUsuario", JSON.stringify(data));
        return location.href = "cadastro_comum_passo1.html";
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

    cadastro.responsible = phone || email || name ? { phone, email, name } : null;

    saveCadastro(cadastro);
    location.href = "cadastro_passo3.html";
}

function carregarPasso2() {
    const cadastro = getCadastro();
    if (!cadastro.responsible) return;

    document.getElementById("celular").value = cadastro.responsible.phone ?? "";
    document.getElementById("email").value = cadastro.responsible.email ?? "";
    document.getElementById("nome").value = cadastro.responsible.name ?? "";
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

    if (senha !== confirmar) return alert("As senhas não coincidem.");

    let cadastro = getCadastro();

    cadastro.name = nome;
    cadastro.email = email;
    cadastro.phone = celular;
    cadastro.password = senha;
    cadastro.conditions = cond ? cond.split(",").map(c => c.trim()) : [];

    saveCadastro(cadastro);
    location.href = "cadastro_passo4.html";
}

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
    let codigo = [...inputs].map(i => i.value.trim()).join("");

    if (codigo.length !== 6) return alert("Digite os 6 dígitos.");

    //let cadastro = getCadastro();
    //cadastro.otp = codigo;

    //saveCadastro(cadastro);
    location.href = "cadastro_passo5.html";
}

function carregarPasso4Usuario() {
    const cadastro = getCadastro();
    if (!cadastro?.otp) return;

    const inputs = document.querySelectorAll(".entrada-otp");
    inputs.forEach((input, i) => input.value = cadastro.otp[i] ?? "");
}

// =======================================
// PASSO 1 MOTORISTA
// =======================================
function salvarMotoristaPasso1() {
    const nome = document.getElementById("nomeMotorista").value.trim();
    const email = document.getElementById("emailMotorista").value.trim();
    const phone = document.getElementById("celularMotorista").value.trim();
    const senha = document.getElementById("senhaMotorista").value.trim();
    const confirmar = document.getElementById("confirmarSenhaMotorista").value.trim();

    if (senha !== confirmar) return alert("As senhas não conferem.");

    const cadastro = { name: nome, email, phone, password: senha };

    setTipoCadastro("motorista");
    saveCadastro(cadastro);

    location.href = "cadastro_motorista_passo2.html";
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
    let codigo = [...inputs].map(i => i.value.trim()).join("");

    if (codigo.length !== 6) return alert("Digite os 6 dígitos.");

    //let cadastro = getCadastro();
    //cadastro.otp = codigo;

    //saveCadastro(cadastro);
    location.href = "cadastro_motorista_passo3.html";
}

function carregarMotoristaPasso2() {
    const cadastro = getCadastro();
    if (!cadastro?.otp) return;

    const inputs = document.querySelectorAll(".entrada-otp");
    inputs.forEach((input, i) => input.value = cadastro.otp[i] ?? "");
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
    area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("drag-over"); });
    area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
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
function handleFiles(files, arquivosLocal, previewArea, uploadLabel, areaIndex) {
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
                area: areaIndex
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
    arquivosLocal = arquivosLocal.filter(a => a.id !== id);
    cadastroDocs.documentos = cadastroDocs.documentos.filter(a => a.id !== id);

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
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function pularEnvioDocumentos() {
  let cadastro = getCadastro();

  // garante que existe o objeto / arrays
  cadastro.documentos = cadastro.documentos || [];

  // opcional: marcar status
  cadastro.status = "pendente_documentos";

  saveCadastro(cadastro);

  // redireciona onde quiser
  location.href = "passenger-account.html";
}
