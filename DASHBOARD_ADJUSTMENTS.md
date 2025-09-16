# 📋 **AJUSTES NA PROPOSTA - DASHBOARD SOMENTE EXIBIÇÃO**

## 🎯 **Mudanças Realizadas**

### **❌ REMOVIDO:**

- **Moderação**: Todos os endpoints de aprovação/rejeição de denúncias
- **Gestão de Usuários**: Bloqueio, banimento, advertências
- **Permissões**: Sistema complexo de roles e permissions
- **Ações Administrativas**: Edição, exclusão, moderação em lote
- **Notificações Push**: Alertas automáticos para administradores
- **Bull Queue**: Processamento de background desnecessário

### **✅ MANTIDO E FOCADO:**

- **Dashboard Analytics**: KPIs, estatísticas, gráficos
- **Visualizações Geográficas**: Mapas de calor, hotspots
- **Relatórios**: Exportação de dados (CSV, JSON)
- **Real-time**: Updates automáticos dos dados no dashboard
- **Busca Avançada**: Filtros e pesquisa inteligente
- **Performance**: Paginação, cache, otimizações

## 📊 **NOVA ESTRUTURA DE ENDPOINTS**

### **Core Dashboard:**

```
GET /api/v1/dashboard/overview          # KPIs principais
GET /api/v1/analytics/geographic        # Dados geográficos
GET /api/v1/analytics/temporal          # Análise temporal
GET /api/v1/geo/heatmap                 # Mapa de calor
GET /api/v1/geo/hotspots                # Regiões críticas
```

### **Configurações (Read-Only):**

```
GET /api/v1/system/info                 # Info do sistema
GET /api/v1/config/public               # Configurações públicas
```

### **Real-time (Somente Dados):**

```
WS /api/v1/ws/dashboard                 # WebSocket updates
GET /api/v1/updates/since/:timestamp    # Polling otimizado
```

## ⏱️ **TIMELINE ATUALIZADA**

### **📋 Fase 1 - Dashboard Básico (2-3 semanas)**

- Melhorar endpoints existentes (paginação, filtros)
- Criar `/dashboard/overview` com KPIs
- Implementar analytics geográficos básicos

### **📊 Fase 2 - Analytics Avançados (2-3 semanas)**

- Análise temporal detalhada
- Mapas de calor e hotspots
- Sistema de exportação de dados
- Busca avançada

### **⚙️ Fase 3 - Configurações (1 semana)**

- Informações do sistema
- Configurações públicas para frontend
- Health checks

### **🔔 Fase 4 - Real-time (1-2 semanas)**

- WebSocket para updates de dados
- Sistema de polling otimizado
- Sincronização automática

## 🎯 **RESULTADO FINAL**

**Dashboard Web de Visualização Completo:**

- ✅ Analytics em tempo real
- ✅ Mapas interativos com heatmap
- ✅ Relatórios e exportação
- ✅ Filtros avançados
- ✅ Performance otimizada
- ✅ Atualizações automáticas

**Sem complexidade administrativa:**

- ❌ Sem moderação
- ❌ Sem gestão de usuários
- ❌ Sem sistema de aprovação
- ❌ Focado 100% em exibição de dados

## 📈 **ESTIMATIVA FINAL**

**Total: 6-8 semanas** (ao invés de 8-12)

**Redução de 25-33% no tempo** por remover toda a parte administrativa e focar apenas na visualização de dados para o dashboard web.

---

_Atualizado em: 16 de setembro de 2025_
