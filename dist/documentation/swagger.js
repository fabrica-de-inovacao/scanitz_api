"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
let scanitzSwaggerAnnotationsPath = path_1.default.join(__dirname, "scanitz_swagger_annotations.js");
if (!fs_1.default.existsSync(scanitzSwaggerAnnotationsPath)) {
    scanitzSwaggerAnnotationsPath = path_1.default.join(__dirname, "scanitz_swagger_annotations.ts");
}
const scanitzSwaggerDefinition = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Scanitz API",
            version: "1.0.0",
            description: "API para gerenciamento e monitoramento de dispositivos.",
            author: {
                name: "Mareanx",
                email: "fabricadeinovacaoitz@gmail.com",
            },
            contact: {
                name: "Mareanx",
                email: "fabricadeinovacaoitz@gmail.com",
            },
        },
        servers: [
            {
                url: "http://localhost:" + PORT,
                description: "Servidor local",
            },
            {
                url: "https://scanitzapi-production.up.railway.app/",
                description: "Servidor de Homologação",
            },
        ],
    },
    apis: [scanitzSwaggerAnnotationsPath],
};
const scanitzSwaggerDocs = (0, swagger_jsdoc_1.default)(scanitzSwaggerDefinition);
function setupSwagger(app) {
    app.use("/api-docs", swagger_ui_express_1.default.serve, (...args) => swagger_ui_express_1.default.setup(scanitzSwaggerDocs)(...args));
}
