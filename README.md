# 🏙️ ScanITZ API - Sistema de Denúncias Urbanas

API completa para gerenciamento de denúncias urbanas, usuários e sistema de monitoramento municipal. Desenvolvida com Node.js, TypeScript, Express e Firebase.

## 🚀 Características Principais

- **Sistema de Autenticação JWT** - Login seguro e gestão de sessões
- **Gerenciamento de Usuários** - CRUD completo com filtros avançados e estatísticas
- **Denúncias Urbanas** - Sistema completo de denúncias com geolocalização
- **Busca Unificada** - Motor de busca inteligente com facetas e sugestões
- **Dashboard Executivo** - KPIs, métricas e relatórios em tempo real
- **Painel Administrativo** - Ferramentas de moderação e auditoria
- **Documentação Swagger** - API totalmente documentada e interativa

## 📚 Documentação

A documentação completa da API está disponível através do Swagger UI:

- **Desenvolvimento**: [http://localhost:3000/api/v1/api-docs](http://localhost:3000/api/v1/api-docs)
- **Especificação JSON**: [http://localhost:3000/api/v1/swagger.json](http://localhost:3000/api/v1/swagger.json)

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Express.js** - Framework web
- **Firebase Admin SDK** - Banco de dados e autenticação
- **Swagger** - Documentação da API
- **JWT** - Autenticação via tokens

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta Firebase com projeto configurado
- Arquivo de credenciais do Firebase

## ⚙️ Instalação e Configuração

1. **Clone o repositório**

   ```bash
   git clone <repository-url>
   cd scanitz_api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` baseado no `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Configure as seguintes variáveis:

   ```env
   PORT=3000
   FIREBASE_SERVICE_ACCOUNT=<caminho-para-arquivo-credenciais>
   FIREBASE_CREDENTIALS=<json-das-credenciais-firebase>
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

O servidor estará disponível em `http://localhost:3000`

## 🔗 Endpoints Principais

### Autenticação

- `POST /api/v1/auth/login` - Login de usuário
- `POST /api/v1/auth/register` - Registro de novo usuário

### Usuários

- `GET /api/v1/users` - Listar usuários (protegido)
- `GET /api/v1/users/statistics` - Estatísticas de usuários (protegido)

### Denúncias

- `GET /api/v1/complaints` - Listar denúncias
- `GET /api/v1/complaints/proximity` - Busca por proximidade
- `GET /api/v1/complaints/analytics` - Analytics de denúncias

### Busca

- `GET /api/v1/search` - Busca unificada
- `GET /api/v1/search/autocomplete` - Sugestões de autocompletar

### Dashboard

- `GET /api/v1/dashboard` - KPIs principais
- `GET /api/v1/dashboard/executive-report` - Relatório executivo
- `GET /api/v1/dashboard/realtime-kpis` - Métricas em tempo real

### Administrativo

- `GET /api/v1/admin` - Informações do painel
- `GET /api/v1/admin/users` - Gestão de usuários
- `GET /api/v1/admin/complaints` - Moderação de denúncias
- `GET /api/v1/admin/audit` - Logs de auditoria
- `GET /api/v1/admin/system` - Informações do sistema

## 🔐 Autenticação

A API utiliza autenticação JWT. Para acessar endpoints protegidos, inclua o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## 📊 Exemplos de Uso

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com", "password": "senha123"}'
```

### 2. Busca Unificada

```bash
curl "http://localhost:3000/api/v1/search?q=buraco&type=complaints&limit=10"
```

### 3. Dashboard KPIs

```bash
curl "http://localhost:3000/api/v1/dashboard?period=30d"
```

### 4. Denúncias por Proximidade

```bash
curl "http://localhost:3000/api/v1/complaints/proximity?latitude=-5.5292&longitude=-47.4622&radius=2"
```

## 🏗️ Estrutura do Projeto

```
src/
├── config/                 # Configurações
│   └── firebase-admin-init.ts
├── database/               # Conexão com Firebase
│   └── firebase.ts
├── documentation/          # Documentação Swagger
│   ├── swagger.ts
│   └── scanitz_swagger_annotations.ts
├── middleware/             # Middlewares
│   └── auth.ts
├── Routers/               # Rotas da API
│   ├── auth/              # Autenticação
│   ├── users_routes/      # Usuários
│   ├── complaints_routes/ # Denúncias
│   ├── search_routes.ts   # Busca
│   ├── dashboard_routes.ts # Dashboard
│   └── admin_routes.ts    # Administrativo
└── server.ts              # Servidor principal
```

## 🧪 Testes

Execute os testes com:

```bash
npm test
# ou
yarn test
```

## 🚀 Produção

Para fazer deploy em produção:

1. **Build do projeto**

   ```bash
   npm run build
   # ou
   yarn build
   ```

2. **Inicie o servidor de produção**
   ```bash
   npm start
   # ou
   yarn start
   ```

## 📈 Monitoramento e Métricas

A API inclui:

- **KPIs em tempo real** através do dashboard
- **Logs de auditoria** para rastreamento de ações
- **Métricas de performance** do sistema
- **Alertas automáticos** para situações críticas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

Desenvolvido pela **Fábrica de Inovação ITZ**

- Email: fabricadeinovacaoitz@gmail.com

---

## 🔄 Status da API

### ✅ Implementado

- Sistema de autenticação JWT
- CRUD completo de usuários e denúncias
- Sistema de busca unificada com facetas
- Dashboard executivo com KPIs
- Painel administrativo completo
- Documentação Swagger completa
- Sistema de métricas e analytics

### 🏆 Características Avançadas

- **Busca Geográfica**: Encontre denúncias por proximidade
- **Analytics Avançados**: Insights detalhados sobre dados
- **Sistema de Facetas**: Filtragem inteligente de resultados
- **Relatórios Executivos**: Dashboards para tomada de decisão
- **Auditoria Completa**: Rastreamento de todas as ações
- **API Documentada**: Swagger UI interativo

**Status**: 🟢 **PRODUÇÃO READY** - API completamente funcional e documentada!
