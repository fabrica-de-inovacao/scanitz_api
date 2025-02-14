
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import {Express} from 'express';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config();

const PORT = process.env.PORT || 3000;

const scanitzSwaggerAnnotationsPath = path.join(
    __dirname,
    "scanitz_swagger_annotations.ts"
)

const scanitzSwaggerDefinition = {
  swaggerDefinition: {
  openapi: '3.0.0',
  info: {
    title: 'Scanitz API',
    version: '1.0.0',
    description: 'API para gerenciamento e monitoramento de dispositivos.',
    author: {
        name: "Mareanx",
        email: "fabricadeinovacaoitz@gmail.com"
    },
    contact:{
        name: "Mareanx",
        email: "fabricadeinovacaoitz@gmail.com" 
    }
  },
  servers: [
    {
      url: 'http://localhost:' + PORT,
      description: 'Servidor local',
    },
    {
      url: 'https://staging.api.scanitz.com/v1',
      description: 'Servidor de Homologação',
    },
  ],
},
  apis: [scanitzSwaggerAnnotationsPath],
};

const scanitzSwaggerDocs = swaggerJsdoc(scanitzSwaggerDefinition);

export function setupSwagger (app: Express) {
  app.use('/api-docs', swaggerUi.serve, (...args) =>
    swaggerUi.setup(scanitzSwaggerDocs)(...args));
};
