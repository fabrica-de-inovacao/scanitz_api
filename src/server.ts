import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Configurar variáveis de ambiente ANTES de tudo
dotenv.config();

// Inicializar Firebase Admin SDK DEPOIS das variáveis de ambiente
import "./config/firebase-admin-init";
import { setupSwagger } from "./documentation/swagger";
// Rotas da v1 (com autenticação integrada)
import RouterUsers from "./Routers/users_routes/users_routes";
import RouterComplaints from "./Routers/complaints_routes/complaints_routes";
import RouterAuth from "./Routers/auth/auth_routes";
import RouterSearch from "./Routers/search_routes";
import RouterDashboard from "./Routers/dashboard_routes";
import RouterAdmin from "./Routers/admin_routes";

const app = express();
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  })
);

app.get("/", (req, res) => {
  return res.json(
    "🔴 ScanITZ API (DEV) - Version 1.0.0 | Acesse /api/v1/api-docs para consultar a documentação do serviço"
  );
});

setupSwagger(app);

// Rotas da v1 (agora com autenticação integrada)
app.use("/api/v1/users", RouterUsers);
app.use("/api/v1/complaints", RouterComplaints);
app.use("/api/v1/auth", RouterAuth);
app.use("/api/v1/search", RouterSearch);
app.use("/api/v1/dashboard", RouterDashboard);
app.use("/api/v1/admin", RouterAdmin);

// Health check endpoint para Docker
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0"; // Importante para Docker

app.listen(PORT, HOST, () => {
  console.log(`🔥 Scanitz API executando em: http://${HOST}:${PORT}`);
  console.log(
    `📚 Documentação Swagger: http://${HOST}:${PORT}/api/v1/api-docs`
  );
  console.log(`❤️ Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
});
