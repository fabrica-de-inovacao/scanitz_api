import { Router } from "express";
import firestore, { db } from "../../database/firebase";
import { where } from "firebase/firestore";
import {
  optionalAuthentication,
  authenticateFirebaseToken,
} from "../../middleware/auth";

const router = Router();

//lista todas as denuncias com filtros avançados (autenticação opcional - melhor UX se logado)
router.get("/", optionalAuthentication, async (req, res) => {
  try {
    // Query parameters para filtros avançados
    const {
      page = "1",
      limit = "50",
      status,
      district,
      city = "",
      dateFrom,
      dateTo,
      hasImage,
      userId,
      orderBy = "created_at",
      order = "desc",
      lat,
      lng,
      radius = "5000", // em metros
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    //verifica se a lista esta vazia
    if (complaintsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhuma denúncia encontrada 😿",
      });
    }

    // Mapear e aplicar filtros
    let allComplaints: any[] = complaintsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const isOwner = req.user && req.user.uid === data.userId;

      return {
        id: doc.id,
        description: data.description,
        address: data.address,
        situation: data.situation,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        similarCount: data.similarCount,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        userId: data.userId,
        userName: data.userName,
        // Dados sensíveis apenas para o dono
        ...(isOwner && {
          isOwner: true,
          privateData: {
            userName: data.userName,
            userId: data.userId,
          },
        }),
        // Dados extras se autenticado
        ...(req.user && {
          canEdit: isOwner,
          canReport: !isOwner,
        }),
      };
    });

    // Aplicar filtros
    if (status !== undefined) {
      const statusNum = parseInt(status as string);
      allComplaints = allComplaints.filter(
        (complaint) => complaint.situation?.status === statusNum
      );
    }

    if (district) {
      const districtLower = (district as string).toLowerCase();
      allComplaints = allComplaints.filter((complaint) =>
        complaint.address?.district?.toLowerCase().includes(districtLower)
      );
    }

    if (city) {
      const cityLower = (city as string).toLowerCase();
      allComplaints = allComplaints.filter((complaint) =>
        complaint.address?.city?.toLowerCase().includes(cityLower)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      allComplaints = allComplaints.filter((complaint) => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      toDate.setHours(23, 59, 59, 999); // fim do dia
      allComplaints = allComplaints.filter((complaint) => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate <= toDate;
      });
    }

    if (hasImage !== undefined) {
      const hasImageBool = hasImage === "true";
      allComplaints = allComplaints.filter((complaint) =>
        hasImageBool ? !!complaint.imageUrl : !complaint.imageUrl
      );
    }

    if (userId) {
      allComplaints = allComplaints.filter(
        (complaint) => complaint.userId === userId
      );
    }

    // Filtro por proximidade (se lat e lng fornecidos)
    if (lat && lng) {
      const centerLat = parseFloat(lat as string);
      const centerLng = parseFloat(lng as string);
      const radiusMeters = parseInt(radius as string);

      allComplaints = allComplaints.filter((complaint) => {
        if (!complaint.address?.latitude || !complaint.address?.longitude) {
          return false;
        }

        // Calcular distância usando fórmula de Haversine
        const R = 6371000; // Raio da Terra em metros
        const dLat = ((complaint.address.latitude - centerLat) * Math.PI) / 180;
        const dLng =
          ((complaint.address.longitude - centerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((complaint.address.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= radiusMeters;
      });
    }

    // Ordenação
    allComplaints.sort((a, b) => {
      let aValue = a[orderBy as string];
      let bValue = b[orderBy as string];

      if (orderBy === "createdAt" || orderBy === "updatedAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (order === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginação
    const totalComplaints = allComplaints.length;
    const paginatedComplaints = allComplaints.slice(offset, offset + limitNum);

    // Remover dados sensíveis para usuários não proprietários
    const safeComplaints = paginatedComplaints.map((complaint) => {
      const { userId, userName, privateData, ...safeData } = complaint;

      // Se não for o dono, omitir dados sensíveis
      if (!complaint.isOwner) {
        return safeData;
      }

      return complaint;
    });

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: safeComplaints,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalComplaints / limitNum),
        totalComplaints: totalComplaints,
        complaintsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalComplaints / limitNum),
        hasPrevPage: pageNum > 1,
      },
      filters: {
        status,
        district,
        city,
        dateFrom,
        dateTo,
        hasImage,
        userId,
        orderBy,
        order,
        proximitySearch: !!(lat && lng),
      },
      meta: {
        authenticated: !!req.user,
        userComplaints: req.user
          ? safeComplaints.filter((c) => c.isOwner).length
          : 0,
        totalWithImages: allComplaints.filter((c) => c.imageUrl).length,
        statusBreakdown: {
          pending: allComplaints.filter((c) => c.situation?.status === 0)
            .length,
          inProgress: allComplaints.filter((c) => c.situation?.status === 1)
            .length,
          resolved: allComplaints.filter((c) => c.situation?.status === 2)
            .length,
          closed: allComplaints.filter((c) => c.situation?.status === 3).length,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar denúncias:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

//listar todas as posições das denuncias (público)
router.get("/positions", async (req, res) => {
  try {
    const complaintsPositionsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (complaintsPositionsSnapshot.empty) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhuma posição encontrada 😿",
      });
    } else {
      const listComplaintsPositions = complaintsPositionsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          latitude: doc.data().address?.latitude,
          longitude: doc.data().address?.longitude,
          status: doc.data().situation?.status || 0,
        }))
        .filter((pos) => pos.latitude && pos.longitude);

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: listComplaintsPositions,
        meta: {
          total: listComplaintsPositions.length,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

// listar denúncias relevantes (público) -> novo endpoint /relevant
router.get("/relevant", async (req, res) => {
  try {
    const { limit = "10", minSimilar = "0", status, city } = req.query;
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt((limit as string) || "10"))
    );
    const minSimilarNum = Math.max(0, parseInt((minSimilar as string) || "0"));

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (complaintsSnapshot.empty) {
      return res
        .status(200)
        .json({ success: true, statuscode: 200, data: [], meta: { total: 0 } });
    }

    // transformar documentos
    let complaints = complaintsSnapshot.docs.map((doc) => {
      const d = doc.data();
      const createdAt = d.createdAt || d.created_at;
      return {
        id: doc.id,
        description: d.description,
        address: d.address,
        situation: d.situation,
        imageUrl: d.imageUrl,
        thumbnailUrl: d.thumbnailUrl,
        similarCount: d.similarCount || 0,
        createdAt: createdAt,
        updatedAt: d.updatedAt || d.updated_at,
        userId: d.userId,
        userName: d.userName,
        _raw: d,
      } as any;
    });

    // filtros básicos
    if (status !== undefined) {
      const s = parseInt(status as string);
      if (!isNaN(s))
        complaints = complaints.filter(
          (c: any) => (c.situation?.status || 0) === s
        );
    }

    if (city) {
      const cityLower = (city as string).toLowerCase();
      complaints = complaints.filter((c: any) =>
        (c.address?.city || "").toLowerCase().includes(cityLower)
      );
    }

    // filtrar por similarCount mínimo
    complaints = complaints.filter(
      (c: any) => (c.similarCount || 0) >= minSimilarNum
    );

    // calcular score de relevância
    // fatores: similarCount (peso 0.5), prioridade calculada (peso 0.3), recência (peso 0.2)
    const now = new Date().getTime();
    const scored = complaints.map((c: any) => {
      const similar = Math.log2((c.similarCount || 0) + 1); // suaviza grandes valores

      // calcular prioridade usando função existente calculatePriority baseada em _raw
      const priority = calculatePriority(c._raw || {}); // 'low'|'medium'|'high'|'urgent'
      const priorityScore =
        priority === "urgent"
          ? 3
          : priority === "high"
          ? 2
          : priority === "medium"
          ? 1
          : 0;

      // recência em dias (menos dias => maior score)
      const createdAtTime = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      const daysAgo = createdAtTime
        ? Math.max(0, Math.floor((now - createdAtTime) / (1000 * 60 * 60 * 24)))
        : 3650;
      const recencyScore = 1 / (1 + daysAgo); // intervalo (0,1]

      // combinar pesos
      const rawScore = similar * 0.5 + priorityScore * 0.3 + recencyScore * 0.2;

      return { ...c, relevanceRaw: rawScore };
    });

    // normalizar score para 0..100
    const maxRaw = Math.max(...scored.map((s: any) => s.relevanceRaw), 0.00001);
    const normalized = scored
      .map((s: any) => ({
        ...s,
        relevanceScore: Math.round((s.relevanceRaw / maxRaw) * 100),
      }))
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limitNum)
      .map((s: any) => {
        // retornar shape enxuto ao cliente
        return {
          id: s.id,
          description: s.description,
          address: s.address,
          situation: s.situation,
          imageUrl: s.imageUrl,
          thumbnailUrl: s.thumbnailUrl,
          similarCount: s.similarCount,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          userId: s.userId,
          userName: s.userName,
          relevanceScore: s.relevanceScore,
        };
      });

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: normalized,
      meta: { total: normalized.length, requestedLimit: limitNum },
    });
  } catch (error) {
    console.error("Erro no endpoint /relevant:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor",
    });
  }
});

// listar denúncias recentes (público) -> novo endpoint /recent
router.get("/recent", async (req, res) => {
  try {
    const { limit = "10", status, city } = req.query;
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt((limit as string) || "10"))
    );

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (complaintsSnapshot.empty) {
      return res.status(200).json({
        success: true,
        statuscode: 200,
        data: [],
        meta: { total: 0 },
      });
    }

    let complaints = complaintsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      // mapear campos para shape consistente usado pelo frontend
      .map((c: any) => ({
        id: c.id,
        description: c.description,
        address: c.address,
        situation: c.situation,
        imageUrl: c.imageUrl,
        thumbnailUrl: c.thumbnailUrl,
        similarCount: c.similarCount || 0,
        createdAt: c.createdAt || c.created_at,
        updatedAt: c.updatedAt || c.updated_at,
        userId: c.userId,
        userName: c.userName,
      }));

    // aplicar filtros simples
    if (status !== undefined) {
      const s = parseInt(status as string);
      if (!isNaN(s))
        complaints = complaints.filter(
          (x: any) => (x.situation?.status || 0) === s
        );
    }

    if (city) {
      const cityLower = (city as string).toLowerCase();
      complaints = complaints.filter((x: any) =>
        (x.address?.city || "").toLowerCase().includes(cityLower)
      );
    }

    // ordenar por createdAt desc
    complaints.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const sliced = complaints.slice(0, limitNum);

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: sliced,
      meta: { total: sliced.length, requestedLimit: limitNum },
    });
  } catch (error) {
    console.error("Erro no endpoint /recent:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor",
    });
  }
});

// Endpoint de análise avançada para dashboard
router.get("/analytics", async (req, res) => {
  // Aceita tanto 'timeframe' quanto 'period' como query param
  const timeframeRaw =
    (req.query.timeframe as string) || (req.query.period as string) || "30d";
  const groupBy =
    (req.query.groupBy as string) || (req.query.groupby as string) || "day";
  const district = req.query.district as string | undefined;
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const q = (req.query.q as string) || "";

  try {
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    let complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Filtros por district/city/status
    if (district && district !== "all") {
      complaints = complaints.filter((c) => c.address?.district === district);
    }
    if (city && city !== "all") {
      complaints = complaints.filter((c) => c.address?.city === city);
    }
    if (status && status !== "all") {
      complaints = complaints.filter(
        (c) => (c.situation?.status || 0) === parseInt(status as string)
      );
    }

    // Filtro por q (string livre) — busca em descrição, rua, distrito, cidade
    if (q && q.trim().length > 0) {
      const qLower = q.toLowerCase().trim();
      complaints = complaints.filter((c) => {
        const text = [
          c.description || "",
          c.address?.street || "",
          c.address?.district || "",
          c.address?.city || "",
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(qLower);
      });
    }

    // Análise temporal
    // Se o cliente pedir 'all', '0' ou 'unlimited' queremos NÃO aplicar corte temporal
    const timeframeLower = (timeframeRaw || "").toString().toLowerCase();
    let filteredComplaints: any[];
    if (
      timeframeLower === "all" ||
      timeframeLower === "0" ||
      timeframeLower === "unlimited" ||
      timeframeLower === "alltime"
    ) {
      // manter todo o período
      filteredComplaints = complaints;
    } else {
      const timeframeDays = getTimeframeDays(timeframeRaw as string);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

      filteredComplaints = complaints.filter((c) => {
        const date = new Date(c.createdAt || c.created_at);
        return date >= cutoffDate;
      });
    }

    // Summary / KPIs
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) >= 2
    ).length;
    const pending = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) === 0
    ).length;

    // average resolution time (dias) — cálculo com precisão decimal
    const resolvedItems = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) >= 2 && c.updatedAt && c.createdAt
    );
    let averageResolutionTime = 0;
    if (resolvedItems.length > 0) {
      const totalMs = resolvedItems.reduce((sum: number, it: any) => {
        const created = new Date(it.createdAt || it.created_at).getTime();
        const resolvedAt = new Date(it.updatedAt || it.updated_at).getTime();
        return sum + Math.max(0, resolvedAt - created);
      }, 0);
      averageResolutionTime =
        Math.round(
          (totalMs / resolvedItems.length / (1000 * 60 * 60 * 24)) * 10
        ) / 10; // dias com 1 decimal
    }

    const resolutionRate =
      total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0; // uma casa decimal

    // Trends
    let trendsItems: any[] = [];
    if (["day", "hour", "week", "month"].includes(groupBy)) {
      const timeline = groupComplaintsByTime(filteredComplaints, groupBy);
      trendsItems = timeline.map((t: any) => ({
        date: t.period,
        count: t.count,
      }));
    } else if (groupBy === "district") {
      // agregação por distrito
      const counts: any = {};
      filteredComplaints.forEach((c) => {
        const d = c.address?.district || "Não informado";
        counts[d] = (counts[d] || 0) + 1;
      });
      trendsItems = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
      }));
    } else if (groupBy === "city") {
      const counts: any = {};
      filteredComplaints.forEach((c) => {
        const ci = c.address?.city || "Não informado";
        counts[ci] = (counts[ci] || 0) + 1;
      });
      trendsItems = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
      }));
    } else {
      // default temporal
      const timeline = groupComplaintsByTime(filteredComplaints, "day");
      trendsItems = timeline.map((t: any) => ({
        date: t.period,
        count: t.count,
      }));
    }

    // Top categories
    const topCategoriesRaw = getMostCommonCategories(filteredComplaints);
    const topCategories = topCategoriesRaw.map((c: any) => ({
      name: c.category || c.name || c,
      count: c.count,
    }));

    // Points (opcional)
    const points = filteredComplaints
      .map((c) => ({
        lat: c.address?.latitude,
        lng: c.address?.longitude,
        weight: 1,
        status:
          (c.situation?.status || 0) === 0
            ? "pending"
            : (c.situation?.status || 0) === 1
            ? "in_progress"
            : (c.situation?.status || 0) === 2
            ? "resolved"
            : "closed",
      }))
      .filter((p) => p.lat && p.lng);

    const response = {
      meta: {
        q: q || null,
        period: timeframeRaw,
        groupBy,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        total,
        resolved,
        pending,
        resolutionRate,
        averageResolutionTime,
      },
      trends: {
        items: trendsItems,
      },
      topCategories,
      points,
    };

    res.status(200).json({ success: true, statuscode: 200, data: response });
  } catch (error) {
    console.error("Erro ao gerar analytics:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar análise avançada 😿",
    });
  }
});

// buscar denúncia pelo id com detalhes completos (autenticação opcional - dados extras se for dono)
router.get("/:id", optionalAuthentication, async (req, res) => {
  const { id } = req.params;

  try {
    const complaintDoc = await firestore.getDoc(
      firestore.doc(db, "complaints", id)
    );

    if (!complaintDoc.exists()) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Denúncia não encontrada 😿",
      });
    }

    const data = complaintDoc.data();
    const isOwner = req.user && req.user.uid === data.userId;

    // Buscar denúncias similares na mesma região
    const allComplaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    const similarComplaints = allComplaintsSnapshot.docs
      .filter((doc) => {
        if (doc.id === id) return false; // Excluir a própria denúncia

        const otherData = doc.data();
        const sameDistrict =
          data.address?.district === otherData.address?.district;
        const sameCity = data.address?.city === otherData.address?.city;

        return sameDistrict && sameCity;
      })
      .slice(0, 5) // Limitar a 5 denúncias similares
      .map((doc) => {
        const otherData = doc.data();
        return {
          id: doc.id,
          description:
            otherData.description?.substring(0, 100) +
            (otherData.description?.length > 100 ? "..." : ""),
          status: otherData.situation?.status || 0,
          imageUrl: otherData.thumbnailUrl || otherData.imageUrl,
          createdAt: otherData.createdAt || otherData.created_at,
          district: otherData.address?.district,
        };
      });

    // Buscar dados do usuário se for público ou próprio
    let userData = null;
    if (isOwner || req.user) {
      try {
        const userDoc = await firestore.getDoc(
          firestore.doc(db, "users", data.userId)
        );
        if (userDoc.exists()) {
          const user = userDoc.data();
          userData = {
            uid: userDoc.id,
            name: user.fullName || user.email || "Usuário",
            email: isOwner ? user.email : undefined, // Email apenas para o dono
            avatar: user.photoURL || null,
            joinedDate: user.created_at,
          };
        }
      } catch (userError) {
        console.warn("Não foi possível buscar dados do usuário:", userError);
      }
    }

    // Simulação de histórico de status (poderia vir de uma sub-coleção)
    const statusHistory = [
      {
        status: 0,
        date: data.createdAt || data.created_at,
        note: "Denúncia criada",
      },
    ];

    if (data.updatedAt && data.updatedAt !== data.createdAt) {
      statusHistory.push({
        status: data.situation?.status || 0,
        date: data.updatedAt,
        note: `Status atualizado para: ${getStatusName(
          data.situation?.status || 0
        )}`,
      });
    }

    const complaint = {
      id: complaintDoc.id,
      description: data.description,
      address: data.address,
      situation: data.situation,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl,
      similarCount: data.similarCount || similarComplaints.length,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,

      // Dados enriquecidos
      user: userData,
      similarComplaints: similarComplaints,
      statusHistory: statusHistory,

      // Análise temporal
      analysis: {
        daysOpen: data.createdAt
          ? Math.floor(
              (new Date().getTime() - new Date(data.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
        isRecent: data.createdAt
          ? new Date().getTime() - new Date(data.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000
          : false, // últimos 7 dias
        category: categorizeComplaint(data.description || ""),
        priority: calculatePriority(data),
      },

      // Dados sensíveis apenas para o dono
      ...(isOwner && {
        userName: data.userName,
        userId: data.userId,
        isOwner: true,
        privateNotes: data.privateNotes || [],
      }),

      // Dados extras se autenticado
      ...(req.user && {
        canEdit: isOwner,
        canReport: !isOwner,
        interactions: {
          canLike: !isOwner,
          canComment: true,
          canShare: true,
        },
      }),
    };

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: complaint,
      meta: {
        viewedBy: req.user ? req.user.uid : "anonymous",
        isOwner: isOwner,
        relatedComplaintsCount: similarComplaints.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar denúncia:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

// Funções auxiliares
function getStatusName(status: number): string {
  const statusNames = {
    0: "Pendente",
    1: "Em Andamento",
    2: "Resolvida",
    3: "Fechada",
  };
  return statusNames[status] || "Desconhecido";
}

function categorizeComplaint(description: string): string {
  const keywords = {
    buraco: "Infraestrutura",
    asfalto: "Infraestrutura",
    iluminação: "Iluminação Pública",
    lâmpada: "Iluminação Pública",
    lixo: "Limpeza Urbana",
    entulho: "Limpeza Urbana",
    esgoto: "Saneamento",
    água: "Saneamento",
    calçada: "Acessibilidade",
    árvore: "Meio Ambiente",
  };

  const desc = description.toLowerCase();
  for (const [keyword, category] of Object.entries(keywords)) {
    if (desc.includes(keyword)) {
      return category;
    }
  }
  return "Outros";
}

function calculatePriority(data: any): "low" | "medium" | "high" | "urgent" {
  let score = 0;

  // Pontuação baseada em fatores
  if (data.imageUrl) score += 1; // Tem foto
  if (data.similarCount > 3) score += 2; // Muitas denúncias similares
  if (
    data.description?.includes("urgente") ||
    data.description?.includes("perigo")
  )
    score += 3;

  // Tempo em aberto
  if (data.createdAt) {
    const daysOpen = Math.floor(
      (new Date().getTime() - new Date(data.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysOpen > 30) score += 2;
    if (daysOpen > 90) score += 3;
  }

  if (score >= 6) return "urgent";
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

//buscar todas as denuncias de um bairro (público)
router.get("/district/:district", async (req, res) => {
  const { district } = req.params;

  try {
    const normalizedDistrict = district.replace(/\s+/g, "").toLowerCase();

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    const districtComplaints = [];

    complaintsSnapshot.forEach((doc) => {
      const data = doc.data();
      const address = data.address;

      if (address?.district) {
        const docDistrict = address.district.replace(/\s+/g, "").toLowerCase();

        if (docDistrict === normalizedDistrict) {
          districtComplaints.push({
            id: doc.id,
            description: data.description,
            address: data.address,
            situation: data.situation,
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl,
            createdAt: data.createdAt,
            // Dados do usuário omitidos para privacidade
          });
        }
      }
    });

    if (districtComplaints.length === 0) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhuma denúncia encontrada para este bairro 😿",
      });
    } else {
      res.status(200).json({
        success: true,
        statuscode: 200,
        data: districtComplaints,
        meta: {
          district: district,
          total: districtComplaints.length,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor 😿 || erro: " + error.message,
    });
  }
});

// Criar nova denúncia (protegido - apenas usuários autenticados)
router.post("/", authenticateFirebaseToken, async (req, res) => {
  try {
    const { description, address, imageUrl, thumbnailUrl } = req.body;

    // Validação básica
    if (!description || !address) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Descrição e endereço são obrigatórios",
      });
    }

    const complaintData = {
      description,
      address,
      imageUrl: imageUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      userId: req.user!.uid,
      userName: req.user!.email, // ou buscar do Firestore
      situation: { status: 0 }, // Status inicial
      similarCount: 0,
      createdAt: firestore.serverTimestamp(),
      updatedAt: firestore.serverTimestamp(),
    };

    const docRef = await firestore.addDoc(
      firestore.collection(db, "complaints"),
      complaintData
    );

    res.status(201).json({
      success: true,
      statuscode: 201,
      data: {
        id: docRef.id,
        ...complaintData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: "Denúncia criada com sucesso! ✅",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao criar denúncia 😿 || erro: " + error.message,
    });
  }
});

// Endpoint de estatísticas das denúncias
router.get("/stats", async (req, res) => {
  try {
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    const complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const stats = {
      total: complaints.length,

      // Estatísticas por status
      byStatus: {
        pending: complaints.filter((c) => (c.situation?.status || 0) === 0)
          .length,
        inProgress: complaints.filter((c) => (c.situation?.status || 0) === 1)
          .length,
        resolved: complaints.filter((c) => (c.situation?.status || 0) === 2)
          .length,
        closed: complaints.filter((c) => (c.situation?.status || 0) === 3)
          .length,
      },

      // Estatísticas por cidade
      byCities: complaints.reduce((acc: any, complaint: any) => {
        const city = complaint.address?.city || "Não informado";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}),

      // Estatísticas por distrito
      byDistricts: complaints.reduce((acc: any, complaint: any) => {
        const district = complaint.address?.district || "Não informado";
        acc[district] = (acc[district] || 0) + 1;
        return acc;
      }, {}),

      // Categorização automática
      byCategories: complaints.reduce((acc: any, complaint: any) => {
        const category = categorizeComplaint(complaint.description || "");
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),

      // Estatísticas temporais
      temporal: {
        today: complaints.filter((c) => {
          if (!c.createdAt && !c.created_at) return false;
          const date = new Date(c.createdAt || c.created_at);
          const today = new Date();
          return date.toDateString() === today.toDateString();
        }).length,

        thisWeek: complaints.filter((c) => {
          if (!c.createdAt && !c.created_at) return false;
          const date = new Date(c.createdAt || c.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }).length,

        thisMonth: complaints.filter((c) => {
          if (!c.createdAt && !c.created_at) return false;
          const date = new Date(c.createdAt || c.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return date >= monthAgo;
        }).length,
      },

      // Análise de qualidade
      quality: {
        withImages: complaints.filter((c) => c.imageUrl).length,
        withoutImages: complaints.filter((c) => !c.imageUrl).length,
        averageDescriptionLength:
          complaints.reduce((sum, c) => sum + (c.description?.length || 0), 0) /
            complaints.length || 0,
        completedComplaintsRatio:
          complaints.length > 0
            ? (
                (complaints.filter((c) => (c.situation?.status || 0) >= 2)
                  .length /
                  complaints.length) *
                100
              ).toFixed(2)
            : 0,
      },

      // Top distritos por volume
      topDistricts: Object.entries(
        complaints.reduce((acc: any, complaint: any) => {
          const district = complaint.address?.district || "Não informado";
          acc[district] = (acc[district] || 0) + 1;
          return acc;
        }, {})
      )
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([district, count]) => ({ district, count })),

      // Tendências (últimos 30 dias)
      trends: generateTrendData(complaints),
    };

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: stats,
      meta: {
        generatedAt: new Date().toISOString(),
        dataSource: "complaints_collection",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar estatísticas das denúncias 😿",
    });
  }
});

// Endpoint de análise avançada para dashboard
router.get("/analytics", async (req, res) => {
  // Aceita tanto 'timeframe' quanto 'period' como query param
  const timeframeRaw =
    (req.query.timeframe as string) || (req.query.period as string) || "30d";
  const groupBy =
    (req.query.groupBy as string) || (req.query.groupby as string) || "day";
  const district = req.query.district as string | undefined;
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const q = (req.query.q as string) || "";

  try {
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    let complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Filtros por district/city/status
    if (district && district !== "all") {
      complaints = complaints.filter((c) => c.address?.district === district);
    }
    if (city && city !== "all") {
      complaints = complaints.filter((c) => c.address?.city === city);
    }
    if (status && status !== "all") {
      complaints = complaints.filter(
        (c) => (c.situation?.status || 0) === parseInt(status as string)
      );
    }

    // Filtro por q (string livre) — busca em descrição, rua, distrito, cidade
    if (q && q.trim().length > 0) {
      const qLower = q.toLowerCase().trim();
      complaints = complaints.filter((c) => {
        const text = [
          c.description || "",
          c.address?.street || "",
          c.address?.district || "",
          c.address?.city || "",
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(qLower);
      });
    }

    // Análise temporal
    const timeframeDays = getTimeframeDays(timeframeRaw as string);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    const filteredComplaints = complaints.filter((c) => {
      const date = new Date(c.createdAt || c.created_at);
      return date >= cutoffDate;
    });

    // Summary / KPIs
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) >= 2
    ).length;
    const pending = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) === 0
    ).length;

    // average resolution time (dias) — cálculo com precisão decimal
    const resolvedItems = filteredComplaints.filter(
      (c) => (c.situation?.status || 0) >= 2 && c.updatedAt && c.createdAt
    );
    let averageResolutionTime = 0;
    if (resolvedItems.length > 0) {
      const totalMs = resolvedItems.reduce((sum: number, it: any) => {
        const created = new Date(it.createdAt || it.created_at).getTime();
        const resolvedAt = new Date(it.updatedAt || it.updated_at).getTime();
        return sum + Math.max(0, resolvedAt - created);
      }, 0);
      averageResolutionTime =
        Math.round(
          (totalMs / resolvedItems.length / (1000 * 60 * 60 * 24)) * 10
        ) / 10; // dias com 1 decimal
    }

    const resolutionRate =
      total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0; // uma casa decimal

    // Trends
    let trendsItems: any[] = [];
    if (["day", "hour", "week", "month"].includes(groupBy)) {
      const timeline = groupComplaintsByTime(filteredComplaints, groupBy);
      trendsItems = timeline.map((t: any) => ({
        date: t.period,
        count: t.count,
      }));
    } else if (groupBy === "district") {
      // agregação por distrito
      const counts: any = {};
      filteredComplaints.forEach((c) => {
        const d = c.address?.district || "Não informado";
        counts[d] = (counts[d] || 0) + 1;
      });
      trendsItems = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
      }));
    } else if (groupBy === "city") {
      const counts: any = {};
      filteredComplaints.forEach((c) => {
        const ci = c.address?.city || "Não informado";
        counts[ci] = (counts[ci] || 0) + 1;
      });
      trendsItems = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
      }));
    } else {
      // default temporal
      const timeline = groupComplaintsByTime(filteredComplaints, "day");
      trendsItems = timeline.map((t: any) => ({
        date: t.period,
        count: t.count,
      }));
    }

    // Top categories
    const topCategoriesRaw = getMostCommonCategories(filteredComplaints);
    const topCategories = topCategoriesRaw.map((c: any) => ({
      name: c.category || c.name || c,
      count: c.count,
    }));

    // Points (opcional)
    const points = filteredComplaints
      .map((c) => ({
        lat: c.address?.latitude,
        lng: c.address?.longitude,
        weight: 1,
        status:
          (c.situation?.status || 0) === 0
            ? "pending"
            : (c.situation?.status || 0) === 1
            ? "in_progress"
            : (c.situation?.status || 0) === 2
            ? "resolved"
            : "closed",
      }))
      .filter((p) => p.lat && p.lng);

    const response = {
      meta: {
        q: q || null,
        period: timeframeRaw,
        groupBy,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        total,
        resolved,
        pending,
        resolutionRate,
        averageResolutionTime,
      },
      trends: {
        items: trendsItems,
      },
      topCategories,
      points,
    };

    res.status(200).json({ success: true, statuscode: 200, data: response });
  } catch (error) {
    console.error("Erro ao gerar analytics:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar análise avançada 😿",
    });
  }
});

// Funções auxiliares para analytics
function generateTrendData(complaints: any[]): any {
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayComplaints = complaints.filter((c) => {
      if (!c.createdAt && !c.created_at) return false;
      const complaintDate = new Date(c.createdAt || c.created_at);
      return complaintDate.toDateString() === date.toDateString();
    }).length;

    last30Days.push({
      date: date.toISOString().split("T")[0],
      count: dayComplaints,
    });
  }
  return last30Days;
}

function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

function groupComplaintsByTime(complaints: any[], groupBy: string): any[] {
  const groups = {};

  complaints.forEach((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    let key: string;

    switch (groupBy) {
      case "hour":
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case "month":
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    groups[key] = (groups[key] || 0) + 1;
  });

  return Object.entries(groups).map(([period, count]) => ({ period, count }));
}

function generateHeatmapData(complaints: any[]): any {
  const heatmap = {};

  complaints.forEach((complaint) => {
    const district = complaint.address?.district || "Não informado";
    const status = complaint.situation?.status || 0;

    if (!heatmap[district]) {
      heatmap[district] = { total: 0, resolved: 0, pending: 0 };
    }

    heatmap[district].total++;
    if (status >= 2) heatmap[district].resolved++;
    else heatmap[district].pending++;
  });

  return Object.entries(heatmap).map(([district, data]: [string, any]) => ({
    district,
    total: data.total,
    resolved: data.resolved,
    pending: data.pending,
    efficiency:
      data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(2) : 0,
  }));
}

function getMostCommonCategories(complaints: any[]): any[] {
  const categories = {};

  complaints.forEach((complaint) => {
    const category = categorizeComplaint(complaint.description || "");
    categories[category] = (categories[category] || 0) + 1;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function getPeakHours(complaints: any[]): any[] {
  const hours = Array(24).fill(0);

  complaints.forEach((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    hours[date.getHours()]++;
  });

  return hours.map((count, hour) => ({ hour, count }));
}

function getSeasonalityData(complaints: any[]): any {
  const months = Array(12).fill(0);

  complaints.forEach((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    months[date.getMonth()]++;
  });

  return months.map((count, month) => ({
    month: new Date(2024, month).toLocaleString("pt-BR", { month: "long" }),
    count,
  }));
}

function calculateAverageResolutionTime(complaints: any[]): number {
  const resolvedComplaints = complaints.filter(
    (c) => (c.situation?.status || 0) >= 2 && c.updatedAt && c.createdAt
  );

  if (resolvedComplaints.length === 0) return 0;

  const totalTime = resolvedComplaints.reduce((sum, complaint) => {
    const created = new Date(
      complaint.createdAt || complaint.created_at
    ).getTime();
    const resolved = new Date(
      complaint.updatedAt || complaint.updated_at
    ).getTime();
    return sum + (resolved - created);
  }, 0);

  return Math.round(
    totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24)
  ); // dias
}

async function getComparisonData(
  allComplaints: any[],
  timeframeDays: number
): Promise<any> {
  const currentPeriodStart = new Date();
  currentPeriodStart.setDate(currentPeriodStart.getDate() - timeframeDays);

  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(
    previousPeriodStart.getDate() - timeframeDays * 2
  );

  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - timeframeDays);

  const previousComplaints = allComplaints.filter((c) => {
    const date = new Date(c.createdAt || c.created_at);
    return date >= previousPeriodStart && date < previousPeriodEnd;
  });

  return {
    total: previousComplaints.length,
    resolved: previousComplaints.filter((c) => (c.situation?.status || 0) >= 2)
      .length,
  };
}

function calculateGrowthRate(complaints: any[], timeframeDays: number): any {
  const midPoint = Math.floor(timeframeDays / 2);
  const midDate = new Date();
  midDate.setDate(midDate.getDate() - midPoint);

  const firstHalf = complaints.filter((c) => {
    const date = new Date(c.createdAt || c.created_at);
    return date < midDate;
  }).length;

  const secondHalf = complaints.length - firstHalf;

  const growthRate =
    firstHalf > 0
      ? (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(2)
      : 0;

  return {
    firstHalf,
    secondHalf,
    growthRate: parseFloat(growthRate as string),
    trend:
      parseFloat(growthRate as string) > 0
        ? "increasing"
        : parseFloat(growthRate as string) < 0
        ? "decreasing"
        : "stable",
  };
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export default router;
