import path from "path";
import { Router } from "express";
import { projectRoot } from "./App.js";

const router = Router();

router.get("/signup/2", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "cadastro_passo2.html"));
})
router.get("/signup/3", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "cadastro_passo3.html"));
})
router.get("/signup/4", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "cadastro_passo4.html"));
})
router.get("/signup/5", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "cadastro_passo5.html"));
})

router.get("/account", (req, res) => {
    res.sendFile(path.join(projectRoot, "Pages", "passenger-account.html"))
})

export const passengerRouter = router;
