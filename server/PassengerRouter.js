import path from "path";
import dotenv from "dotenv";
import { Router } from "express";
import { projectRoot } from "./App.js";

dotenv.config()

const router = Router();

router.get("/signup/2", (req, res) => {
    res.sendFile(path.join(pagesRoot, "cadastro_passo2.html"));
});
router.get("/signup/3", (req, res) => {
    res.sendFile(path.join(pagesRoot, "cadastro_passo3.html"));
});
router.get("/signup/4", (req, res) => {
    res.sendFile(path.join(pagesRoot, "cadastro_passo4.html"));
});
router.get("/signup/5", (req, res) => {
    res.sendFile(path.join(pagesRoot, "cadastro_passo5.html"));
});

router.get("/", (req, res) => {
    res.sendFile(path.join(pagesRoot, "passenger-home.html"));
});

router.get("/account", (req, res) => {
    res.sendFile(path.join(pagesRoot, "passenger-account.html"));
});

router.post("/signup", async (req, res) => {
    const cadastro = req.body;

    try {
        // Fazer a requisição para o Backend (Server-to-Server)
        const response = await fetch(`${process.env.BACKEND_URL}/passenger/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cadastro),
        });

        // Tratar a resposta do Backend
        if (!response.ok) {
            // Se o backend retornou 401 (Não Autorizado), repassamos o erro
            const errorText = await response.text();
            console.error(`Erro do Backend: ${errorText}`);
            return res
                .status(response.status)
                .json({ error: "Credenciais inválidas ou erro no backend." });
        }

        // Se o cadastro foi um sucesso
        const data = await response.json(); 

        // Retorna sucesso para o cliente
        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        console.error("Erro ao processar cadastro via Express:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Fazer a requisição para o Backend (Server-to-Server)
        const response = await fetch(`${process.env.BACKEND_URL}/passenger/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: senha,
            }),
        });

        // Tratar a resposta do Backend
        if (!response.ok) {
            // Se o backend retornou 401 (Não Autorizado), repassamos o erro
            const errorText = await response.text();
            console.error(`Erro do Backend: ${errorText}`);
            return res
                .status(response.status)
                .json({ error: "Credenciais inválidas ou erro no backend." });
        }

        // Se o login foi um sucesso
        const data = await response.json(); // Deve conter o JWT Token

        // // Enviar a resposta de volta para o Frontend (Browser)
        // // Em vez de enviar o token diretamente no corpo (como no cliente-side),
        // // o ideal é enviá-lo em um Cookie HTTP-Only seguro.
        //
        // // Exemplo: Configurando um cookie seguro (opcional, mas recomendado)
        // res.cookie('jwtToken', data.token, {
        //     httpOnly: true, // Impedir acesso via JavaScript (melhora segurança XSS)
        //     secure: process.env.NODE_ENV === 'production', // Use 'secure: true' em produção com HTTPS
        //     maxAge: 3600000, // 1 hora
        //     sameSite: 'strict' // Proteção CSRF
        // });

        // Retorna sucesso para o cliente
        return res.status(200).json({
            success: true,
            // (Opcional) Se você não usar HTTP-Only, envie o token:
            token: data.token,
        });
    } catch (err) {
        console.error("Erro ao processar login via Express:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export const passengerRouter = router;
