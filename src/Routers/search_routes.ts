import express from "express";
import * as firestore from "firebase/firestore";
import { db } from "../database/firebase";
import optionalAuthentication from "./auth/auth_functions";

const router = express.Router();

// Busca unificada entre usuários e denúncias
router.get("/", optionalAuthentication, async (req, res) => {
  const {
    q, // query de busca
    type = "all", // 'users', 'complaints', 'all'
    limit = 20,
    page = 1,
    sortBy = "relevance", // 'relevance', 'date', 'alphabetical'
    filters, // JSON string com filtros específicos
  } = req.query;

  if (!q || (q as string).trim().length < 2) {
    return res.status(400).json({
      success: false,
      statuscode: 400,
      message: "Query de busca deve ter pelo menos 2 caracteres",
    });
  }

  try {
    const searchQuery = (q as string).toLowerCase().trim();
    const parsedFilters = filters ? JSON.parse(filters as string) : {};
    const limitNum = Math.min(parseInt(limit as string), 50);
    const pageNum = Math.max(parseInt(page as string), 1);

    let results = {
      users: [],
      complaints: [],
      totalResults: 0,
      searchTime: 0,
    };

    const startTime = Date.now();

    // Buscar usuários se solicitado
    if (type === "all" || type === "users") {
      const usersSnapshot = await firestore.getDocs(
        firestore.collection(db, "users")
      );

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const users = usersData
        .filter((user) => {
          // Busca por nome, email ou outras propriedades
          const searchableText = [
            user.fullName || "",
            user.email || "",
            user.username || "",
          ]
            .join(" ")
            .toLowerCase();

          const matchesQuery = searchableText.includes(searchQuery);

          // Aplicar filtros específicos de usuários
          if (parsedFilters.verified !== undefined) {
            return matchesQuery && user.verified === parsedFilters.verified;
          }

          if (parsedFilters.hasComplaints !== undefined) {
            return (
              matchesQuery &&
              user.complaintsCount > 0 === parsedFilters.hasComplaints
            );
          }

          return matchesQuery;
        })
        .map((user) => ({
          type: "user" as const,
          id: user.id,
          title: user.fullName || user.email || "Usuário",
          subtitle: user.email,
          description: `${user.complaintsCount || 0} denúncias registradas`,
          imageUrl: user.photoURL || null,
          createdAt: user.created_at,
          relevanceScore: calculateUserRelevance(user, searchQuery),
          url: `/users/${user.id}`,
          data: {
            email: req.user ? user.email : undefined,
            complaintsCount: user.complaintsCount || 0,
            verified: user.verified || false,
            joinedDate: user.created_at,
          },
        }));

      results.users = users;
    }

    // Buscar denúncias se solicitado
    if (type === "all" || type === "complaints") {
      const complaintsSnapshot = await firestore.getDocs(
        firestore.collection(db, "complaints")
      );

      const complaintsData = complaintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const complaints = complaintsData
        .filter((complaint) => {
          // Busca por descrição, endereço, etc.
          const searchableText = [
            complaint.description || "",
            complaint.address?.street || "",
            complaint.address?.district || "",
            complaint.address?.city || "",
          ]
            .join(" ")
            .toLowerCase();

          const matchesQuery = searchableText.includes(searchQuery);

          // Aplicar filtros específicos de denúncias
          if (parsedFilters.status !== undefined) {
            return (
              matchesQuery &&
              (complaint.situation?.status || 0) === parsedFilters.status
            );
          }

          if (parsedFilters.city) {
            return (
              matchesQuery && complaint.address?.city === parsedFilters.city
            );
          }

          if (parsedFilters.district) {
            return (
              matchesQuery &&
              complaint.address?.district === parsedFilters.district
            );
          }

          if (parsedFilters.hasImage !== undefined) {
            return (
              matchesQuery && !!complaint.imageUrl === parsedFilters.hasImage
            );
          }

          return matchesQuery;
        })
        .map((complaint) => ({
          type: "complaint" as const,
          id: complaint.id,
          title:
            complaint.description?.substring(0, 100) +
            (complaint.description?.length > 100 ? "..." : ""),
          subtitle: `${
            complaint.address?.district || "Distrito não informado"
          }, ${complaint.address?.city || "Cidade não informada"}`,
          description: `Status: ${getStatusName(
            complaint.situation?.status || 0
          )} | ${formatDate(complaint.createdAt || complaint.created_at)}`,
          imageUrl: complaint.thumbnailUrl || complaint.imageUrl,
          createdAt: complaint.createdAt || complaint.created_at,
          relevanceScore: calculateComplaintRelevance(complaint, searchQuery),
          url: `/complaints/${complaint.id}`,
          data: {
            status: complaint.situation?.status || 0,
            address: complaint.address,
            similarCount: complaint.similarCount || 0,
            hasImage: !!complaint.imageUrl,
          },
        }));

      results.complaints = complaints;
    }

    // Combinar e ordenar resultados
    const allResults = [...results.users, ...results.complaints];

    // Ordenação
    if (sortBy === "relevance") {
      allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === "date") {
      allResults.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "alphabetical") {
      allResults.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Paginação
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedResults = allResults.slice(startIndex, endIndex);

    results.totalResults = allResults.length;
    results.searchTime = Date.now() - startTime;

    // Sugestões baseadas na busca
    const suggestions = generateSearchSuggestions(searchQuery, allResults);

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: {
        results: paginatedResults,
        summary: {
          total: results.totalResults,
          users: results.users.length,
          complaints: results.complaints.length,
          searchTime: results.searchTime,
        },
        suggestions: suggestions,
        facets: generateFacets(allResults),
        query: {
          q: searchQuery,
          type,
          sortBy,
          page: pageNum,
          limit: limitNum,
          appliedFilters: parsedFilters,
        },
      },
      meta: {
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(results.totalResults / limitNum),
          hasNext: endIndex < results.totalResults,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Erro na busca unificada:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno na busca 😿",
    });
  }
});

// Endpoint para sugestões de busca (autocomplete)
router.get("/suggestions", async (req, res) => {
  const { q, type = "all", limit = 10 } = req.query;

  if (!q || (q as string).length < 1) {
    return res.status(200).json({
      success: true,
      statuscode: 200,
      data: { suggestions: [] },
    });
  }

  try {
    const searchQuery = (q as string).toLowerCase();
    const suggestions = [];

    // Sugestões de cidades/distritos mais comuns
    if (type === "all" || type === "complaints") {
      const complaintsSnapshot = await firestore.getDocs(
        firestore.collection(db, "complaints")
      );

      const locations = new Set();
      complaintsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (
          data.address?.city &&
          data.address.city.toLowerCase().includes(searchQuery)
        ) {
          locations.add(data.address.city);
        }
        if (
          data.address?.district &&
          data.address.district.toLowerCase().includes(searchQuery)
        ) {
          locations.add(`${data.address.district}, ${data.address.city || ""}`);
        }
      });

      Array.from(locations)
        .slice(0, 5)
        .forEach((location) => {
          suggestions.push({
            type: "location",
            text: location,
            category: "Localização",
          });
        });
    }

    // Sugestões de termos comuns
    const commonTerms = [
      "buraco",
      "asfalto",
      "iluminação",
      "lâmpada",
      "lixo",
      "entulho",
      "esgoto",
      "água",
      "calçada",
      "árvore",
      "semáforo",
      "placas",
    ];

    commonTerms
      .filter((term) => term.includes(searchQuery))
      .slice(0, 5)
      .forEach((term) => {
        suggestions.push({
          type: "term",
          text: term,
          category: "Termo comum",
        });
      });

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: {
        suggestions: suggestions.slice(0, parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar sugestões:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar sugestões 😿",
    });
  }
});

// Endpoint para autocomplete (mais orientado a UI de autocomplete)
router.get("/autocomplete", async (req, res) => {
  const { q, type = "all", limit = 8 } = req.query;

  if (!q || (q as string).trim().length < 1) {
    return res
      .status(200)
      .json({ success: true, statuscode: 200, data: { items: [] } });
  }

  try {
    const searchQuery = (q as string).toLowerCase().trim();
    const limitNum = Math.min(
      Math.max(parseInt((limit as string) || "8"), 1),
      100
    );

    const items: any[] = [];

    // Priorizar localidades (cidade, bairro)
    if (type === "all" || type === "complaints") {
      const complaintsSnapshot = await firestore.getDocs(
        firestore.collection(db, "complaints")
      );

      const seen = new Set<string>();

      for (const doc of complaintsSnapshot.docs) {
        const data = doc.data();
        const city = data.address?.city;
        const district = data.address?.district;

        if (city && city.toLowerCase().includes(searchQuery)) {
          const key = `city::${city}`;
          if (!seen.has(key)) {
            items.push({ type: "city", text: city, value: city });
            seen.add(key);
            if (items.length >= limitNum) break;
          }
        }

        if (district && district.toLowerCase().includes(searchQuery)) {
          const combined = `${district}, ${city || ""}`.trim();
          const key = `district::${combined}`;
          if (!seen.has(key)) {
            items.push({ type: "district", text: combined, value: combined });
            seen.add(key);
            if (items.length >= limitNum) break;
          }
        }
      }
    }

    // Se ainda não atingiu o limite, adicionar termos comuns que combinam
    if (items.length < limitNum) {
      const commonTerms = [
        "buraco",
        "asfalto",
        "iluminação",
        "lâmpada",
        "lixo",
        "entulho",
        "esgoto",
        "água",
        "calçada",
        "árvore",
        "semáforo",
        "placas",
      ];

      commonTerms.forEach((term) => {
        if (items.length >= limitNum) return;
        if (term.includes(searchQuery)) {
          items.push({ type: "term", text: term, value: term });
        }
      });
    }

    res
      .status(200)
      .json({
        success: true,
        statuscode: 200,
        data: { items: items.slice(0, limitNum) },
      });
  } catch (error) {
    console.error("Erro no autocomplete:", error);
    res
      .status(500)
      .json({
        success: false,
        statuscode: 500,
        message: "Erro no autocomplete",
      });
  }
});

// Endpoint para busca avançada com múltiplos filtros
router.post("/advanced", optionalAuthentication, async (req, res) => {
  const {
    query,
    filters = {},
    sorting = { field: "relevance", order: "desc" },
    pagination = { page: 1, limit: 20 },
    facets = [],
  } = req.body;

  try {
    // Implementação de busca avançada com múltiplos critérios
    const searchResults = await performAdvancedSearch({
      query,
      filters,
      sorting,
      pagination,
      facets,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: searchResults,
    });
  } catch (error) {
    console.error("Erro na busca avançada:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro na busca avançada 😿",
    });
  }
});

// Funções auxiliares
function calculateUserRelevance(user: any, query: string): number {
  let score = 0;

  const fullName = user.fullName || "";
  const email = user.email || "";

  // Pontuação por correspondência exata no nome
  if (fullName.toLowerCase().includes(query)) {
    score += fullName.toLowerCase().indexOf(query) === 0 ? 10 : 5;
  }

  // Pontuação por correspondência no email
  if (email.toLowerCase().includes(query)) {
    score += 3;
  }

  // Bônus por verificação
  if (user.verified) score += 2;

  // Bônus por atividade (denúncias)
  score += Math.min(user.complaintsCount || 0, 5);

  return score;
}

function calculateComplaintRelevance(complaint: any, query: string): number {
  let score = 0;

  const description = complaint.description || "";
  const address = `${complaint.address?.district || ""} ${
    complaint.address?.city || ""
  }`;

  // Pontuação por correspondência na descrição
  if (description.toLowerCase().includes(query)) {
    score += description.toLowerCase().indexOf(query) === 0 ? 10 : 5;
  }

  // Pontuação por correspondência no endereço
  if (address.toLowerCase().includes(query)) {
    score += 3;
  }

  // Bônus por ter imagem
  if (complaint.imageUrl) score += 2;

  // Bônus por denúncias similares (popularidade)
  score += Math.min(complaint.similarCount || 0, 3);

  // Penalidade por idade (denúncias mais antigas são menos relevantes)
  if (complaint.createdAt || complaint.created_at) {
    const daysOld = Math.floor(
      (new Date().getTime() -
        new Date(complaint.createdAt || complaint.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    score -= Math.min(daysOld / 30, 2); // Reduz até 2 pontos por mês
  }

  return Math.max(score, 0);
}

function generateSearchSuggestions(query: string, results: any[]): string[] {
  const suggestions = new Set<string>();

  // Sugestões baseadas nos resultados
  results.forEach((result) => {
    if (result.type === "complaint") {
      const district = result.data.address?.district;
      const city = result.data.address?.city;

      if (district && !district.toLowerCase().includes(query)) {
        suggestions.add(`${query} em ${district}`);
      }
      if (city && !city.toLowerCase().includes(query)) {
        suggestions.add(`${query} em ${city}`);
      }
    }
  });

  // Limitar sugestões
  return Array.from(suggestions).slice(0, 5);
}

function generateFacets(results: any[]): any {
  const facets = {
    types: {},
    cities: {},
    districts: {},
    status: {},
  };

  results.forEach((result) => {
    // Tipo
    facets.types[result.type] = (facets.types[result.type] || 0) + 1;

    if (result.type === "complaint") {
      // Cidades
      const city = result.data.address?.city || "Não informado";
      facets.cities[city] = (facets.cities[city] || 0) + 1;

      // Distritos
      const district = result.data.address?.district || "Não informado";
      facets.districts[district] = (facets.districts[district] || 0) + 1;

      // Status
      const status = getStatusName(result.data.status);
      facets.status[status] = (facets.status[status] || 0) + 1;
    }
  });

  return facets;
}

async function performAdvancedSearch(options: any): Promise<any> {
  // Implementação mais complexa de busca avançada
  // Por simplicidade, retornar estrutura básica
  return {
    results: [],
    facets: {},
    aggregations: {},
    suggestions: [],
  };
}

function getStatusName(status: number): string {
  const statusNames = {
    0: "Pendente",
    1: "Em Andamento",
    2: "Resolvida",
    3: "Fechada",
  };
  return statusNames[status] || "Desconhecido";
}

function formatDate(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default router;
