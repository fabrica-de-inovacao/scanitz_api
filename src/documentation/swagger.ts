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
      title: "ScanITZ API",
      version: "1.0.0",
      description:
        "API completa para gerenciamento de denúncias urbanas, usuários e sistema de monitoramento municipal. Inclui funcionalidades avançadas de busca, dashboard executivo, painéis administrativos e sistema de autenticação integrado.",
      author: {
        name: "Fábrica de Inovação ITZ",
        email: "fabricadeinovacaoitz@gmail.com",
      },
      contact: {
        name: "Fábrica de Inovação ITZ",
        email: "fabricadeinovacaoitz@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      termsOfService: "https://scanitz.com/terms",
    },
    servers: [
      {
        url: "http://localhost:" + PORT + "/api/v1",
        description: "Servidor de Desenvolvimento Local",
      },
      {
        url: "https://scanitzapi-production.up.railway.app/api/v1",
        description: "Servidor de Produção",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtido através do endpoint de login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            statuscode: {
              type: "integer",
              example: 400,
            },
            message: {
              type: "string",
              example: "Erro na solicitação",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statuscode: {
              type: "integer",
              example: 200,
            },
            data: {
              type: "object",
            },
            meta: {
              type: "object",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 20,
            },
            totalPages: {
              type: "integer",
              example: 5,
            },
            hasNext: {
              type: "boolean",
              example: true,
            },
            hasPrev: {
              type: "boolean",
              example: false,
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [scanitzSwaggerAnnotationsPath],
};

// Adicionar configurações extras do Swagger
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: "none",
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      req.credentials = "include";
      return req;
    },
  },
};

const scanitzSwaggerDocs = swaggerJsdoc(scanitzSwaggerDefinition);

export function setupSwagger(app: Express) {
  app.use("/api/v1/api-docs", swaggerUi.serve, (...args) =>
    swaggerUi.setup(scanitzSwaggerDocs, swaggerOptions)(...args)
  );

  // Endpoint para obter a especificação JSON
  app.get("/api/v1/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(scanitzSwaggerDocs);
  });
}
