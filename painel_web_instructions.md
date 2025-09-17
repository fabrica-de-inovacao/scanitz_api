# Instruções para Criação do Painel Web - Scanitz

## Visão Geral do Projeto

Você deve criar um painel web moderno e responsivo para a plataforma **Scanitz**, uma aplicação de denúncias urbanas para a cidade de Imperatriz-MA. O painel será público e focado na transparência, permitindo aos cidadãos visualizar dados sobre denúncias urbanas através de mapas de calor, estatísticas e dashboards interativos.

## Tecnologias Obrigatórias

- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS** (para estilização)
- **Clean Code** e **Clean Architecture**

## Design System e Identidade Visual

### Paleta de Cores Principal

- **Vermelho Primário**: `#DC2626` (red-600) - Tom harmonioso que remete à urgência das denúncias sem ser exagerado
- **Vermelho Secundário**: `#EF4444` (red-500) - Para highlights e estados hover
- **Vermelho Suave**: `#FEE2E2` (red-50) - Para backgrounds sutis
- **Cinza Moderno**: `#6B7280` (gray-500) - Para textos secundários
- **Branco**: `#FFFFFF` - Background principal
- **Preto Suave**: `#111827` (gray-900) - Para textos principais

### Princípios de Design

- **Minimalismo**: Interface limpa focada no conteúdo
- **Hierarquia Visual Clara**: Tipografia bem definida com diferentes pesos
- **Espaçamento Consistente**: Sistema de grid 8px base
- **Responsividade Extrema**: Funcionar perfeitamente de 320px até 4K (4096px)
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Performance**: Loading instantâneo com skeleton screens

## Arquitetura do Frontend

### Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx           # Dashboard principal
│   ├── denuncias/         # Páginas de denúncias
│   ├── mapas/            # Visualizações em mapa
│   └── estatisticas/     # Dashboards estatísticos
├── components/
│   ├── ui/               # Componentes base (Button, Card, etc.)
│   ├── charts/           # Gráficos e visualizações
│   ├── maps/             # Componentes de mapa
│   ├── layout/           # Header, Footer, Sidebar
│   └── features/         # Componentes específicos por feature
├── lib/
│   ├── api/              # Cliente da API
│   ├── utils/            # Utilitários
│   ├── hooks/            # Custom hooks
│   └── types/            # TypeScript types
├── services/             # Serviços de negócio
└── constants/            # Constantes da aplicação
```

## Páginas e Funcionalidades Públicas

### 1. Dashboard Principal (`/`)

- **KPIs em Cards**: Total de denúncias, resolvidas, pendentes, tempo médio de resolução
- **🔥 MAPA DE CALOR PRINCIPAL**: Visualização geográfica central usando `/api/v1/complaints/heatmap`
  - Densidade de denúncias por região
  - Cores graduais baseadas na intensidade (verde → amarelo → vermelho)
  - Clustering automático por nível de zoom
  - Filtros por status e período
- **Gráficos de Tendência**: Denúncias por período, status, bairro
- **Métricas de Transparência**: Taxa de resolução, tempo de resposta da prefeitura

### 2. Mapa Interativo (`/mapas`)

- **🗺️ MAPA DE CALOR DEDICADO**: Página full-screen com Leaflet + leaflet.heat
- **Camadas Duplas**: Mapa de calor + marcadores individuais
- **Filtros Avançados**: Por status, período, tipo de denúncia, bairro
- **Clustering Inteligente**: Baseado no zoom level (usar dados do endpoint `/api/v1/complaints/heatmap`)
- **Popups Informativos**: Detalhes da denúncia ao clicar
- **Controles de Zoom**: Otimizado para desktop e mobile
- **Toggle de Visualização**: Alternar entre heatmap e marcadores normais

### 3. Estatísticas e Analytics (`/estatisticas`)

- **Dashboard Executivo**: Usando `/api/v1/dashboard`
- **Relatórios Visuais**: Gráficos de barras, pizza, linha temporal
- **Comparativos**: Período atual vs anterior
- **Insights Automáticos**: Texto gerado baseado nos dados
- **Exportação**: PDF/Excel dos relatórios

### 4. Lista de Denúncias Públicas (`/denuncias`)

- **Cards de Denúncia**: Layout em grid responsivo
- **Filtros e Busca**: Integração com `/api/v1/search`
- **Paginação Infinita**: Performance otimizada
- **Detalhes da Denúncia**: Modal ou página dedicada
- **Status Visual**: Badges coloridos para cada estado

## Componentes Essenciais

### Componentes de UI Base

```typescript
// Seguir padrão shadcn/ui
- Button (variants: primary, secondary, ghost, outline)
- Card (com header, content, footer)
- Badge (status indicators)Te
- Input (com validation states)
- Select (com search)
- Modal/Dialog
- Skeleton (loading states)
- Tooltip
- Alert/Toast
```

### Componentes de Visualização

```typescript
// Charts usando recharts ou chart.js
- LineChart (tendências temporais)
- BarChart (comparativos por categoria)
- PieChart (distribuição de status)
- HeatmapChart (densidade geográfica)
- KPICard (métricas principais)
- StatisticCard (números com contexto)
```

### Componentes de Mapa

```typescript
// Mapas interativos com mapa de calor
- HeatmapLayer (densidade usando leaflet.heat)
- HeatmapOverlay (camada de calor sobre o mapa base)
- ClusterMarker (agrupamento de pontos)
- InfoPopup (detalhes ao clicar)
- FilterControls (controles de filtro)
- ZoomControls (navegação)
- HeatmapToggle (alternar entre mapa de calor e marcadores)
```

## Integração com API

### Cliente HTTP Otimizado

```typescript
// lib/api/client.ts
- Axios ou Fetch API com interceptors
- Cache inteligente (React Query ou SWR)
- Error handling global
- Loading states automáticos
- Retry logic para requests falhos
```

### Endpoints Principais a Consumir

- `GET /api/v1/complaints/heatmap` - Dados para mapa de calor
- `GET /api/v1/complaints/positions` - Posições para mapa básico
- `GET /api/v1/dashboard` - KPIs principais
- `GET /api/v1/dashboard/executive-report` - Relatório executivo
- `GET /api/v1/search` - Sistema de busca unificada
- `GET /api/v1/complaints/analytics` - Analytics avançados

## Responsividade e Performance

### Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large Desktop**: 1440px - 2560px
- **4K+**: 2560px+

### Otimizações Obrigatórias

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Lazy loading de componentes pesados
- **Bundle Analysis**: Webpack Bundle Analyzer
- **Caching Strategy**: Service Workers para cache offline
- **Performance Budget**: First Contentful Paint < 2s

## Boas Práticas de Desenvolvimento

### Clean Code

- **Componentes Pequenos**: Máximo 150 linhas
- **Single Responsibility**: Um propósito por componente
- **Custom Hooks**: Lógica reutilizável extraída
- **Type Safety**: TypeScript strict mode habilitado
- **Error Boundaries**: Tratamento de erros em toda aplicação

### Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright ou Cypress
- **Visual Regression**: Chromatic ou Percy
- **Accessibility Tests**: axe-core integration

### SEO e Meta Tags

- **Dynamic Meta**: Baseado no conteúdo da página
- **Open Graph**: Para compartilhamento social
- **Structured Data**: Schema.org para dados de denúncias
- **Sitemap**: Geração automática

## Recursos Visuais Especiais

### Animações e Micro-interactions

- **Framer Motion**: Animações suaves de entrada/saída
- **Loading Animations**: Skeleton screens personalizados
- **Hover Effects**: Feedback visual imediato
- **Scroll Animations**: Elementos aparecem ao rolar

### Dark Mode (Futuro)

- **Sistema de Temas**: Preparar estrutura para modo escuro
- **Preferência do Sistema**: Detectar configuração do usuário
- **Toggle Suave**: Transição animada entre modos

## Documentação de Referência

### Arquivo de Referência da API

Consulte o arquivo `manual_api.md` que contém:

- Documentação completa de todos os 18 endpoints
- Exemplos de request/response
- Códigos de erro e tratamento
- Rate limits e autenticação
- Swagger UI interativo em `/api/v1/docs`

### Dados Disponíveis

Com base na API, você tem acesso a:

- **56 denúncias** com coordenadas geográficas válidas
- **Cobertura geográfica**: Região de Imperatriz-MA
- **Dados históricos**: Tendências temporais
- **Métricas de performance**: Tempo de resolução, taxas
- **Clustering automático**: Algoritmo de agrupamento por zoom
- **Filtros avançados**: Status, período, localização

## Implementação Progressiva

### Fase 1 - MVP (Mínimo Viável)

1. Dashboard principal com KPIs
2. Mapa básico com marcadores
3. Lista de denúncias
4. Design system básico

### Fase 2 - Melhorias

1. Mapa de calor interativo
2. Filtros avançados
3. Gráficos estatísticos
4. Busca inteligente

### Fase 3 - Avançado

1. Analytics em tempo real
2. Relatórios executivos
3. Exportação de dados
4. PWA (Progressive Web App)

## Considerações Finais

- **Foco na Performance**: O painel será usado em telas grandes, otimize para alta resolução
- **Transparência**: Todos os dados devem ser públicos e facilmente interpretáveis
- **Acessibilidade**: Considere usuários com deficiências visuais
- **Mobile-First**: Mesmo sendo para telas grandes, deve funcionar em mobile
- **Feedback Visual**: Sempre fornecer feedback das ações do usuário
- **Estados de Erro**: Tratamento elegante de falhas de conexão

## Comandos Iniciais Sugeridos

```bash
# Criar projeto Next.js
npx create-next-app@latest scanitz-painel --typescript --tailwind --app

# Usar Yarn como gestor de pacotes (recomendado)
yarn install

# Dependências essenciais para mapas de calor
yarn add @tanstack/react-query axios recharts leaflet react-leaflet
yarn add framer-motion @types/leaflet leaflet.heat
yarn add -D @types/react-leaflet

# Configurar ambiente
cp .env.example .env.local
# API local: NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
# API em Docker: NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Lembre-se: Este painel representa a transparência da gestão pública. Cada pixel deve transmitir confiança e clareza!
