// Importa módulos necessários
const fs = require("fs");           // leitura de arquivos
const path = require("path");       // manipulação de caminhos
const dotenv = require("dotenv");   // variáveis de ambiente
const express = require("express"); // framework web

// Carrega variáveis do .env
dotenv.config({ quiet: true });

// Diretórios base do projeto
const ROOT_DIR = __dirname;
const PAGES_DIR = path.join(ROOT_DIR, "pages");   // pasta de páginas HTML
const ASSETS_DIR = path.join(ROOT_DIR, "assets"); // CSS, JS, imagens
const LANDING_PAGE = path.join(ROOT_DIR, "index.html");

// Porta do servidor
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

// Script de navegação que será injetado automaticamente
const NAVIGATION_SCRIPT_TAG = '<script src="/assets/js/shared/navigation.js"></script>';


// Converte caminho do sistema para padrão web (usa "/")
function toPosixPath(value) {
  return value.split(path.sep).join("/");
}


// Normaliza nomes de rota (remove acento, espaço vira "-")
function normalizeRouteSegment(segment) {
  return segment
    .normalize("NFD")                // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "-")            // espaço → hífen
    .toLowerCase();
}


// Percorre pasta recursivamente e pega todos HTML
function collectHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    // Se for pasta, entra nela
    if (entry.isDirectory()) {
      return collectHtmlFiles(entryPath);
    }

    // Se for HTML, adiciona
    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}


// Cria definição de rota para cada página
function createPageDefinition(filePath) {
  const relativePath = toPosixPath(path.relative(PAGES_DIR, filePath));

  // Remove .html da rota
  const routePath = relativePath.replace(/\.html$/i, "");

  // Normaliza rota (sem acento, etc)
  const normalizedRoutePath = routePath
    .split("/")
    .map(normalizeRouteSegment)
    .join("/");

  const rawRoute = `/${routePath}`;
  const canonicalRoute = `/${normalizedRoutePath}`;

  // Cria aliases (variações de acesso)
  const aliases = new Set([
    rawRoute,
    `${rawRoute}.html`,
    `${canonicalRoute}.html`,
    `/pages/${routePath}.html`,
    `/pages/${normalizedRoutePath}.html`,
  ]);

  // Remove duplicado da principal
  aliases.delete(canonicalRoute);

  return {
    filePath,
    canonicalRoute, // rota oficial
    aliases: [...aliases], // variações
  };
}


// Monta todas as páginas do sistema
function buildPageRegistry() {
  const contentPages = collectHtmlFiles(PAGES_DIR)
    .map(createPageDefinition)
    .sort((a, b) => a.canonicalRoute.localeCompare(b.canonicalRoute));

  return [
    {
      filePath: LANDING_PAGE,
      canonicalRoute: "/", // página inicial
      aliases: ["/index", "/index.html"],
    },
    ...contentPages,
  ];
}


// Cria registros de páginas
const pageRegistry = buildPageRegistry();

// Maps para busca rápida
const pageFileLookup = new Map();   // rota → arquivo
const pageAliasLookup = new Map();  // alias → rota oficial


// Registra variações de rota no mapa
function registerLookupEntry(lookup, routePath, value) {
  lookup.set(routePath, value);
  lookup.set(routePath.normalize("NFC"), value);
  lookup.set(routePath.normalize("NFD"), value);
}


// Preenche os maps
for (const page of pageRegistry) {
  registerLookupEntry(pageFileLookup, page.canonicalRoute, page.filePath);

  for (const alias of page.aliases) {
    registerLookupEntry(pageAliasLookup, alias, page.canonicalRoute);
  }
}


// Injeta script de navegação no HTML automaticamente
function injectSharedScripts(html) {
  // Se já tem, não duplica
  if (html.includes(NAVIGATION_SCRIPT_TAG)) {
    return html;
  }

  // Insere antes do </body>
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${NAVIGATION_SCRIPT_TAG}\n</body>`);
  }

  // Se não tiver body, adiciona no final
  return `${html}\n${NAVIGATION_SCRIPT_TAG}`;
}


// Envia HTML como resposta
function sendHtml(filePath, res) {
  fs.readFile(filePath, "utf8", (error, html) => {
    if (error) {
      res.status(500).send("Nao foi possivel carregar a pagina.");
      return;
    }

    res.type("html").send(injectSharedScripts(html));
  });
}


// Gera variações de rota (decodificada + unicode)
function getRouteVariants(routePath) {
  const decodedPath = decodeURIComponent(routePath);

  const variants = new Set([routePath, decodedPath]);

  for (const value of [...variants]) {
    variants.add(value.normalize("NFC"));
    variants.add(value.normalize("NFD"));
  }

  return [...variants];
}


// Resolve requisição de página
function resolvePageRequest(routePath) {
  for (const routeVariant of getRouteVariants(routePath)) {

    // Busca direta
    const filePath = pageFileLookup.get(routeVariant);
    if (filePath) {
      return { type: "page", filePath };
    }

    // Busca por alias
    const canonicalRoute = pageAliasLookup.get(routeVariant);
    if (canonicalRoute) {
      return { type: "redirect", canonicalRoute };
    }
  }

  return null;
}


// Cria aplicação Express
function createApp() {
  const app = express();

  app.disable("x-powered-by"); // remove header por segurança
  app.use(express.json());

  // Serve arquivos estáticos (CSS, JS, imagens)
  app.use(
    "/assets",
    express.static(ASSETS_DIR, {
      extensions: false,
      index: false,
    })
  );

  // Endpoint de saúde do servidor
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      pages: pageRegistry.length,
    });
  });

  // Middleware principal de roteamento
  app.use((req, res, next) => {

    // Só trata GET/HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    const resolvedRequest = resolvePageRequest(req.path);

    // Se não encontrou rota
    if (!resolvedRequest) {
      next();
      return;
    }

    // Se for alias → redireciona
    if (resolvedRequest.type === "redirect") {
      res.redirect(302, resolvedRequest.canonicalRoute);
      return;
    }

    // Se for página → envia HTML
    sendHtml(resolvedRequest.filePath, res);
  });

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).send("Pagina nao encontrada.");
  });

  return app;
}


// Cria app
const app = createApp();


// Em vez de localStorage, usamos um array no servidor
let db_requests = []; 

// --- REUSE SUAS FUNÇÕES DE SANITIZE AQUI ---
// (Mantenha sanitizeRequest, sanitizeParty, etc., mas remova as referências a 'window')

function getRequests() {
  return db_requests.filter(Boolean).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// --- ROTAS DA API ---

// Listar todas ou pendentes
app.get('/requests', (req, res) => {
  const status = req.query.status;
  let requests = getRequests();
  
  if (status === 'searching') {
    requests = requests.filter(r => r.status === 'searching');
  }
  
  res.json(requests);
});

// Criar ou Atualizar (o antigo upsertRequest)
app.post('/requests', (req, res) => {
  const rawRequest = req.body;
  const nextRequest = sanitizeRequest({
    ...rawRequest,
    updatedAt: new Date().toISOString(),
  });

  if (!nextRequest) return res.status(400).json({ error: "Dados inválidos" });

  const existingIndex = db_requests.findIndex(r => r.id === nextRequest.id);
  if (existingIndex >= 0) {
    db_requests[existingIndex] = nextRequest;
  } else {
    db_requests.push(nextRequest);
  }

  res.json(nextRequest);
});

// Aceitar uma solicitação
app.post('/requests/:id/accept', (req, res) => {
  const requestId = req.params.id;
  const driver = req.body.driver;

  // Aqui você cola a lógica da sua função acceptRequest original,
  // adaptando o retorno para res.json(...)
  // ... lógica de validação ...
  
  res.json({ ok: true, request: updatedRequest });
});

// Inicia servidor
function startServer(port = PORT) {
  return app.listen(port, '0.0.0.0', () => {
    console.log(
      `Servidor rodando em http://localhost:${port} com ${pageRegistry.length} paginas registradas.`
    );
  });
}


// Executa só se for arquivo principal
if (require.main === module) {
  startServer();
}


// Exporta para uso externo (testes, etc)
module.exports = {
  app,
  createApp,
  pageRegistry,
  startServer,
};
