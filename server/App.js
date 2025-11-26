import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { passengerRouter } from "./PassengerRouter.js";
import { driverRouter } from "./DriverRouter.js";

dotenv.config();

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
export const projectRoot = path.join(__dirname, "..");

const app = express();

const port = process.env.PORT || 3001;

app.use("/assets", express.static(path.join(projectRoot, "assets")));

app.use(express.json());

app.use;

app.get("/", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "landingpage.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "login.html"));
});
app.get("/signup/1", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "cadastro_passo1.html"));
});

app.use("/passenger", passengerRouter);

app.use("/driver", driverRouter);

app.listen(port, () => {
    console.log(`Servidor Express rodando em http://localhost:${port}/`);
});
