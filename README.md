# SUMUS Frontend

Arquitetura de CSS organizada para manutencao incremental

## Convencao de nomes

- usar `kebab-case` em arquivos e pastas
- nomes da pagina e do diretorio CSS correspondente devem bater
- `index.css` continua como ponto de entrada de cada pagina
- modulos internos podem seguir por responsabilidade: `tokens.css`, `layout.css`, `form.css`, `cards.css`, `gps.css`, `settings.css`

## Estrutura

```text
assets/css/
  base/
    reset.css
  utilities/
    common.css
    scrollbar.css
  components/
    dashboard-sidebar.css
    map-core.css
    marketing-footer.css
    marketing-nav.css
  pages/
    cadastro-step-0/
    home/
    login/
    driver/
      cadastro-documento/
      cadastro-step-1/
      codigo-otp/
      home-motorista/
      perfil-motorista/
    passenger/
      home-passageiro/
      perfil-passageiro/
```

## Regras de manutencao

1. Ajustes globais:
   editar `base/`, `utilities/` ou `components/`.
2. Ajustes de uma pagina:
   editar somente o diretorio em `assets/css/pages/...`.
3. Nova pagina:
   criar um diretorio novo em `assets/css/pages/...` com `index.css` e modulos menores por responsabilidade.

## Entradas HTML

- `pages/home.html` -> `assets/css/pages/home/index.css`
- `pages/login.html` -> `assets/css/pages/login/index.css`
- `pages/cadastro-step-0.html` -> `assets/css/pages/cadastro-step-0/index.css`
- `pages/driver/cadastro-documento.html` -> `assets/css/pages/driver/cadastro-documento/index.css`
- `pages/driver/cadastro-step-1.html` -> `assets/css/pages/driver/cadastro-step-1/index.css`
- `pages/driver/codigo-otp.html` -> `assets/css/pages/driver/codigo-otp/index.css`
- `pages/driver/home-motorista.html` -> `assets/css/pages/driver/home-motorista/index.css`
- `pages/driver/perfil-motorista.html` -> `assets/css/pages/driver/perfil-motorista/index.css`
- `pages/passenger/home-passageiro.html` -> `assets/css/pages/passenger/home-passageiro/index.css`
- `pages/passenger/perfil-passageiro.html` -> `assets/css/pages/passenger/perfil-passageiro/index.css`

## Servidor Express

- iniciar em desenvolvimento: `npm run dev`
- iniciar normalmente: `npm start`
- `index.html` e cada arquivo em `pages/**/*.html` sao publicados automaticamente pelo Express
- a URL canonica remove a extensao `.html`

Exemplos:

- `index.html` -> `/`
- `pages/cadastro-step-0.html` -> `/cadastro-step-0`
- `pages/driver/login.html` -> `/driver/login`
- `pages/admin/dashboard.html` -> `/admin/dashboard`

Compatibilidade:

- URLs antigas com `.html` continuam funcionando por redirecionamento
- URLs antigas com prefixo `/pages/...` tambem redirecionam para a rota canonica
- arquivos estaticos ficam expostos em `/assets`
aqui ta pegando

