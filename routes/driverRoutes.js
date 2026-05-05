import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';

const driverRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDirname = path.join(__dirname, "..", "pages", "driver")

driverRouter.get('/signup/1', (req, res) => {
  res.sendFile(path.join(localDirname, "cadastro", 'cadastro-motorista-step1.html'));
});

driverRouter.get('/signup/2', (req, res) => {
  res.sendFile(path.join(localDirname, "cadastro", 'cadastro-motorista-step2.html'));
});

driverRouter.get('/signup/3', (req, res) => {
  res.sendFile(path.join(localDirname, "cadastro", 'cadastro-motorista-step3.html'));
});

driverRouter.get('/login', (req, res) => {
  res.sendFile(path.join(localDirname, "login", 'login-motorista.html'));
});

driverRouter.get('/', (req, res) => {
  res.sendFile(path.join(localDirname, 'home-motorista.html'));
});


driverRouter.get('/cards', (req, res) => {
  res.sendFile(path.join(localDirname, 'cadastro-cartao.html'));
});


driverRouter.get('/documents', (req, res) => {
  res.sendFile(path.join(localDirname, 'cadastro-documento.html'));
});


driverRouter.get('/otp', (req, res) => {
  res.sendFile(path.join(localDirname, 'codigo-otp.html'));
});


driverRouter.get('/config', (req, res) => {
  res.sendFile(path.join(localDirname, 'configuracao.html'));
});


driverRouter.get('/history', (req, res) => {
  res.sendFile(path.join(localDirname, 'historico.html'));
});


driverRouter.get('/payments', (req, res) => {
  res.sendFile(path.join(localDirname, 'metodo-pagamento.html'));
});


driverRouter.get('/profile', (req, res) => {
  res.sendFile(path.join(localDirname, 'perfil-motorista.html'));
});


driverRouter.get('/vehicles', (req, res) => {
  res.sendFile(path.join(localDirname, 'veiculos.html'));
});

driverRouter.get('/', (req, res) => {
  res.sendFile(path.join(localDirname, 'home-motorista.html'));
});



export default driverRouter
