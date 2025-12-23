import { Router } from "express";
import path from "path";
import { projectRoot } from "./App.js";

const router = Router();

router.get("/signup/2", (req, res) => {
	res.sendFile(
		path.join(pagesRoot, "cadastro_motorista_passo1.html"),
	);
});

router.get("/signup/3", (req, res) => {
	res.sendFile(
		path.join(pagesRoot, "cadastro_motorista_passo2.html"),
	);
});
router.get("/signup/4", (req, res) => {
	res.sendFile(
		path.join(pagesRoot, "cadastro_motorista_passo3.html"),
	);
});
export const driverRouter = router;
