# 🚀 IMPLEMENTAÇÃO IMEDIATA - Autenticação Firebase

## ⚡ URGENTE - Ações Imediatas (1 hora)

### 1. **Configurar Firebase Admin SDK**

#### Opção A: Service Account Key (Recomendado)

1. Acessar [Firebase Console](https://console.firebase.google.com)
2. Ir em: **Configurações do Projeto** → **Contas de Serviço**
3. Clicar em **Gerar nova chave privada**
4. Baixar o arquivo JSON
5. Colocar na raiz do projeto como `firebase-admin-key.json`
6. Adicionar no `.env`:

```bash
FIREBASE_PROJECT_ID=scanitz-app
GOOGLE_APPLICATION_CREDENTIALS=./firebase-admin-key.json
```

#### Opção B: Railway/Heroku (Production)

1. Copiar todo o conteúdo do JSON baixado
2. Minificar (sem quebras de linha)
3. Adicionar no `.env`:

```bash
FIREBASE_PROJECT_ID=scanitz-app
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"scanitz-app",...}
```

### 2. **Instalar Dependências**

```bash
yarn add firebase-admin dotenv
```

### 3. **Testar Autenticação**

#### Terminal 1 - Iniciar Servidor:

```bash
yarn dev
```

#### Terminal 2 - Testar Login:

```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"USUARIO_REAL@gmail.com","password":"SENHA_REAL"}'
```

#### Terminal 3 - Testar Rota Protegida:

```bash
curl -X GET http://localhost:3333/api/v2/users \
  -H "Authorization: Bearer TOKEN_OBTIDO_NO_LOGIN"
```

## 📋 VERIFICAÇÃO - Lista de Checagem

### ✅ Arquivos Criados/Modificados

- [ ] `src/config/firebase-admin-init.ts` - Inicialização Firebase Admin
- [ ] `src/middleware/auth.ts` - Middleware de autenticação
- [ ] `src/Routers/users_routes/search_users_protected.ts` - Rotas usuários protegidas
- [ ] `src/Routers/complaints_routes/search_complaints_protected.ts` - Rotas denúncias protegidas
- [ ] `src/server.ts` - Servidor com rotas v2 (protegidas)
- [ ] `.env.example` - Exemplo configuração
- [ ] `AUTHENTICATION_TESTING.md` - Guia de testes

### ✅ Testes Funcionais

- [ ] **Login funciona** - retorna token válido
- [ ] **V1 (sem proteção)** - ainda funciona temporariamente
- [ ] **V2 (com proteção)** - requer token válido
- [ ] **Token inválido** - retorna erro 401
- [ ] **Dados extras** - usuário logado vê mais informações

### ✅ Segurança Implementada

- [ ] **Denúncias** - criação apenas com token
- [ ] **Usuários** - dados pessoais apenas com token
- [ ] **Proprietário** - dados sensíveis apenas para dono
- [ ] **Headers** - Authorization Bearer funcionando

## 🎯 MIGRAÇÃO - Próximos 7 dias

### Fase 1: Backend (Agora)

- [x] Criar rotas protegidas v2
- [ ] Testar com usuários reais
- [ ] Documentar no Swagger
- [ ] Deploy no Railway

### Fase 2: Frontend (3 dias)

- [ ] Implementar interceptors de token
- [ ] Migrar para endpoints v2
- [ ] Adicionar refresh token
- [ ] Testes E2E

### Fase 3: Produção (7 dias)

- [ ] Monitoramento de autenticação
- [ ] Rate limiting
- [ ] Logs de segurança
- [ ] Deprecar v1

## 🔥 COMANDOS RÁPIDOS

### Instalar e Testar:

```bash
# 1. Instalar dependências
yarn add firebase-admin

# 2. Configurar .env (copiar do .env.example)
cp .env.example .env
# Editar .env com suas credenciais

# 3. Iniciar servidor
yarn dev

# 4. Testar autenticação
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# 5. Usar token nas rotas v2
curl -X GET http://localhost:3333/api/v2/complaints \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Verificar Firebase:

```bash
# Ver logs do Firebase Admin
yarn dev | grep -i firebase

# Testar conexão
node -e "require('./src/config/firebase-admin-init')"
```

## 🚨 PROBLEMAS COMUNS

### ❌ "Firebase Admin not initialized"

**Solução**: Verificar se `.env` tem `FIREBASE_PROJECT_ID` correto

### ❌ "Invalid service account"

**Solução**: Re-baixar JSON do Firebase Console

### ❌ "Token verification failed"

**Solução**: Verificar se token é do mesmo projeto Firebase

### ❌ "CORS error"

**Solução**: Já configurado no `server.ts`

## 📊 ESTATÍSTICAS ATUAIS

- **👥 Usuários**: 36 (dados reais precisam de proteção)
- **📋 Denúncias**: 76 (dados sensíveis expostos)
- **🚨 Risco**: ALTO - dados pessoais sem autenticação
- **⏰ Tempo**: 1h para implementar proteção básica

## 🎯 OBJETIVO FINAL

```
ANTES: Qualquer pessoa acessa dados de usuários
DEPOIS: Apenas usuários autenticados veem seus próprios dados
```

**CRÍTICO**: Esta implementação protege dados pessoais de 36 usuários reais que estão atualmente expostos!
