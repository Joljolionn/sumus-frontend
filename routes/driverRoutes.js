import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { gatewayUrl } from "../app.js";

const driverRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDirname = path.join(__dirname, "..", "pages", "driver");

driverRouter.get("/signup/1", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-motorista-step1.html"),
    );
});

driverRouter.get("/signup/2", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-motorista-step2.html"),
    );
});

driverRouter.get("/signup/3", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-motorista-step3.html"),
    );
});

driverRouter.get("/login", (req, res) => {
    res.sendFile(path.join(localDirname, "login", "login-motorista.html"));
});

driverRouter.get("/", (req, res) => {
    res.sendFile(path.join(localDirname, "home-motorista.html"));
});

driverRouter.get("/cards", (req, res) => {
    res.sendFile(path.join(localDirname, "cadastro-cartao.html"));
});

driverRouter.get("/documents", (req, res) => {
    res.sendFile(path.join(localDirname, "cadastro-documento.html"));
});

driverRouter.get("/otp", (req, res) => {
    res.sendFile(path.join(localDirname, "codigo-otp.html"));
});

driverRouter.get("/config", (req, res) => {
    res.sendFile(path.join(localDirname, "configuracao.html"));
});

driverRouter.get("/history", (req, res) => {
    res.sendFile(path.join(localDirname, "historico.html"));
});

driverRouter.get("/payments", (req, res) => {
    res.sendFile(path.join(localDirname, "metodo-pagamento.html"));
});

driverRouter.get("/profile", (req, res) => {
    res.sendFile(path.join(localDirname, "perfil-motorista.html"));
});

driverRouter.get("/vehicles", (req, res) => {
    res.sendFile(path.join(localDirname, "veiculos.html"));
});

driverRouter.get("/", (req, res) => {
    res.sendFile(path.join(localDirname, "home-motorista.html"));
});

driverRouter.post("/login", async (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }

    try {
        const response = await fetch(gatewayUrl + "/auth/driver/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body),
        });
        if (response.ok) {
            const data = await response.json();
            return res.status(200).json({ token: data.token });
        } else {
            console.error(
                `Gateway respondeu com erro: ${response.status} ${response.statusText}`,
            );
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
    } catch (error) {
        console.error("Falha ao conectar no Gateway.");
        console.error(
            "Dica: Verifique se o container 'api-gateway' está rodando e na mesma rede.",
        );
        console.error(error);
        return res.status(500).json({ error: "Erro interno" });
    }
});

export default driverRouter;
