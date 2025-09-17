# 🗺️ **IMPLEMENTAÇÃO DO MAPA DE CALOR - FRONTEND SCANITZ**

## 🎯 **VISÃO GERAL**

Este documento detalha a implementação completa do mapa de calor para o painel web do Scanitz, incluindo tecnologias recomendadas, arquitetura de componentes, design visual e otimizações de performance.

## 📚 **STACK TECNOLÓGICA RECOMENDADA**

### **Biblioteca Principal: React-Leaflet + Leaflet.heat**
```bash
yarn add leaflet react-leaflet leaflet.heat
yarn add @types/leaflet @types/react-leaflet -D
```

**Justificativa da escolha:**
- ✅ **Performance Superior**: Leaflet.heat é otimizado para milhares de pontos
- ✅ **Flexibilidade Total**: Controle completo sobre visualização
- ✅ **TypeScript Friendly**: Tipagem completa disponível
- ✅ **Bundle Size**: Mais leve que Mapbox ou Google Maps
- ✅ **Customização**: Gradientes, opacidade, raio totalmente configuráveis

### **Dependências Complementares**
```bash
# Query e state management
yarn add @tanstack/react-query axios

# Charts e visualizações
yarn add recharts

# Animações
yarn add framer-motion

# Utilitários
yarn add clsx tailwind-merge
yarn add use-debounce
```

---

## 🎨 **DESIGN VISUAL E PALETA DE CORES**

### **Gradiente do Mapa de Calor**
```typescript
const heatmapGradient = {
  // Gradiente otimizado para denúncias urbanas
  0.0: '#10B981',  // Verde (resolvidas) - Sucesso
  0.3: '#F59E0B',  // Amarelo (em progresso) - Atenção  
  0.6: '#EF4444',  // Laranja (urgentes) - Alerta
  1.0: '#DC2626'   // Vermelho (críticas) - Emergência
};

const statusColors = {
  resolved: '#10B981',   // Verde - Tranquilidade
  progress: '#F59E0B',   // Amarelo - Ação
  pending: '#DC2626'     // Vermelho - Urgência
};
```

### **Configuração Visual do Heatmap**
```typescript
const heatmapConfig = {
  radius: 25,           // Raio do ponto de calor
  blur: 15,            // Suavização das bordas
  maxZoom: 18,         // Zoom máximo para heatmap
  opacity: 0.8,        // Transparência geral
  gradient: heatmapGradient,
  minOpacity: 0.1      // Opacidade mínima
};
```

---

## 🏗️ **ARQUITETURA DE COMPONENTES**

### **Estrutura de Pastas**
```
src/
├── components/
│   └── maps/
│       ├── HeatmapContainer.tsx      # Container principal
│       ├── HeatmapLayer.tsx          # Camada de calor
│       ├── ClusterLayer.tsx          # Camada de clusters
│       ├── MarkerLayer.tsx           # Marcadores individuais
│       ├── MapControls.tsx           # Controles de filtro
│       ├── MapLegend.tsx             # Legenda do mapa
│       └── MapPopup.tsx              # Popups informativos
└── hooks/
    ├── useHeatmapData.tsx            # Hook para dados
    ├── useMapControls.tsx            # Hook para controles
    └── useGeolocation.tsx            # Hook para localização
```

---

## 🗺️ **COMPONENTE PRINCIPAL: HeatmapContainer**

```typescript
// components/maps/HeatmapContainer.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { HeatmapLayer } from './HeatmapLayer';
import { ClusterLayer } from './ClusterLayer';
import { MarkerLayer } from './MarkerLayer';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import 'leaflet/dist/leaflet.css';

interface HeatmapContainerProps {
  height?: string;
  showControls?: boolean;
  initialZoom?: number;
  className?: string;
}

export function HeatmapContainer({
  height = 'h-96',
  showControls = true,
  initialZoom = 12,
  className = ''
}: HeatmapContainerProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [filters, setFilters] = useState({
    status: 'all',
    bounds: null,
    period: null
  });

  const { data, isLoading, error } = useHeatmapData({
    zoom,
    status: filters.status,
    bounds: filters.bounds
  });

  // Centro de Imperatriz-MA
  const center: [number, number] = [-5.5292, -47.4622];

  // Determinar qual visualização usar baseado no zoom
  const visualizationType = useMemo(() => {
    if (zoom >= 14) return 'markers';
    if (zoom >= 11) return 'clusters';
    return 'heatmap';
  }, [zoom]);

  if (isLoading) return <MapSkeleton height={height} />;
  if (error) return <MapError />;

  return (
    <div className={`relative ${height} ${className}`}>
      <MapContainer
        center={center}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
        onzoomend={(e) => setZoom(e.target.getZoom())}
      >
        {/* Tile Layer - Base do mapa */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          className="map-tiles"
        />

        {/* Renderização condicional baseada no zoom */}
        {visualizationType === 'heatmap' && (
          <HeatmapLayer
            points={data?.points || []}
            options={heatmapConfig}
          />
        )}

        {visualizationType === 'clusters' && (
          <ClusterLayer
            clusters={data?.clusters || []}
            onClusterClick={(cluster) => {
              // Zoom para o cluster
              setZoom(Math.min(zoom + 2, 18));
            }}
          />
        )}

        {visualizationType === 'markers' && (
          <MarkerLayer
            points={data?.points || []}
            onMarkerClick={(point) => {
              // Abrir popup com detalhes
            }}
          />
        )}
      </MapContainer>

      {/* Controles sobrepostos */}
      {showControls && (
        <>
          <MapControls
            filters={filters}
            onFiltersChange={setFilters}
            visualizationType={visualizationType}
            className="absolute top-4 left-4 z-[1000]"
          />
          
          <MapLegend
            data={data?.summary}
            className="absolute bottom-4 right-4 z-[1000]"
          />
        </>
      )}

      {/* Indicador de zoom atual */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-sm font-medium text-gray-700">
        Zoom: {zoom} • {visualizationType}
      </div>
    </div>
  );
}
```

---

## 🔥 **CAMADA DE CALOR: HeatmapLayer**

```typescript
// components/maps/HeatmapLayer.tsx
'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  status: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  options?: any;
}

export function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    // Converter pontos para formato do leaflet.heat
    const heatmapPoints = points.map(point => [
      point.lat,
      point.lng,
      point.weight / 3 // Normalizar weight (0-1)
    ]);

    // Criar camada de calor
    const heatLayer = (L as any).heatLayer(heatmapPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      opacity: 0.8,
      gradient: {
        0.0: '#10B981', // Verde
        0.3: '#F59E0B', // Amarelo
        0.6: '#EF4444', // Laranja
        1.0: '#DC2626'  // Vermelho
      },
      ...options
    });

    map.addLayer(heatLayer);

    // Cleanup
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
}
```

---

## 🎯 **CAMADA DE CLUSTERS: ClusterLayer**

```typescript
// components/maps/ClusterLayer.tsx
'use client';

import { CircleMarker, Popup } from 'react-leaflet';
import { useMemo } from 'react';

interface Cluster {
  lat: number;
  lng: number;
  count: number;
  status_breakdown: {
    pending: number;
    progress: number;
    resolved: number;
  };
}

interface ClusterLayerProps {
  clusters: Cluster[];
  onClusterClick?: (cluster: Cluster) => void;
}

export function ClusterLayer({ clusters, onClusterClick }: ClusterLayerProps) {
  const clusterMarkers = useMemo(() => {
    return clusters.map((cluster, index) => {
      // Determinar cor dominante do cluster
      const { pending, progress, resolved } = cluster.status_breakdown;
      const total = pending + progress + resolved;
      
      let color = '#10B981'; // Verde padrão
      if (pending / total > 0.5) color = '#DC2626'; // Vermelho se >50% pendentes
      else if (progress / total > 0.3) color = '#F59E0B'; // Amarelo se >30% progresso

      // Tamanho baseado na quantidade
      const radius = Math.min(Math.max(cluster.count * 2, 8), 40);

      return (
        <CircleMarker
          key={index}
          center={[cluster.lat, cluster.lng]}
          radius={radius}
          pathOptions={{
            fillColor: color,
            color: 'white',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.7
          }}
          eventHandlers={{
            click: () => onClusterClick?.(cluster)
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-gray-900 mb-2">
                {cluster.count} Denúncias
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-red-600">● Pendentes:</span>
                  <span className="font-medium">{pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">● Em progresso:</span>
                  <span className="font-medium">{progress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">● Resolvidas:</span>
                  <span className="font-medium">{resolved}</span>
                </div>
              </div>

              <button
                onClick={() => onClusterClick?.(cluster)}
                className="mt-3 w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Ver Detalhes
              </button>
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [clusters, onClusterClick]);

  return <>{clusterMarkers}</>;
}
```

---

## 🎛️ **CONTROLES DO MAPA: MapControls**

```typescript
// components/maps/MapControls.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface MapControlsProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  visualizationType: 'heatmap' | 'clusters' | 'markers';
  className?: string;
}

export function MapControls({
  filters,
  onFiltersChange,
  visualizationType,
  className
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`bg-white/95 backdrop-blur-sm shadow-lg ${className}`}>
      <div className="p-4 space-y-4">
        {/* Header com toggle */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>

        {/* Status atual */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {visualizationType === 'heatmap' && '🔥 Mapa de Calor'}
            {visualizationType === 'clusters' && '🎯 Clusters'}
            {visualizationType === 'markers' && '📍 Marcadores'}
          </Badge>
        </div>

        {/* Controles expandidos */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-3">
            {/* Filtro de Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, status: value })
                }
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="progress">Em Progresso</option>
                <option value="resolved">Resolvidas</option>
              </Select>
            </div>

            {/* Toggle de visualização manual */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Visualização
              </label>
              <div className="grid grid-cols-3 gap-1">
                <Button
                  variant={visualizationType === 'heatmap' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {/* Force heatmap */}}
                >
                  🔥 Calor
                </Button>
                <Button
                  variant={visualizationType === 'clusters' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {/* Force clusters */}}
                >
                  🎯 Grupos
                </Button>
                <Button
                  variant={visualizationType === 'markers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {/* Force markers */}}
                >
                  📍 Pontos
                </Button>
              </div>
            </div>

            {/* Reset filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiltersChange({ status: 'all', bounds: null })}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## 🔗 **HOOK PARA DADOS: useHeatmapData**

```typescript
// hooks/useHeatmapData.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface UseHeatmapDataParams {
  zoom: number;
  status?: string;
  bounds?: any;
  refetchInterval?: number;
}

export function useHeatmapData({
  zoom,
  status = 'all',
  bounds,
  refetchInterval = 30000 // 30 segundos
}: UseHeatmapDataParams) {
  return useQuery({
    queryKey: ['heatmap', zoom, status, bounds],
    queryFn: async () => {
      const params = new URLSearchParams({
        zoom: zoom.toString(),
        status
      });

      if (bounds) {
        params.append('bounds', JSON.stringify(bounds));
      }

      const response = await apiClient.get(`/complaints/heatmap?${params}`);
      return response.data.data;
    },
    refetchInterval,
    staleTime: 60000, // 1 minuto
    cacheTime: 300000, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
```

---

## 📊 **IMPLEMENTAÇÃO NO DASHBOARD PRINCIPAL**

```typescript
// app/page.tsx
import { HeatmapContainer } from '@/components/maps/HeatmapContainer';
import { KPICards } from '@/components/dashboard/KPICards';
import { StatisticsOverview } from '@/components/dashboard/StatisticsOverview';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel de Transparência - Scanitz
          </h1>
          <p className="text-gray-600">
            Acompanhe as denúncias urbanas de Imperatriz-MA em tempo real
          </p>
        </div>

        {/* KPIs */}
        <KPICards className="mb-8" />

        {/* Mapa de Calor Principal */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔥 Mapa de Calor das Denúncias
            </h2>
            <HeatmapContainer
              height="h-[500px]"
              showControls={true}
              initialZoom={12}
            />
          </div>
        </div>

        {/* Estatísticas */}
        <StatisticsOverview />
      </div>
    </div>
  );
}
```

---

## 📱 **RESPONSIVIDADE E PERFORMANCE**

### **CSS Responsivo para Mapas**
```css
/* globals.css */
.map-container {
  @apply h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] 2xl:h-[700px];
}

.map-controls {
  @apply w-full sm:w-auto sm:max-w-xs;
}

@media (max-width: 640px) {
  .leaflet-control-container {
    font-size: 14px;
  }
  
  .leaflet-popup-content {
    margin: 8px 10px;
    line-height: 1.3;
  }
}
```

### **Otimizações de Performance**

#### **1. Lazy Loading de Componentes**
```typescript
// Componentes pesados carregados sob demanda
const HeatmapContainer = dynamic(
  () => import('@/components/maps/HeatmapContainer'),
  { 
    ssr: false,
    loading: () => <MapSkeleton />
  }
);
```

#### **2. Debounce nos Filtros**
```typescript
// Hook com debounce
const [debouncedFilters] = useDebounce(filters, 300);
```

#### **3. Virtualização para Muitos Pontos**
```typescript
// Limitar pontos renderizados baseado no zoom
const visiblePoints = useMemo(() => {
  const maxPoints = zoom < 10 ? 100 : zoom < 13 ? 500 : 1000;
  return points.slice(0, maxPoints);
}, [points, zoom]);
```

---

## 🎨 **ESTADOS VISUAIS E LOADING**

### **Loading Skeleton para Mapa**
```typescript
function MapSkeleton({ height }: { height: string }) {
  return (
    <div className={`${height} bg-gray-200 rounded-lg animate-pulse relative`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-lg">
        <div className="absolute top-4 left-4 w-32 h-8 bg-gray-300 rounded"></div>
        <div className="absolute bottom-4 right-4 w-24 h-6 bg-gray-300 rounded"></div>
        <div className="absolute center w-16 h-16 bg-gray-400 rounded-full opacity-50"></div>
      </div>
    </div>
  );
}
```

### **Estados de Erro**
```typescript
function MapError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="h-96 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-4xl mb-4">🗺️</div>
        <h3 className="text-red-800 font-semibold mb-2">
          Erro ao carregar mapa
        </h3>
        <p className="text-red-600 mb-4">
          Não foi possível carregar os dados do mapa de calor
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## 🌐 **INTEGRAÇÃO COM API**

### **Endpoint de Heatmap**
```
GET /api/v1/complaints/heatmap?zoom=12&status=all
```

### **Estrutura da Resposta**
```typescript
interface HeatmapResponse {
  success: boolean;
  statuscode: number;
  data: {
    points: Array<{
      lat: number;
      lng: number;
      weight: number; // 1-3 baseado no status
      status: number; // 0=pendente, 1=progresso, 2=resolvido
      id: string;
      title: string;
      district: string;
    }>;
    clusters: Array<{
      lat: number;
      lng: number;
      count: number;
      status_breakdown: {
        pending: number;
        progress: number;
        resolved: number;
      };
    }>;
    summary: {
      total: number;
      byStatus: {
        pending: number;
        progress: number;
        resolved: number;
      };
      byDistrict: Array<{
        district: string;
        total: number;
        pending: number;
        progress: number;
        resolved: number;
      }>;
      center: { lat: number; lng: number };
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
    };
  };
}
```

---

## 🎯 **FUNCIONAMENTO POR ZOOM LEVEL**

### **Zoom 1-10: Mapa de Calor**
- Visualização de densidade geral
- Gradiente de cores baseado na intensidade
- Clustering automático dos pontos

### **Zoom 11-13: Clusters**
- Agrupamentos visuais com círculos
- Breakdown de status por cluster
- Popups informativos

### **Zoom 14-18: Marcadores Individuais**
- Pontos específicos para cada denúncia
- Detalhes completos nos popups
- Performance otimizada

---

## 🎨 **PALETA DE CORES FINAL**

```typescript
const colors = {
  // Status das denúncias
  pending: '#DC2626',    // Vermelho - Urgente
  progress: '#F59E0B',   // Amarelo - Em ação
  resolved: '#10B981',   // Verde - Resolvido
  
  // Gradiente do heatmap
  heatmap: {
    low: '#10B981',      // Verde (baixa densidade)
    medium: '#F59E0B',   // Amarelo (média densidade)
    high: '#EF4444',     // Laranja (alta densidade)
    critical: '#DC2626'  // Vermelho (crítica)
  },
  
  // UI
  background: '#FFFFFF',
  text: '#111827',
  secondary: '#6B7280',
  accent: '#FEE2E2'
};
```

---

## 🚀 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Fase 1 - Setup Básico**
- [ ] Instalar dependências (leaflet, react-leaflet, leaflet.heat)
- [ ] Configurar tipos TypeScript
- [ ] Criar estrutura de pastas
- [ ] Configurar cliente da API

### **Fase 2 - Componentes Core**
- [ ] HeatmapContainer (componente principal)
- [ ] HeatmapLayer (camada de calor)
- [ ] ClusterLayer (agrupamentos)
- [ ] MarkerLayer (pontos individuais)

### **Fase 3 - Controles e UX**
- [ ] MapControls (filtros)
- [ ] MapLegend (legenda)
- [ ] MapSkeleton (loading states)
- [ ] MapError (tratamento de erro)

### **Fase 4 - Integração**
- [ ] Hook useHeatmapData
- [ ] Integração com endpoint da API
- [ ] Implementar no dashboard principal
- [ ] Testes de responsividade

### **Fase 5 - Otimizações**
- [ ] Lazy loading
- [ ] Debounce nos filtros
- [ ] Virtualização de pontos
- [ ] Cache inteligente

### **Fase 6 - Polimento**
- [ ] Animações com Framer Motion
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance audit
- [ ] Testes E2E

---

## 🎯 **RESULTADO ESPERADO**

Esta implementação oferece:

✅ **Mapa de calor responsivo** com gradientes baseados no status das denúncias  
✅ **Clustering inteligente** que se adapta automaticamente ao zoom  
✅ **Performance otimizada** para milhares de pontos  
✅ **Controles intuitivos** com filtros por status e região  
✅ **Design limpo** seguindo a paleta de cores vermelha do Scanitz  
✅ **Acessibilidade** com popups informativos e navegação por teclado  
✅ **Mobile-first** funcionando perfeitamente em todas as resoluções  

**O resultado será um mapa de calor profissional que transmite transparência e facilita a análise dos dados de denúncias urbanas de Imperatriz-MA!** 🚀

---

## 📋 **COMANDOS PARA INICIAR**

```bash
# Instalar dependências
yarn add leaflet react-leaflet leaflet.heat
yarn add @tanstack/react-query axios recharts
yarn add framer-motion clsx tailwind-merge use-debounce
yarn add -D @types/leaflet @types/react-leaflet

# Configurar ambiente
echo "NEXT_PUBLIC_API_URL=http://localhost:6060/api/v1" > .env.local

# Iniciar desenvolvimento
yarn dev
```

**Status: 🟢 PRONTO PARA IMPLEMENTAÇÃO**