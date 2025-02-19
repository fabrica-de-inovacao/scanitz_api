"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_1 = require("./documentation/swagger");
const users_routes_1 = __importDefault(require("./Routers/users_routes/users_routes"));
const complaints_routes_1 = __importDefault(require("./Routers/complaints_routes/complaints_routes"));
const auth_routes_1 = __importDefault(require("./Routers/auth/auth_routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: "*",
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
}));
app.get("/", (req, res) => {
    return res.json("🔴 ScanITZ API (DEV) - Version 1.0.0 | Acesse /api-docs para consultar a documentação do serviço");
});
(0, swagger_1.setupSwagger)(app);
app.use("/users", users_routes_1.default);
app.use("/complaints", complaints_routes_1.default);
app.use("/auth", auth_routes_1.default);
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Serviço execultando em:  http://localhost:${PORT}`));
