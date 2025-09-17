Endpoint: GET /complaints/recent

## Resumo

Retorna as denúncias mais recentes da coleção `complaints`. Útil para alimentar feeds ou widgets de "últimas denúncias" no frontend.

## URL

/complaints/recent

## Parâmetros de query

- limit (integer, opcional): número máximo de itens a retornar. Default: 10. Máx: 100.
- status (integer, opcional): filtra por status da denúncia (0=pending, 1=progress, 2=resolved, 3=closed).
- city (string, opcional): filtra por cidade (comparação case-insensitive, contém).

## Formato de resposta

O endpoint segue o padrão JSON da API:
{
success: boolean,
statuscode: number,
data: Array<Complaint>,
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
"address": { "city": "Imperatriz", "district": "Centro", "latitude": -5.5, "longitude": -47.4 },
"situation": { "status": 0 },
"imageUrl": "https://...",
"thumbnailUrl": "https://...",
"similarCount": 0,
"createdAt": "2025-09-16T12:34:56.000Z",
"updatedAt": "2025-09-16T12:34:56.000Z",
"userId": "LaycJ...",
"userName": "João"
}
],
"meta": { "total": 1, "requestedLimit": 10 }
}

## Como usar no frontend (ex.: React hook)

O hook do frontend pode assumir que a API retorna um objeto com `data` sendo um array. Algumas implementações podem retornar `res.data.data` (axios default). Para ser resiliente, normalize o retorno assim:

// Pseudocódigo
const apiData = response?.data || response;
const complaints = apiData?.data || apiData;

Isso cobre ambos os formatos: resposta aninhada (`res.data.data`) e resposta direta (`res.data`).

## Sugestão de shape uniforme no frontend

Normalize cada item para evitar propriedades undefined:

function normalizeComplaint(item) {
return {
id: item.id,
description: item.description || "",
city: item.address?.city || "",
district: item.address?.district || "",
latitude: item.address?.latitude || null,
longitude: item.address?.longitude || null,
status: item.situation?.status ?? 0,
imageUrl: item.thumbnailUrl || item.imageUrl || null,
createdAt: item.createdAt || item.created_at || null,
};
}

## Exemplo de uso com axios

import axios from 'axios';

async function fetchRecentComplaints(limit=10) {
const res = await axios.get('/complaints/recent', { params: { limit } });
const apiData = res?.data || res;
const list = apiData?.data || apiData;
return list.map(normalizeComplaint);
}

## Notas

- O endpoint é público (não requer autenticação). Se precisar de campos sensíveis, use endpoints protegidos.
- O limite máximo é 100 para evitar respostas muito grandes.
- Caso precise de paginação ou filtros mais avançados, use `GET /complaints` que já suporta vários parâmetros.

## Changelog

2025-09-17: Endpoint criado e documentado.
