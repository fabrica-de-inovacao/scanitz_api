# 🔐 Teste da Autenticação Firebase - ScanITZ API

## 📋 Como Testar a Autenticação

### 1. **Obter Token de Autenticação**

**Endpoint**: `POST /api/v1/auth/login`

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "user": {
    "uid": "firebase_user_id",
    "email": "usuario@exemplo.com"
  }
}
```

### 2. **Usar Token nas Rotas Protegidas**

**Cabeçalho Obrigatório**:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

### 3. **Rotas Disponíveis**

#### 🔄 **V1 (Sem Proteção) - DEPRECATED**

- `GET /api/v1/users` - Lista usuários (sem token)
- `GET /api/v1/complaints` - Lista denúncias (sem token)

#### 🔐 **V2 (Com Proteção) - RECOMENDADO**

- `GET /api/v2/users` - Lista usuários (token obrigatório)
- `GET /api/v2/users/me` - Dados do usuário logado (token obrigatório)
- `GET /api/v2/complaints` - Lista denúncias (token opcional, dados extras se logado)
- `POST /api/v2/complaints` - Criar denúncia (token obrigatório)

### 4. **Exemplos de Teste com curl**

#### Obter Token:

```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha123"}'
```

#### Testar Rota Protegida:

```bash
curl -X GET http://localhost:3333/api/v2/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Criar Denúncia (Protegida):

```bash
curl -X POST http://localhost:3333/api/v2/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "description": "Buraco na rua",
    "address": {
      "street": "Rua Exemplo",
      "district": "Centro",
      "city": "Imperatriz",
      "state": "MA",
      "latitude": -5.5244,
      "longitude": -47.4820
    }
  }'
```

### 5. **Tipos de Middleware de Proteção**

#### 🔴 **`authenticateFirebaseToken`** (Obrigatório)

- Token é **obrigatório**
- Retorna erro 401 se não fornecido
- Usado em: criação de denúncias, dados pessoais

#### 🟡 **`optionalAuthentication`** (Opcional)

- Token é **opcional**
- Adiciona dados extras se fornecido
- Usado em: listagem de denúncias (melhor UX se logado)

#### 🔵 **`requireOwnership`** (Dono do Recurso)

- Token obrigatório + verificação de propriedade
- Usado em: editar/deletar próprias denúncias

### 6. **Códigos de Resposta**

| Código | Significado     | Quando                                        |
| ------ | --------------- | --------------------------------------------- |
| 200    | Sucesso         | Operação realizada                            |
| 201    | Criado          | Recurso criado com sucesso                    |
| 400    | Dados inválidos | JSON malformado ou campos obrigatórios        |
| 401    | Não autorizado  | Token inválido, expirado ou ausente           |
| 403    | Proibido        | Token válido mas sem permissão para o recurso |
| 404    | Não encontrado  | Recurso não existe                            |
| 500    | Erro interno    | Problema no servidor                          |

### 7. **Headers Importantes**

```http
Content-Type: application/json
Authorization: Bearer TOKEN_DO_FIREBASE
```

### 8. **Estrutura de Resposta com Autenticação**

#### Sem Token (Público):

```json
{
  "success": true,
  "data": [
    {
      "id": "complaint_id",
      "description": "Descrição pública",
      "imageUrl": "url_da_imagem"
      // userId e userName OMITIDOS
    }
  ]
}
```

#### Com Token (Dados Extras):

```json
{
  "success": true,
  "data": [
    {
      "id": "complaint_id",
      "description": "Descrição completa",
      "imageUrl": "url_da_imagem",
      "userId": "firebase_user_id", // APENAS se for dono
      "userName": "Nome do usuário", // APENAS se for dono
      "canEdit": true, // APENAS se autenticado
      "canReport": false // APENAS se autenticado
    }
  ],
  "meta": {
    "authenticated": true,
    "userComplaints": 3
  }
}
```

### 9. **Próximos Passos**

1. ✅ **Implementar Firebase Admin SDK** (config/firebase-admin.ts)
2. ✅ **Criar middleware de autenticação** (middleware/auth.ts)
3. ✅ **Criar rotas protegidas** (v2/)
4. 🔄 **Testar com dados reais**
5. ⏳ **Migrar frontend para v2**
6. ⏳ **Deprecar v1 após migração**

### 10. **Observações Importantes**

- 🔐 **V2 é a versão segura** - use sempre que possível
- 🚨 **V1 será removida** após migração do frontend
- 📊 **Dados sensíveis** (userId, userName) apenas para donos
- 🎯 **UX melhorada** com autenticação opcional em listagens
- 🛡️ **Segurança em primeiro lugar** - todas operações de escrita protegidas
