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
export const pagesRoot = path.join(projectRoot, "public", "Pages")

const app = express();

const port = process.env.PORT || 3001;

app.use(express.static(path.join(projectRoot, "public")));

app.use(express.json());

app.use;

app.get("/", (req, res) => {
    res.sendFile(path.join(pagesRoot, "landingpage.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(pagesRoot, "login.html"));
});
app.get("/signup/1", (req, res) => {
    res.sendFile(path.join(pagesRoot, "cadastro_passo1.html"));
});

app.use("/passenger", passengerRouter);

app.use("/driver", driverRouter);

app.listen(port, () => {
    console.log(`Servidor Express rodando em http://localhost:${port}/`);
});
