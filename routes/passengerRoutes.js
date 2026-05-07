import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { gatewayUrl } from "../app.js";

const passengerRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDirname = path.join(__dirname, "..", "pages", "passenger");

passengerRouter.get("/signup/1", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-passageiro-step1.html"),
    );
});

passengerRouter.get("/signup/2", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-passageiro-step2.html"),
    );
});

passengerRouter.get("/signup/3", (req, res) => {
    res.sendFile(
        path.join(localDirname, "cadastro", "cadastro-passageiro-step3.html"),
    );
});

passengerRouter.get("/login", (req, res) => {
    res.sendFile(path.join(localDirname, "login", "login-passageiro.html"));
});

passengerRouter.get("/", (req, res) => {
    res.sendFile(path.join(localDirname, "home-passageiro.html"));
});

passengerRouter.get("/config", (req, res) => {
    res.sendFile(path.join(localDirname, "configuracao.html"));
});

passengerRouter.get("/cards", (req, res) => {
    res.sendFile(path.join(localDirname, "cadastro-cartao.html"));
});

passengerRouter.get("/profile", (req, res) => {
    res.sendFile(path.join(localDirname, "perfil-passageiro.html"));
});

passengerRouter.post("/login", async (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }

    try {
        const response = await fetch(gatewayUrl + "/auth/passenger/login", {
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

export default passengerRouter;
