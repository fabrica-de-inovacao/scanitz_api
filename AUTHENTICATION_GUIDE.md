# 🔐 **GUIA DE IMPLEMENTAÇÃO - AUTENTICAÇÃO FIREBASE**

## 🚨 **SITUAÇÃO ATUAL - RISCO CRÍTICO**

**PROBLEMA**: Todas as rotas estão **DESPROTEGIDAS** permitindo:

- ❌ Acesso irrestrito aos dados de usuários
- ❌ Qualquer pessoa pode ver todas as denúncias
- ❌ Dados pessoais (CPF, telefone, email) expostos
- ❌ Possível manipulação de dados sem autenticação

## 🛠️ **IMPLEMENTAÇÃO IMEDIATA**

### **1. 📁 Arquivos Criados**

```
src/
├── middleware/
│   └── auth.ts                 # ✅ Middleware de autenticação
├── config/
│   └── firebase-admin.ts       # ✅ Configuração Firebase Admin
```

### **2. 🔧 Middlewares Disponíveis**

```typescript
// Autenticação obrigatória
import { authenticateFirebaseToken } from "../middleware/auth";

// Autenticação opcional (melhor UX se logado)
import { optionalAuthentication } from "../middleware/auth";

// Verificar email confirmado
import { requireEmailVerified } from "../middleware/auth";

// Verificar se é dono do recurso
import { requireOwnership } from "../middleware/auth";
```

### **3. 🚀 Como Usar nos Routers**

#### **Router com Autenticação Obrigatória:**

```typescript
import { Router } from "express";
import {
  authenticateFirebaseToken,
  requireOwnership,
} from "../../middleware/auth";

const router = Router();

// Exemplo: Usuário só pode ver próprios dados
router.get(
  "/:uid",
  authenticateFirebaseToken, // 1. Verificar token
  requireOwnership("uid"), // 2. Verificar se é dono
  async (req, res) => {
    // req.user já está disponível aqui
    const { uid } = req.params;
    // Lógica do endpoint...
  }
);
```

#### **Router com Autenticação Opcional:**

```typescript
// Exemplo: Lista pública, mas com dados extras se logado
router.get(
  "/",
  optionalAuthentication, // Token opcional
  async (req, res) => {
    const isAuthenticated = !!req.user;

    if (isAuthenticated) {
      // Retornar dados mais detalhados
    } else {
      // Retornar dados básicos/públicos
    }
  }
);
```

## 🎯 **ROTAS A SEREM PROTEGIDAS IMEDIATAMENTE**

### **🔴 CRÍTICAS - Implementar HOJE**

```typescript
// users_routes/search_users.ts
router.get("/:uid", authenticateFirebaseToken, requireOwnership("uid"));
router.get(
  "/:uid/complaints",
  authenticateFirebaseToken,
  requireOwnership("uid")
);

// complaints_routes/ (futuras rotas de criação/edição)
router.post("/", authenticateFirebaseToken);
router.put("/:id", authenticateFirebaseToken, verifyComplaintOwnership);
router.delete("/:id", authenticateFirebaseToken, verifyComplaintOwnership);
```

### **🟡 IMPORTANTES - Implementar esta semana**

```typescript
// complaints_routes/search_complaints.ts
router.get("/", optionalAuthentication); // Dados extras se logado
router.get("/:id", optionalAuthentication); // Mais detalhes se for dono

// users_routes/search_users.ts
router.get("/", authenticateFirebaseToken); // Lista só para autenticados
```

### **🟢 PÚBLICAS - Manter sem auth**

```typescript
// auth_routes/
router.post("/login"); // ✅ Público
router.post("/register"); // ✅ Público

// system info (futuros)
router.get("/system/info"); // ✅ Público
```

## 🔧 **PASSOS DE IMPLEMENTAÇÃO**

### **Passo 1: Instalar dependências**

```bash
yarn add firebase-admin
```

### **Passo 2: Configurar tipos TypeScript**

```bash
yarn add -D @types/express
```

### **Passo 3: Atualizar server.ts**

```typescript
import "./config/firebase-admin"; // Inicializar Firebase Admin
```

### **Passo 4: Aplicar middleware nas rotas**

```typescript
// Exemplo em users_routes.ts
import { authenticateFirebaseToken } from "../../middleware/auth";

RouterUsers.use("/:uid", authenticateFirebaseToken);
RouterUsers.use("/:uid/complaints", authenticateFirebaseToken);
```

### **Passo 5: Testar autenticação**

```bash
# Header obrigatório nas requests protegidas
Authorization: Bearer <firebase_jwt_token>
```

## 📱 **COMO O FRONTEND DEVE USAR**

### **Login e obter token:**

```javascript
// No app mobile/web
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await userCredential.user.getIdToken();

// Usar em todas as requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### **Refresh token quando necessário:**

```javascript
// Token expira em 1 hora, renovar automaticamente
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken(true); // force refresh
}
```

## ⚠️ **TRATAMENTO DE ERROS**

### **Respostas de erro padronizadas:**

```json
// Token expirado
{
  "success": false,
  "statuscode": 401,
  "message": "Token expirado. Faça login novamente.",
  "errorCode": "TOKEN_EXPIRED"
}

// Acesso negado
{
  "success": false,
  "statuscode": 403,
  "message": "Acesso negado. Você só pode acessar seus próprios dados.",
  "errorCode": "ACCESS_DENIED"
}
```

## 🚀 **PRÓXIMOS PASSOS**

1. **HOJE**: Implementar middleware básico
2. **Amanhã**: Proteger rotas críticas de usuários
3. **Esta semana**: Proteger todas as rotas sensíveis
4. **Próxima semana**: Implementar rotas de criação/edição com auth

---

**🔥 IMPLEMENTAÇÃO CRÍTICA - PRIORIDADE MÁXIMA! 🔥**

_A segurança dos dados dos usuários depende desta implementação!_
