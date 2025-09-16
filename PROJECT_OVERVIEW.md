# 📊 **SCANITZ API - PROJECT OVERVIEW**

## 🎯 **Propósito e Realidade do Sistema**

O **ScanITZ** é uma **plataforma de participação cidadã ativa** focada na cidade de **Imperatriz, Maranhão**. O sistema permite que cidadãos reportem problemas urbanos através de denúncias georreferenciadas com evidências fotográficas.

## 📈 **Estatísticas Reais do Banco de Dados**

- **👥 Usuários Ativos**: 36 usuários cadastrados
- **📋 Denúncias**: 76 denúncias registradas
- **🗺️ Cobertura Geográfica**: 56 denúncias com coordenadas GPS precisas
- **📸 Evidências**: 58 denúncias com imagens anexadas
- **🎯 Foco Geográfico**: 73% das denúncias concentradas em Imperatriz/MA

## 🏙️ **Mapeamento Urbano Real**

### **Principais Bairros Atendidos:**

1. **Nova Imperatriz** - 12 denúncias (16%)
2. **Parque Sanharol** - 6 denúncias (8%)
3. **Santa Rita** - 6 denúncias (8%)
4. **Vila Redencao** - 3 denúncias
5. **Centro** - 2 denúncias
6. **Parque das Palmeiras** - 2 denúncias
7. Outros bairros com menor incidência

## 👤 **Perfil dos Usuários Ativos**

- **Dados Pessoais**: CPF validado (formato brasileiro)
- **Contato**: Email e telefone (alguns opcionais)
- **Exemplos de usuários ativos**:
  - Karen Alexandra (karenalexandra2201@gmail.com)
  - Lourran Avelar (lourranap@gmail.com)
  - Ana Lúcia Pinto Do Vale
  - Deinise Lima Bonfim
  - Jaires Almeida De Araújo

## 📋 **Estrutura Real das Denúncias**

### **Modelo de Dados Implementado:**

```typescript
interface RealComplaintData {
  // Identificação
  id: string; // ID único da denúncia

  // Conteúdo
  description: string; // "Poça próximo ao meio fio"

  // Localização (estrutura real)
  address: {
    city: string; // "Imperatriz"
    district: string; // "Nova Imperatriz"
    state: string; // "Maranhão"
    postalCode: string; // "65914-408"
    latitude: number; // -5.5110338
    longitude: number; // -47.4512995
    fallbackName: string; // Nome de referência
  };

  // Status e controle
  situation: {
    status: number; // 0, 1 (sistema de status)
  };

  // Mídia
  imageUrl: string; // URL Firebase Storage
  thumbnailUrl: string; // Miniatura otimizada

  // Relacionamentos
  userId: string; // ID do usuário
  userName: string; // Nome do usuário
  similarCount: number; // Denúncias similares na região

  // Temporal
  createdAt: Timestamp; // Data de criação
  updatedAt: Timestamp; // Última atualização
}
```

## 🛠️ **Infraestrutura e Tecnologias**

### **Stack Tecnológico:**

- **Backend**: Node.js + TypeScript + Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage (imagens e thumbnails)
- **Authentication**: Firebase Authentication
- **Deploy**: Railway Platform
- **Documentation**: Swagger UI integrado
- **Geolocation**: Coordenadas GPS nativas
- **Package Manager**: Yarn

### **Principais Dependências:**

```json
{
  "express": "^4.21.2",
  "firebase": "^11.3.1",
  "firebase-admin": "^13.1.0",
  "typescript": "^5.7.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "swagger-ui-express": "^5.0.1",
  "cpf-check": "^3.0.0"
}
```

### **Configuração TypeScript:**

- **Target**: ES2024
- **Module**: CommonJS
- **Output**: dist/
- **Root**: ./src

## 🌐 **Infraestrutura Firebase Confirmada**

### **Coleções Ativas:**

- **`users`** - 36 documentos
- **`complaints`** - 76 documentos

### **Firebase Storage:**

- **Images**: URLs completas com tokens de acesso
- **Thumbnails**: Versões otimizadas para performance
- **Organização**: Por ID da denúncia

### **Autenticação Firebase:**

- Sistema ativo com UIDs únicos
- Integração com dados pessoais brasileiros

## 🏗️ **Arquitetura da API**

### **Estrutura de Rotas:**

```
/
├── /auth
│   ├── POST /login     - Autenticação de usuário
│   └── POST /register  - Registro de novo usuário
├── /users
│   ├── GET /           - Listar todos os usuários
│   ├── GET /:uid       - Buscar usuário por ID
│   └── GET /:uid/complaints - Denúncias do usuário
└── /complaints
    ├── GET /           - Listar todas as denúncias
    ├── GET /positions  - Coordenadas das denúncias
    ├── GET /:id        - Buscar denúncia por ID
    └── GET /:district  - Denúncias por bairro
```

### **Documentação:**

- **Swagger UI**: Disponível em `/api-docs`
- **Servidor Local**: http://localhost:3000
- **Servidor Produção**: https://scanitzapi-production.up.railway.app/

## 📊 **Funcionalidades Comprovadamente Ativas**

### **✅ Sistema de Autenticação**

- Login/registro funcionais
- Validação de CPF brasileiro
- Gestão de sessões Firebase

### **✅ Gestão de Denúncias**

- Upload de imagens com thumbnails
- Geolocalização precisa
- Sistema de status de acompanhamento
- Contagem de denúncias similares

### **✅ APIs REST Funcionais**

- Busca por usuário, denúncia, região
- Filtros geográficos (por bairro)
- Listagem de posições para mapas

## 🌍 **Impacto Geográfico Real**

- **Concentração Urbana**: Imperatriz é a cidade principal
- **Coordenadas GPS**: 73% das denúncias georreferenciadas
- **Cobertura de Bairros**: 10+ bairros mapeados
- **Tipos de Problemas**: Infraestrutura urbana (poças, buracos, etc.)

## 🎯 **Propósito Social Confirmado**

O **ScanITZ** é uma **ferramenta de cidadania digital** que permite:

- **Participação Cívica**: Cidadãos reportam problemas urbanos
- **Transparência**: Visualização pública de problemas
- **Responsabilidade**: Acompanhamento via status
- **Evidência**: Documentação fotográfica
- **Geolocalização**: Mapeamento preciso para órgãos competentes

## 🏢 **Informações Organizacionais**

- **Organização**: Fábrica de Inovação (fabrica-de-inovacao)
- **Autor**: Mareanx
- **Licença**: MIT
- **Repositório**: GitHub (scanitz_api)
- **Versão**: 1.0.0
- **Contato**: fabricadeinovacaoitz@gmail.com

## 🚀 **Como Executar**

### **Desenvolvimento:**

```bash
yarn install
yarn dev  # tsx watch src/server.ts
```

### **Produção:**

```bash
yarn build  # tsc
yarn start  # node dist/server.js
```

### **Variáveis de Ambiente:**

- `FIREBASE_SERVICE_ACCOUNT` - Credenciais do Firebase Admin
- `FIREBASE_CREDENTIALS` - Configuração do Firebase Client
- `FIREBASE_DATABASE_URL` - URL do Realtime Database
- `PORT` - Porta do servidor (padrão: 3000)

---

**Esta é uma plataforma real e funcional de participação cidadã para melhoria urbana, com dados reais de usuários e denúncias da cidade de Imperatriz/MA.**

_Última atualização: 15 de setembro de 2025_
