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

// Executa na abertura da página
initCadastro();
