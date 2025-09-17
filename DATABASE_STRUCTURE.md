# 🗄️ **ESTRUTURA DO BANCO DE DADOS FIRESTORE**

## 📍 **Informações Gerais**

- **Localização**: nam5 (North America 5)
- **Tipo**: Firebase Firestore (NoSQL)
- **Coleções Principais**: `users`, `complaints`

---

## 👤 **Coleção: `users`**

### **Estrutura dos Documentos:**

```typescript
interface User {
  documentNumber: string; // CPF formato: "012.928.133-69"
  email: string; // Email do usuário
  fullName: string; // Nome completo
  phoneNumber: string; // Telefone formato: "99 99140-9572"
}
```

### **Exemplo Real:**

```json
{
  "documentNumber": "012.928.133-69",
  "email": "rubenvalmat@gmail.com",
  "fullName": "Rubenval Mesquita",
  "phoneNumber": "99 99140-9572"
}
```

---

## 📋 **Coleção: `complaints`**

### **Estrutura dos Documentos:**

```typescript
interface Complaint {
  // 📍 Localização
  address: {
    city: string; // "Imperatriz"
    district: string; // "Parque Sanharol"
    fallbackName: string; // Nome alternativo do local
    latitude: number; // -5.5110338
    longitude: number; // -47.4512995
    postalCode: string; // "65914-408"
    state: string; // "Maranhão"
  };

  // 📝 Conteúdo da Denúncia
  description: string; // "Poça próximo ao meio fio"

  // 🖼️ Mídia
  imageUrl: string; // URL da imagem original
  thumbnailUrl: string; // URL da thumbnail otimizada

  // 📊 Status e Situação
  situation: {
    status: number; // 0=pendente, 1=progresso, 2=resolvido
  };

  // 👤 Dados do Usuário
  userId: string; // UID do Firebase Auth
  userName: string; // Nome do usuário que criou

  // 📅 Timestamps
  createdAt: Timestamp; // Data de criação
  updatedAt: Timestamp; // Última atualização

  // 📈 Métricas
  similarCount: number; // Contagem de denúncias similares
}
```

### **Exemplo Real:**

```json
{
  "address": {
    "city": "Imperatriz",
    "district": "Parque Sanharol",
    "fallbackName": "Parque Sanharol",
    "latitude": -5.5110338,
    "longitude": -47.4512995,
    "postalCode": "65914-408",
    "state": "Maranhão"
  },
  "createdAt": "2023-11-12T20:05:30.000Z",
  "description": "Poça próximo ao meio fio",
  "imageUrl": "https://firebasestorage.googleapis.com/v0/b/scanitz.appspot.com/o/complaints%2F02gcBzAVNZJFz9JV2FKA%2Fd2cd6e20-8196-11ee-87e4-774e83843340?alt=media&token=018fe6e9-c095-4e12-9fae-9f6e9395b7e9",
  "similarCount": 1,
  "situation": {
    "status": 1
  },
  "thumbnailUrl": "https://firebasestorage.googleapis.com/v0/b/scanitz.appspot.com/o/complaints%2F02gcBzAVNZJFz9JV2FKA%2Fd2cd6e20-8196-11ee-87e4-774e83843340-thumbnail?alt=media&token=5bb02cc4-cc88-43fe-9c2f-af045367efd5",
  "updatedAt": "2023-11-12T20:05:30.000Z",
  "userId": "LaycJMtTUsUFhJvtDBbV00NYWbM2",
  "userName": "Jaires Almeida De Araújo"
}
```

---

## 🔢 **Mapeamento de Status**

### **Status da Denúncia (`situation.status`):**

- **`0`** = Pendente (recém criada, aguardando análise)
- **`1`** = Em Progresso (sendo trabalhada/resolvida)
- **`2`** = Resolvida (problema solucionado)

---

## 🌐 **URLs do Firebase Storage**

### **Padrão das URLs:**

- **Imagem Original**: `https://firebasestorage.googleapis.com/v0/b/scanitz.appspot.com/o/complaints%2F{COMPLAINT_ID}%2F{UUID}?alt=media&token={TOKEN}`
- **Thumbnail**: `https://firebasestorage.googleapis.com/v0/b/scanitz.appspot.com/o/complaints%2F{COMPLAINT_ID}%2F{UUID}-thumbnail?alt=media&token={TOKEN}`

### **Organização:**

- Pasta: `complaints/{COMPLAINT_ID}/`
- Arquivo original: `{UUID}`
- Thumbnail: `{UUID}-thumbnail`

---

## 📊 **Campos Importantes para APIs**

### **Para Mapas de Calor:**

- `address.latitude` / `address.longitude` - Coordenadas precisas
- `situation.status` - Para filtros de status
- `address.district` - Para agrupamentos
- `description` - Para títulos/descrições
- `similarCount` - Para peso dos pontos

### **Para Busca:**

- `description` - Texto principal
- `address.district` / `address.city` - Localização
- `userName` - Autor da denúncia
- `createdAt` - Data para ordenação

### **Para Dashboard:**

- `situation.status` - Métricas de status
- `address.district` - Distribuição geográfica
- `createdAt` - Análise temporal
- `similarCount` - Pontos críticos

---

## 🔗 **Relacionamentos**

### **User ↔ Complaint:**

- `complaints.userId` → `users.{documentId}`
- `complaints.userName` → `users.fullName` (desnormalizado)

### **Geolocalização:**

- `address.latitude` + `address.longitude` = Coordenadas GPS
- `address.district` + `address.city` = Localização textual
- `address.postalCode` = CEP brasileiro

---

## 🛠️ **Otimizações Implementadas**

### **Storage Otimizado:**

- Imagens originais para qualidade
- Thumbnails para performance
- URLs com tokens de segurança

### **Dados Desnormalizados:**

- `userName` replicado para evitar JOINs
- `similarCount` pré-calculado
- `address.fallbackName` para consistência

### **Indexação Sugerida:**

- `situation.status` - Para filtros rápidos
- `address.district` - Para agrupamentos
- `createdAt` - Para ordenação temporal
- `userId` - Para consultas por usuário

---

## 📈 **Estatísticas Atuais**

- **Usuários**: ~36 documentos
- **Denúncias**: ~76 documentos
- **Coordenadas válidas**: 56 denúncias
- **Localização**: Imperatriz, Maranhão
- **Período**: Desde novembro de 2023
