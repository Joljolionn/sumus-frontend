// Inicializa o objeto de cadastro se ainda não existir
function initCadastro() {
    if (!localStorage.getItem("cadastroUsuario")) {
        localStorage.setItem("cadastroUsuario", JSON.stringify({}));
    }
}

// Salva o tipo de conta no LocalStorage
function salvarPasso1() {
    const tipoContaSelecionado = document.querySelector('input[name="tipo-conta"]:checked').value;

    let cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    cadastro.tipoConta = tipoContaSelecionado;

    localStorage.setItem("cadastroUsuario", JSON.stringify(cadastro));

    // Vai para o próximo passo
    window.location.href = "cadastro_passo2.html";
}
//carrega caso a pessoa volte
function carregarPasso1() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario"));

    if (!cadastro || !cadastro.tipoConta) return;

    const tipo = cadastro.tipoConta;

    const input = document.querySelector(`input[name="tipo-conta"][value="${tipo}"]`);
    if (input) {
        input.checked = true;
    }
}


// Salvar passo 2
function salvarPasso2() {
    const celular = document.getElementById("celular").value.trim();
    const email = document.getElementById("email").value.trim();
    const nome = document.getElementById("nome").value.trim();

    let cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    cadastro.responsavel = {
        celular: celular || null,
        email: email || null,
        nome: nome || null
    };

    localStorage.setItem("cadastroUsuario", JSON.stringify(cadastro));

    window.location.href = "cadastro_passo3.html";
}
//funcao para caso a pessoa volte para a pagina
function carregarPasso2() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    if (cadastro.responsavel) {
        document.getElementById("celular").value = cadastro.responsavel.celular ?? "";
        document.getElementById("email").value = cadastro.responsavel.email ?? "";
        document.getElementById("nome").value = cadastro.responsavel.nome ?? "";
    }
}

//salvar passo 3
function salvarPasso3() {
    const nome = document.getElementById("nome-completo").value.trim();
    const email = document.getElementById("email").value.trim();
    const celular = document.getElementById("celular").value.trim();
    const grupo = document.getElementById("grupo").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    // Validação básica só da senha
    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    let cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    cadastro.dadosBasicos = {
        nome,
        email,
        celular,
        grupo,
        senha
    };

    localStorage.setItem("cadastroUsuario", JSON.stringify(cadastro));

    window.location.href = "cadastro_passo4.html";

}
//carregar caso volte 
function carregarPasso3() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario"));
    if (!cadastro || !cadastro.dadosBasicos) return;

    const dados = cadastro.dadosBasicos;

    document.getElementById("nome-completo").value = dados.nome || "";
    document.getElementById("email").value = dados.email || "";
    document.getElementById("celular").value = dados.celular || "";
    document.getElementById("grupo").value = dados.grupo || "";
}

// passo 4
function salvarPasso4() {
    const inputs = document.querySelectorAll(".entrada-otp");
    let codigo = "";

    inputs.forEach(input => codigo += input.value.trim());

    if (codigo.length !== 6) {
        alert("Digite todos os 6 dígitos do código.");
        return;
    }

    let cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    cadastro.verificacao = {
        codigoOtp: codigo
    };

    localStorage.setItem("cadastroUsuario", JSON.stringify(cadastro));

    window.location.href = "cadastro_passo5.html";
}
//carregar passo 4 caso a pessoa volte
function carregarPasso4() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario"));

    if (!cadastro || !cadastro.verificacao) return;

    const codigo = cadastro.verificacao.codigoOtp;
    const inputs = document.querySelectorAll(".entrada-otp");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = codigo[i] ?? "";
    }
}
//funcao pra pular de otp para a outra
function ativarOtpAutoTab() {
    const inputs = document.querySelectorAll(".entrada-otp");

    inputs.forEach((input, index) => {
        input.addEventListener("input", () => {

            // Mantém só números
            input.value = input.value.replace(/\D/g, "");

            // Move para o próximo automaticamente
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // Backspace volta para o anterior
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && input.value === "" && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}


//passo 5 (segura essa bomba ai)
// =========================================
//  PASSO 5 - UPLOAD DE DOCUMENTOS (COMPLETO)
// =========================================

// Elementos principais
const uploadArea  = document.getElementById("uploadArea");
const fileInput   = document.getElementById("fileInput");
const previewArea = document.querySelector(".preview-area");
const uploadLabel = document.querySelector(".upload-label");

// Lista para salvar os arquivos (base64)
let arquivosConvertidos = [];

// =========================================
//  SALVAR PASSO 5
// =========================================

function salvarPasso5() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario")) || {};

    if (arquivosConvertidos.length === 0) {
        alert("Envie pelo menos 1 documento antes de continuar.");
        return;
    }

    cadastro.documentos = arquivosConvertidos;

    localStorage.setItem("cadastroUsuario", JSON.stringify(cadastro));

    alert("Arquivos enviados com sucesso!");
    console.log("JSON FINAL:", cadastro);

    // Redirecionar depois
    // location.href = "cadastro_finalizado.html";
}


// =========================================
//  INICIALIZAÇÃO (carregar algo salvo antes)
// =========================================

function carregarPasso5() {
    const cadastro = JSON.parse(localStorage.getItem("cadastroUsuario"));

    if (!cadastro || !cadastro.documentos) return;

    // recarrega previews se existir algo salvo
    cadastro.documentos.forEach(doc => {
        arquivosConvertidos.push(doc);
        gerarPreviewCardRecarregado(doc);
    });

    if (cadastro.documentos.length > 0) {
        esconderMensagemUpload();
    }
}


// =========================================
//  EVENTOS DE UPLOAD
// =========================================

uploadArea.addEventListener("click", () => fileInput.click());

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

fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
});


// =========================================
//  TRATAR ARQUIVOS
// =========================================

function handleFiles(files) {
    esconderMensagemUpload();

    [...files].forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isPdf   = file.type === "application/pdf";

        if (!isImage && !isPdf) {
            alert(`Formato não suportado: ${file.name}`);
            return;
        }

        converterArquivo(file).then((base64) => {
            const id = Date.now() + Math.random();

            const doc = {
                id,
                nome: file.name,
                tipo: file.type,
                base64: base64
            };

            arquivosConvertidos.push(doc);

            gerarPreviewCard(doc);
        });
    });
}


// =========================================
//  GERAR PREVIEW (NOVOS ARQUIVOS)
// =========================================

function gerarPreviewCard(doc) {
    const isPdf = doc.tipo === "application/pdf";

    const card = document.createElement("div");
    card.className = "file-card";
    card.dataset.id = doc.id;

    // Thumb
    const thumb = document.createElement(isPdf ? "iframe" : "img");
    thumb.className = isPdf ? "pdf-thumb" : "img-thumb";
    thumb.src = isPdf ? `${doc.base64}#page=1&toolbar=0` : doc.base64;

    // Texto
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.innerHTML = `
        <div class="file-name">${encurtarNome(doc.nome, 25)}</div>
        <div class="file-size">Documento</div>
    `;

    // Ações
    const actions = document.createElement("div");
    actions.className = "file-actions";
    actions.innerHTML = `<a href="${doc.base64}" target="_blank">Abrir</a>`;

    // Botão excluir
    const deletar = document.createElement("button");
    deletar.className = "delete-btn";
    deletar.textContent = "×";
    deletar.addEventListener("click", () => removerArquivo(doc.id));

    // Montar card
    card.appendChild(deletar);
    card.appendChild(thumb);
    card.appendChild(meta);
    card.appendChild(actions);

    previewArea.appendChild(card);
}


// =========================================
//  GERAR PREVIEW (ARQUIVOS DO LOCALSTORAGE)
// =========================================

function gerarPreviewCardRecarregado(doc) {
    gerarPreviewCard(doc);
}


// =========================================
//  REMOVER ARQUIVO
// =========================================

function removerArquivo(id) {
    arquivosConvertidos = arquivosConvertidos.filter(a => a.id !== id);

    const card = previewArea.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();

    if (arquivosConvertidos.length === 0) {
        uploadLabel.style.display = "block";
    }
}


// =========================================
//  FUNÇÕES AUXILIARES
// =========================================

function esconderMensagemUpload() {
    if (uploadLabel) uploadLabel.style.display = "none";
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


// =========================================
//  INICIAR
// =========================================

carregarPasso5();
    


// Executa na abertura da página
initCadastro();
