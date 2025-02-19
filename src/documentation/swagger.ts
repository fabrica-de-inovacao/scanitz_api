import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 3000;

let scanitzSwaggerAnnotationsPath = path.join(
  __dirname,
  "scanitz_swagger_annotations.js"
);
if (!fs.existsSync(scanitzSwaggerAnnotationsPath)) {
  scanitzSwaggerAnnotationsPath = path.join(
    __dirname,
    "scanitz_swagger_annotations.ts"
  );
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

const scanitzSwaggerDocs = swaggerJsdoc(scanitzSwaggerDefinition);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, (...args) =>
    swaggerUi.setup(scanitzSwaggerDocs)(...args)
  );
}
