import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const adminRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDirname = path.join(__dirname, "..", "pages", "admin");

adminRouter.get("/", (req, res) => {
    res.sendFile(path.join(localDirname, "dashboard.html"));
});

adminRouter.get("/management", (req, res) => {
    res.sendFile(path.join(localDirname, "gestao.html"));
});

adminRouter.get("/approval/driver", (req, res) => {
    res.sendFile(path.join(localDirname, "aprovacao-motorista.html"));
});

adminRouter.get("/approval/passenger", (req, res) => {
    res.sendFile(path.join(localDirname, "aprovacao-passageiro.html"));
});

adminRouter.get("/login", (req, res) => {
    res.sendFile(path.join(localDirname, "login", "loginadmin.html"));
});

export default adminRouter;
