# Manual da API Scanitz V1

## Visão Geral

A API Scanitz é uma API RESTful completa para gerenciamento de denúncias urbanas. Esta documentação contém todos os endpoints, exemplos e especificações técnicas.

**Base URL**: `http://localhost:3000/api/v1`  
**Documentação Interativa**: `http://localhost:3000/api/v1/docs` (Swagger UI)  
**Especificação JSON**: `http://localhost:3000/api/v1/swagger.json`

## Autenticação

A API utiliza JWT (JSON Web Token) para autenticação.

```bash
# Header de autorização
Authorization: Bearer <seu_jwt_token>
```

## Endpoints Disponíveis

### 🔐 Autenticação

#### POST `/auth/login`

Autentica um usuário e retorna JWT token.

**Request:**

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": {
    "uid": "user123",
    "fullName": "João Silva",
    "email": "usuario@exemplo.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST `/auth/register`

Registra um novo usuário.

**Request:**

```json
{
  "email": "novo@usuario.com",
  "password": "senha123",
  "fullName": "Novo Usuário",
  "documentNumber": "12345678901",
  "phoneNumber": "(99) 99999-9999"
}
```

### 👥 Usuários

#### GET `/users`

Lista usuários com filtros avançados. **Requer autenticação.**

**Parâmetros:**

- `page` (int): Número da página (padrão: 1)
- `limit` (int): Itens por página (padrão: 50, máx: 100)
- `search` (string): Buscar por nome, email ou telefone
- `orderBy` (string): Campo para ordenação (created_at, name, email, city)
- `order` (string): Direção (asc, desc)
- `status` (string): all, verified, unverified
- `city` (string): Filtrar por cidade
- `district` (string): Filtrar por bairro

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": [
    {
      "uid": "user123",
      "fullName": "João Silva",
      "email": "joao@email.com",
      "city": "Imperatriz",
      "district": "Centro",
      "verified": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

#### GET `/users/statistics`

Estatísticas detalhadas dos usuários. **Requer autenticação.**

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "verifiedUsers": 1100,
      "unverifiedUsers": 150,
      "verificationRate": "88%"
    },
    "growth": {
      "last30Days": 45,
      "last7Days": 12,
      "today": 3
    },
    "demographics": {
      "topCities": [
        { "city": "Imperatriz", "count": 800 },
        { "city": "Açailândia", "count": 200 }
      ],
      "topDistricts": [
        { "district": "Centro", "count": 150 },
        { "district": "Mercadinho", "count": 120 }
      ]
    }
  }
}
```

### 📋 Denúncias

#### GET `/complaints/proximity`

Busca denúncias por proximidade geográfica.

**Parâmetros:**

- `latitude` (float, obrigatório): Latitude de referência
- `longitude` (float, obrigatório): Longitude de referência
- `radius` (float): Raio em km (padrão: 1)
- `limit` (int): Máximo de resultados (padrão: 20)

**Exemplo:**

```bash
GET /complaints/proximity?latitude=-5.5292&longitude=-47.4622&radius=2&limit=10
```

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": [
    {
      "id": "complaint123",
      "title": "Buraco na rua",
      "description": "Grande buraco causando acidentes",
      "address": {
        "street": "Rua das Flores, 123",
        "district": "Centro",
        "city": "Imperatriz",
        "latitude": -5.5285,
        "longitude": -47.4615
      },
      "status": 0,
      "distance": 0.8,
      "created_at": "2024-01-10T14:20:00Z"
    }
  ],
  "meta": {
    "center": { "latitude": -5.5292, "longitude": -47.4622 },
    "radius": 2,
    "totalFound": 8
  }
}
```

#### GET `/complaints/positions`

Coordenadas de todas as denúncias para mapas.

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": [
    {
      "id": "complaint123",
      "latitude": -5.5292,
      "longitude": -47.4622,
      "status": 0
    }
  ]
}
```

#### GET `/complaints/heatmap` ⭐ **NOVO**

Dados otimizados para mapa de calor com clustering inteligente.

**Parâmetros:**

- `bounds` (object): Limites geográficos {north, south, east, west}
- `zoom` (int): Nível de zoom 1-15 (padrão: 10)
- `status` (string): all, pending, progress, resolved

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": {
    "points": [
      {
        "lat": -5.5292,
        "lng": -47.4622,
        "weight": 3,
        "status": 0,
        "id": "complaint123",
        "title": "Buraco na rua",
        "district": "Centro"
      }
    ],
    "clusters": [
      {
        "lat": -5.53,
        "lng": -47.46,
        "count": 5,
        "status_breakdown": {
          "pending": 3,
          "progress": 1,
          "resolved": 1
        }
      }
    ],
    "summary": {
      "total": 56,
      "byStatus": {
        "pending": 23,
        "progress": 18,
        "resolved": 15
      },
      "byDistrict": [
        { "district": "Centro", "total": 12, "pending": 5 },
        { "district": "Mercadinho", "total": 8, "pending": 3 }
      ],
      "center": { "lat": -5.5292, "lng": -47.4622 },
      "bounds": {
        "north": -5.51,
        "south": -5.54,
        "east": -47.45,
        "west": -47.47
      }
    }
  },
  "meta": {
    "total": 56,
    "generated_at": "2024-01-15T10:30:00Z",
    "zoom_level": 10,
    "filtered_by": "all"
  }
}
```

#### GET `/complaints/analytics`

Analytics avançados de denúncias.

**Parâmetros:**

- `period` (string): 7d, 30d, 90d, 1y
- `groupBy` (string): day, week, month, city, district, status

### 🔍 Sistema de Busca

#### GET `/search`

Busca unificada inteligente em usuários e denúncias.

**Parâmetros:**

- `q` (string, obrigatório): Termo de busca
- `type` (string): all, users, complaints
- `page` (int): Número da página
- `limit` (int): Itens por página (máx: 50)
- `sortBy` (string): relevance, date, title
- `filters` (string): Filtros em JSON

**Exemplo:**

```bash
GET /search?q=buraco%20rua&type=complaints&limit=10
```

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": {
    "results": [
      {
        "type": "complaint",
        "id": "complaint123",
        "title": "Buraco na Rua das Flores",
        "subtitle": "Centro, Imperatriz",
        "description": "Grande buraco causando acidentes...",
        "imageUrl": "https://...",
        "relevanceScore": 0.95,
        "url": "/complaints/complaint123"
      }
    ],
    "summary": {
      "total": 25,
      "users": 5,
      "complaints": 20,
      "searchTime": 0.045
    },
    "suggestions": ["buraco na rua", "buracos centro"],
    "facets": {
      "districts": [
        { "name": "Centro", "count": 15 },
        { "name": "Mercadinho", "count": 5 }
      ]
    }
  }
}
```

#### GET `/search/autocomplete`

Sugestões para autocompletar busca.

**Parâmetros:**

- `q` (string, obrigatório): Termo parcial (mín: 2 chars)
- `type` (string): all, users, complaints
- `limit` (int): Máximo de sugestões (padrão: 8)

### 📊 Dashboard e KPIs

#### GET `/dashboard`

Dashboard principal com KPIs em tempo real.

**Parâmetros:**

- `period` (string): 7d, 30d, 90d, 1y (padrão: 30d)

**Response:**

```json
{
  "success": true,
  "statuscode": 200,
  "data": {
    "kpis": {
      "users": {
        "total": 1250,
        "new": 45,
        "active": 890,
        "verified": 1100,
        "growthRate": {
          "value": 15.2,
          "trend": "up"
        }
      },
      "complaints": {
        "total": 856,
        "new": 23,
        "resolved": 445,
        "pending": 234,
        "inProgress": 177,
        "resolutionRate": "52%",
        "averageResolutionTime": 12.5
      },
      "engagement": {
        "complaintsPerUser": "0.68",
        "activeUsersPercentage": "71%"
      }
    },
    "comparison": {
      "users": { "change": "+15%", "trend": "up" },
      "complaints": { "change": "+8%", "trend": "up" },
      "resolution": { "change": "+5%", "trend": "up" }
    }
  }
}
```

#### GET `/dashboard/executive-report`

Relatório executivo detalhado.

**Parâmetros:**

- `period` (string): weekly, monthly, quarterly, yearly
- `format` (string): json, summary

#### GET `/dashboard/realtime-kpis`

KPIs atualizados em tempo real.

### 🛡️ Administração

#### GET `/admin`

Informações do painel administrativo.

#### GET `/admin/users`

Gerenciamento administrativo de usuários. **Requer privilégios admin.**

#### GET `/admin/complaints`

Moderação de denúncias. **Requer privilégios admin.**

#### GET `/admin/audit`

Logs de auditoria do sistema. **Requer privilégios admin.**

#### GET `/admin/system`

Informações técnicas e saúde do sistema.

## Códigos de Status HTTP

- `200` - Sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `429` - Muitas requisições
- `500` - Erro interno do servidor

## Rate Limiting

- **Usuários autenticados**: 1000 req/hora
- **Usuários anônimos**: 100 req/hora
- **Endpoints de busca**: 300 req/hora

## Dados Reais Disponíveis

### Estatísticas Atuais (Banco de Dados)

- **Total de denúncias**: 56 com coordenadas válidas
- **Cobertura geográfica**: Região de Imperatriz-MA
- **Bairros cobertos**: Centro, Mercadinho, Vila Lobão, Bacuri, Santa Rita
- **Coordenadas**: Latitude -5.5100 a -5.5400, Longitude -47.4500 a -47.4700
- **Status disponíveis**: Pendente (0), Em Andamento (1), Resolvido (2)

### Exemplos de Coordenadas Reais

```json
[
  { "lat": -5.5292, "lng": -47.4622, "district": "Centro" },
  { "lat": -5.5285, "lng": -47.4615, "district": "Mercadinho" },
  { "lat": -5.531, "lng": -47.458, "district": "Vila Lobão" }
]
```

## Testes com cURL

```bash
# Testar heatmap (endpoint mais importante)
curl "http://localhost:3000/api/v1/complaints/heatmap?zoom=12&status=all"

# Testar busca
curl "http://localhost:3000/api/v1/search?q=buraco&type=complaints"

# Testar dashboard
curl "http://localhost:3000/api/v1/dashboard?period=30d"

# Testar posições para mapa simples
curl "http://localhost:3000/api/v1/complaints/positions"
```

## Exemplos de Integração Frontend

### React Query (Recomendado)

```typescript
// hooks/useHeatmapData.ts
import { useQuery } from "@tanstack/react-query";

export const useHeatmapData = (zoom: number, status: string) => {
  return useQuery({
    queryKey: ["heatmap", zoom, status],
    queryFn: () =>
      fetch(`/api/v1/complaints/heatmap?zoom=${zoom}&status=${status}`).then(
        (res) => res.json()
      ),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
```

### Axios Client

```typescript
// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

export const getHeatmapData = (params: HeatmapParams) =>
  api.get("/complaints/heatmap", { params });

export const searchComplaints = (query: string) =>
  api.get("/search", { params: { q: query, type: "complaints" } });
```

## Performance e Caching

- **Cache TTL**: 5 minutos para dados de dashboard
- **Cache TTL**: 1 minuto para dados de heatmap
- **Cache TTL**: 30 segundos para busca
- **Compression**: Gzip habilitado
- **CDN Ready**: Headers apropriados configurados

## Suporte

- **Swagger UI**: `http://localhost:3000/api/v1/docs`
- **Health Check**: `http://localhost:3000/health`
- **API Status**: Todos os 18 endpoints funcionais
- **Última atualização**: 16 de setembro de 2025
