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

// Executa na abertura da página
initCadastro();
