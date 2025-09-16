# 🚀 **SCANITZ API - MELHORIAS E NOVOS ENDPOINTS**

## 📊 **DASHBOARD SUPERCOMPLETO - PROPOSTA DE ENDPOINTS**

### 🎯 **Objetivo**

Transformar a API ScanITZ em uma plataforma completa para dashboard web com analytics avançados e visualizações em tempo real focado em **exibição de dados**.

---

## � **SISTEMA DE AUTENTICAÇÃO FIREBASE**

### **🚨 PROBLEMA CRÍTICO IDENTIFICADO**

Atualmente as rotas não exigem autenticação, permitindo acesso irrestrito aos dados. Isso representa um **risco de segurança grave**.

### **🛡️ SOLUÇÃO: MIDDLEWARE DE AUTENTICAÇÃO**

#### **Implementação do Firebase Auth:**

```typescript
// Middleware principal
authenticateFirebaseToken: Requer token válido
optionalAuthentication: Token opcional
requireEmailVerified: Exige email verificado
requireOwnership: Verifica propriedade do recurso

// Header obrigatório nas requests
Authorization: Bearer <firebase_jwt_token>
```

#### **🔒 ROTAS QUE PRECISAM DE AUTENTICAÇÃO:**

**🟥 CRÍTICAS (Obrigatório):**

- `POST /complaints` - Criar denúncia
- `PUT/PATCH /complaints/:id` - Editar denúncia própria
- `GET /users/:uid` - Ver perfil (apenas próprio)
- `PUT /users/:uid` - Editar perfil (apenas próprio)
- `GET /users/:uid/complaints` - Denúncias do usuário

**🟨 IMPORTANTES (Opcional melhorado):**

- `GET /complaints` - Lista com dados personalizados se logado
- `GET /complaints/:id` - Detalhes com mais info se for dono
- `GET /dashboard/*` - Analytics personalizados se logado

**🟩 PÚBLICAS (Sem auth):**

- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /system/info` - Info do sistema
- `GET /config/public` - Configurações públicas

---

## �🔧 **MELHORIAS NOS ENDPOINTS EXISTENTES**

### **1. 👥 USERS - Melhorias**

#### **🔄 Endpoints Melhorados:**

```typescript
// ✅ ATUAL: GET /users/
// 🚀 MELHORADO: GET /users?page=1&limit=10&search=nome&orderBy=created_at
GET /api/v1/users
Query Params:
- page: number (default: 1)
- limit: number (default: 50, max: unlimited)
- search: string (busca por nome/email/cpf)
- orderBy: string (created_at, fullName, email)
- order: string (asc, desc)
- status: string (active, inactive, blocked)

// ✅ ATUAL: GET /users/:uid
// 🚀 MELHORADO: Adicionar mais dados estatísticos
GET /api/v1/users/:uid
Response: {
  ...userData,
  statistics: {
    totalComplaints: number,
    resolvedComplaints: number,
    pendingComplaints: number,
    averageResponseTime: number,
    joinedDaysAgo: number,
    lastActivityDate: Date
  }
}
```

#### **🆕 Novos Endpoints Users:**

```typescript
// Estatísticas gerais de usuários
GET /api/v1/users/stats
Response: {
  totalUsers: number,
  activeUsers: number,
  newUsersThisMonth: number,
  usersByDistrict: Array<{district: string, count: number}>,
  userGrowthChart: Array<{date: string, count: number}>
}

// Usuários mais ativos
GET /api/v1/users/top-contributors?limit=50
Response: Array<{
  uid: string,
  name: string,
  totalComplaints: number,
  resolvedComplaints: number,
  score: number
}>

// Atualizar perfil de usuário
PUT /api/v1/users/:uid
PATCH /api/v1/users/:uid/status (admin only)
```

### **2. 📋 COMPLAINTS - Melhorias**

#### **🔄 Endpoints Melhorados:**

```typescript
// ✅ ATUAL: GET /complaints/
// 🚀 MELHORADO: Filtros avançados e paginação
GET /api/v1/complaints
Query Params:
- page: number
- limit: number
- status: number | string (0,1,2,3 ou pending,resolved,etc)
- district: string
- city: string
- dateFrom: Date
- dateTo: Date
- hasImage: boolean
- userId: string
- orderBy: string (created_at, updated_at, similarCount)
- lat: number (busca por proximidade)
- lng: number
- radius: number (em metros)

// ✅ ATUAL: GET /complaints/:id
// 🚀 MELHORADO: Mais detalhes e relacionamentos
GET /api/v1/complaints/:id
Response: {
  ...complaintData,
  user: { uid, name, email }, // dados do usuário
  similarComplaints: Array<ComplaintSummary>,
  statusHistory: Array<{status, date, note}>,
  interactions: {
    views: number,
    shares: number,
    likes: number
  }
}
```

---

## 🆕 **NOVOS ENDPOINTS PARA DASHBOARD**

### **3. 📊 ANALYTICS & DASHBOARD**

```typescript
// Dashboard geral com KPIs principais
GET /api/v1/dashboard/overview
Response: {
  summary: {
    totalComplaints: number,
    resolvedComplaints: number,
    pendingComplaints: number,
    totalUsers: number,
    averageResolutionTime: number,
    complaintsThisMonth: number,
    growthRate: number
  },
  charts: {
    complaintsPerMonth: Array<{month: string, count: number}>,
    complaintsByStatus: Array<{status: string, count: number}>,
    complaintsByDistrict: Array<{district: string, count: number}>,
    userGrowth: Array<{date: string, users: number}>
  }
}

// Estatísticas geográficas avançadas
GET /api/v1/analytics/geographic
Response: {
  heatmapData: Array<{lat: number, lng: number, intensity: number}>,
  districtStats: Array<{
    district: string,
    totalComplaints: number,
    resolvedRate: number,
    averageResolutionTime: number,
    mostCommonIssues: Array<string>
  }>,
  cityComparison: Array<{city: string, stats: object}>
}

// Análise temporal detalhada
GET /api/v1/analytics/temporal
Query: ?period=daily|weekly|monthly&range=30d|3m|1y
Response: {
  timeline: Array<{date: string, complaints: number, resolved: number}>,
  patterns: {
    peakHours: Array<{hour: number, count: number}>,
    peakDays: Array<{day: string, count: number}>,
    seasonalTrends: Array<{month: string, average: number}>
  }
}

// Análise de performance
GET /api/v1/analytics/performance
Response: {
  resolution: {
    averageTime: number,
    byStatus: Array<{status: number, avgTime: number}>,
    byDistrict: Array<{district: string, avgTime: number}>
  },
  efficiency: {
    responseRate: number,
    satisfactionScore: number,
    backlogSize: number
  }
}

// Estatísticas de engajamento
GET /api/v1/analytics/engagement
Response: {
  userEngagement: {
    activeUsers: number,
    returningUsers: number,
    averageComplaintsPerUser: number
  },
  contentStats: {
    complaintsWithImages: number,
    averageDescriptionLength: number,
    mostUsedKeywords: Array<{word: string, count: number}>
  }
}
```

### **4. 🗺️ ENDPOINTS GEOGRÁFICOS AVANÇADOS**

```typescript
// Mapa de calor das denúncias
GET /api/v1/geo/heatmap
Query: ?status=all&timeRange=30d
Response: Array<{
  lat: number,
  lng: number,
  weight: number,
  complaints: number,
  severity: string
}>

// Análise por raio de distância
GET /api/v1/geo/radius/:lat/:lng/:radius
Response: {
  complaints: Array<ComplaintSummary>,
  stats: {
    total: number,
    byStatus: object,
    density: number
  }
}

// Regiões com mais problemas
GET /api/v1/geo/hotspots
Response: Array<{
  center: {lat: number, lng: number},
  radius: number,
  complaintCount: number,
  severity: number,
  mainIssues: Array<string>
}>

// Comparação entre bairros
GET /api/v1/geo/districts/compare
Response: Array<{
  district: string,
  metrics: {
    totalComplaints: number,
    resolutionRate: number,
    avgResponseTime: number,
    population: number, // se disponível
    complaintsPerCapita: number
  }
}>
```

### **5. 🔍 BUSCA E FILTROS AVANÇADOS**

```typescript
// Busca inteligente
GET /api/v1/search
Query: ?q=buraco&type=complaints|users&filters=...
Response: {
  complaints: Array<ComplaintSummary>,
  users: Array<UserSummary>,
  suggestions: Array<string>,
  totalResults: number
}

// Filtros salvos (para dashboard personalizado)
GET /api/v1/saved-filters
POST /api/v1/saved-filters
PUT /api/v1/saved-filters/:id
DELETE /api/v1/saved-filters/:id

// Relatórios personalizados
POST /api/v1/reports/generate
Body: {
  type: string,
  filters: object,
  format: 'json' | 'csv' | 'pdf',
  email?: string
}
```

---

## � **ENDPOINTS DE CONFIGURAÇÃO (SOMENTE LEITURA)**

### **6. ⚙️ CONFIGURAÇÕES DO SISTEMA**

```typescript
// Informações do sistema (apenas leitura)
GET /api/v1/system/info
Response: {
  version: string,
  uptime: number,
  database: {
    status: 'connected' | 'disconnected',
    collections: Array<{name: string, count: number}>
  },
  lastUpdate: Date
}

// Configurações públicas
GET /api/v1/config/public
Response: {
  mapSettings: {
    defaultCenter: {lat: number, lng: number},
    defaultZoom: number,
    bounds: object
  },
  categories: Array<{id: string, name: string, icon: string}>,
  statusLabels: Array<{id: number, label: string, color: string}>
}
```

### **7. 📈 RELATÓRIOS E EXPORTAÇÃO**

```typescript
// Relatórios automáticos
GET /api/v1/reports/weekly
GET /api/v1/reports/monthly
GET /api/v1/reports/annual

// Exportação de dados
GET /api/v1/export/complaints?format=csv&filters=...
GET /api/v1/export/users?format=xlsx
GET /api/v1/export/analytics?format=json&period=3m

// Relatórios customizados
POST /api/v1/reports/custom
Body: {
  name: string,
  description: string,
  query: object,
  schedule?: string, // cron expression
  recipients?: Array<string>
}
```

---

## 🔔 **REAL-TIME E ATUALIZAÇÕES**

### **8. � SISTEMA DE ATUALIZAÇÕES EM TEMPO REAL**

```typescript
// WebSocket para updates em tempo real (somente dados)
WS /api/v1/ws/dashboard
Events: {
  newComplaint: ComplaintData,
  statusUpdate: {id: string, status: number},
  statsUpdate: {totalComplaints: number, resolved: number},
  geographicUpdate: {district: string, newCount: number}
}

// SSE (Server-Sent Events) como alternativa
GET /api/v1/sse/dashboard
Events: same as WebSocket

// Polling endpoints otimizados
GET /api/v1/updates/since/:timestamp
Response: {
  complaints: Array<ComplaintData>,
  stats: object,
  lastUpdate: timestamp
}
```

---

## 🔐 **AUTENTICAÇÃO SIMPLIFICADA**

### **9. 🛡️ SISTEMA DE AUTENTICAÇÃO BÁSICO**

```typescript
// Login básico (mantém o atual)
POST /api/v1/auth/login
Response: {
  ...userData,
  token: string
}

// Refresh token
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

// Verificação de token
GET /api/v1/auth/verify
Response: {
  valid: boolean,
  user: UserData
}

// Informações do usuário logado
GET /api/v1/auth/profile
```

---

## 📊 **ESTRUTURA DE RESPOSTA PADRONIZADA**

```typescript
interface APIResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: string;
    executionTime: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

---

## 🚀 **IMPLEMENTAÇÃO PRIORITÁRIA**

### **� Fase 0 - SEGURANÇA CRÍTICA (1 semana) - URGENTE!**

1. 🚨 **Implementar middleware de autenticação Firebase**
2. 🚨 **Configurar Firebase Admin SDK**
3. 🚨 **Proteger rotas críticas com auth obrigatória**
4. 🚨 **Implementar verificação de propriedade de recursos**
5. 🚨 **Adicionar validação de token em todas as rotas sensíveis**

### **�📋 Fase 1 - Dashboard Básico (2-3 semanas)**

1. ✅ Melhorar endpoints existentes com paginação
2. ✅ Criar endpoint `/dashboard/overview`
3. ✅ Implementar filtros avançados em `/complaints`
4. ✅ Adicionar `/analytics/geographic`
5. ✅ **Integrar autenticação nos novos endpoints**

### **📊 Fase 2 - Analytics Avançados (3-4 semanas)**

1. ✅ Endpoints de análise temporal
2. ✅ Sistema de busca inteligente
3. ✅ Relatórios automáticos
4. ✅ Exportação de dados

### **⚙️ Fase 3 - Configurações e Sistema (1-2 semanas)**

1. ✅ Informações do sistema
2. ✅ Configurações públicas
3. ✅ Metadados para frontend
4. ✅ Status e health checks

### **🔔 Fase 4 - Real-time (1-2 semanas)**

1. ✅ WebSocket para updates de dados
2. ✅ Updates automáticos do dashboard
3. ✅ Sincronização em tempo real

---

## 💡 **TECNOLOGIAS RECOMENDADAS**

### **Backend Additions:**

- **Redis**: Cache para performance
- **Socket.io**: WebSocket real-time
- **Winston**: Logging avançado
- **Joi**: Validação de entrada
- **Rate Limiting**: Proteção API
- **Compression**: Compressão de responses

### **Database Optimizations:**

- **Indexes**: Otimizar queries Firestore
- **Aggregations**: Pre-computar estatísticas
- **Caching**: Redis para dados frequentes

---

---

## 🎯 **RESUMO DA PROPOSTA ATUALIZADA**

**Este plano transformará a ScanITZ API em uma plataforma completa para dashboard web focado em visualização de dados urbanos! 🏙️✨**

### **Principais Focos:**

- **� SEGURANÇA**: Sistema de autenticação Firebase completo
- **�📊 Analytics e Visualizações**: Dados completos para dashboard
- **🗺️ Mapas Interativos**: Heatmaps e análise geográfica
- **📈 Relatórios**: Exportação e análise temporal
- **🔔 Real-time**: Atualizações automáticas de dados
- **⚙️ Configurações**: Sistema de configuração público

### **Removido do Escopo:**

- ❌ Moderação e aprovação de denúncias
- ❌ Sistema de permissões complexo (admin/moderator)
- ❌ Gestão administrativa de usuários
- ❌ Notificações push e alertas

### **⚠️ ADICIONADO AO ESCOPO (CRÍTICO):**

- ✅ **Sistema de autenticação Firebase**
- ✅ **Middleware de segurança**
- ✅ **Proteção de rotas sensíveis**
- ✅ **Verificação de propriedade de recursos**

**Estimativa total: 7-9 semanas de desenvolvimento** (+1 semana para segurança crítica)
