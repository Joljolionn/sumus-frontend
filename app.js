import express, { json } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import passengerRouter from './routes/passengerRoutes.js';
import driverRouter from './routes/driverRoutes.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const gatewayUrl = "http://api-gateway:8080";

app.use(json());
app.use(express.static(path.join(__dirname, 'assets')));
app.use("/passenger", passengerRouter)
app.use("/driver", driverRouter)
app.use("/admin", adminRouter)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, "pages", 'login-neutro.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

