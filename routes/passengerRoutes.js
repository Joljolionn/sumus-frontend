import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

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

export default passengerRouter;
