# SUMUS Frontend

Arquitetura CSS modular focada em escalabilidade, reutilização de código e manutenção limpa, preparando o terreno para a futura componentização em React.

## Convenção de Nomes e Arquitetura

- **Kebab-case:** Usar `kebab-case` estritamente em todos os arquivos e pastas (ex: `home-passageiro.css`).
- **Arquitetura Global-First:** O layout estrutural de seções inteiras (como o painel administrativo) fica em arquivos globais (ex: `base/admin.css`).

## Estrutura de Diretórios
```text
assets/css/
  base/
    reset.css               # Reset global de CSS e tipografia base
    admin.css               # Layout global do painel (Grid + Sidebar)
  utilities/
    common.css              # Classes utilitárias globais
    scrollbar.css           # Estilização de barras de rolagem
  components/
    dashboard-sidebar.css   # Componente isolado da sidebar lateral
    marketing-footer.css    # Rodapé unificado (site/app)
    marketing-nav.css       # Navegação unificada
  pages/
    admin/
      dashboard.css
      aprovacao-motorista.css
      aprovacao-passageiro.css
      gestao.css
    driver/                 # (Fila para refatoração para o novo padrão)
      cadastro-documento.css
      home-motorista.css
      perfil-motorista.css
      veiculos.css
      metodo-pagamento.css
    passenger/              # (Fila para refatoração para o novo padrão)
      home-passageiro.css
      perfil-passageiro.css
      configuracao.css
      cadastro-cartao.css