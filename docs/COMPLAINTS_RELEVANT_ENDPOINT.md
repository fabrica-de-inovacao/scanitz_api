Endpoint: GET /complaints/relevant

## Resumo

Retorna denúncias "relevantes" ordenadas por um score de relevância calculado a partir de: número de denúncias similares (`similarCount`), prioridade (baseada em conteúdo/idade/imagem) e recência. Ideal para alimentar painéis de triagem, widgets de destaque e notificações.

## URL

/complaints/relevant

## Parâmetros de query

- limit (integer, opcional): número máximo de itens a retornar. Default: 10. Máx: 100.
- minSimilar (integer, opcional): filtra denúncias com `similarCount` menor que esse valor. Default: 0.
- status (integer, opcional): filtra por status (0=pending,1=progress,2=resolved,3=closed).
- city (string, opcional): filtra por cidade (case-insensitive, contains).

## Algoritmo (resumo técnico)

Cada denúncia recebe um `relevanceRaw` calculado como combinação ponderada de:

- similarCount (transformado por log2(x+1)) — peso 0.5
- prioridade (mapeada para 0..3) — peso 0.3
- recência (1 / (1 + diasDesdeCriacao)) — peso 0.2

O score final `relevanceScore` é a normalização do `relevanceRaw` para 0..100 (inteiro).

## Formato de resposta

Segue o padrão da API:
{
success: boolean,
statuscode: number,
data: Array<Complaint & { relevanceScore: number }>,
meta: { total: number, requestedLimit: number }
}

## Exemplo de resposta (resumida)

{
"success": true,
"statuscode": 200,
"data": [
{
"id": "abc123",
"description": "Poça grande na Rua X",
"address": { "city": "Imperatriz", "district": "Centro" },
"situation": { "status": 0 },
"similarCount": 5,
"createdAt": "2025-09-15T10:00:00.000Z",
"relevanceScore": 92
}
],
"meta": { "total": 1, "requestedLimit": 10 }
}

## Como usar no frontend

- Use `relevanceScore` para ordenar/filtrar no cliente (maior = mais relevante).
- Normalizar itens como no manual de `recent` antes de exibir.
- Exemplo (pseudocódigo):

const apiData = res?.data || res;
const items = apiData?.data || apiData;
const normalized = items.map(normalizeComplaint).map(i => ({...i, relevanceScore: i.relevanceScore || 0}));

## Recomendações

- Para grandes volumes, é melhor criar índices no Firestore e/ou pré-calcular relevância em jobs offline e armazenar `relevanceScore` em cada documento para consultas diretas.
- Ajuste pesos conforme métricas locais (ex.: se similarCount tiver mais importância, aumentar seu peso).

## Changelog

2025-09-17: Endpoint criado e documentado.
