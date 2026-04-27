import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// carregar variáveis de ambiente
dotenv.config();

// resolver __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());

// servir arquivos estáticos (css, js, imagens)
app.use(express.static(__dirname));


//  ROTA PRINCIPAL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


//  ROTAS DINÂMICAS DRIVER
app.get("/driver/:page", (req, res) => {
    const filePath = path.join(
        __dirname,
        "pages",
        "driver",
        `${req.params.page}.html`
    );

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("Página não encontrada");
        }
    });
});


//  ROTAS DINÂMICAS PASSENGER (opcional)
app.get("/passenger/:page", (req, res) => {
    const filePath = path.join(
        __dirname,
        "pages",
        "passenger",
        `${req.params.page}.html`
    );

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("Página não encontrada");
        }
    });
});

app.get("/admin/:page", (req, res) => {
    const filePath = path.join(
        __dirname,
        "pages",
        "admin",
        `${req.params.page}.html`
    );

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("Página não encontrada");
        }
    });
});

//  LOGIN DRIVER
app.post("/login/driver", (req, res) => {
    const { email, senha } = req.body;

    console.log("Driver:", email, senha);

    res.json({ message: "Login driver recebido" });
});


//  LOGIN PASSENGER
app.post("/login/passenger", (req, res) => {
    const { email, senha } = req.body;

    console.log("Passenger:", email, senha);

    res.json({ message: "Login passenger recebido" });
});

//  LOGIN ADMIN
app.post("/login/admin", (req, res) => {
    const { email, senha } = req.body;

    console.log("Admin:", email, senha);

    res.json({ message: "Login admin recebido" });
});


//  iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});