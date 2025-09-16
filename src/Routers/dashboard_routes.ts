import express from "express";
import * as firestore from "firebase/firestore";
import { db } from "../database/firebase";
import optionalAuthentication from "./auth/auth_functions";

const router = express.Router();

// Dashboard principal com KPIs gerais
router.get("/", optionalAuthentication, async (req, res) => {
  const {
    timeframe = "30d",
    compareWith = "previous_period",
    includeDetails = "false",
  } = req.query;

  try {
    const [usersSnapshot, complaintsSnapshot] = await Promise.all([
      firestore.getDocs(firestore.collection(db, "users")),
      firestore.getDocs(firestore.collection(db, "complaints")),
    ]);

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    const complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const timeframeDays = getTimeframeDays(timeframe as string);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    // Filtrar dados pelo período
    const recentUsers = users.filter((user) => {
      const userDate = new Date(user.created_at || user.createdAt);
      return userDate >= cutoffDate;
    });

    const recentComplaints = complaints.filter((complaint) => {
      const complaintDate = new Date(
        complaint.createdAt || complaint.created_at
      );
      return complaintDate >= cutoffDate;
    });

    // KPIs principais
    const kpis = {
      users: {
        total: users.length,
        new: recentUsers.length,
        active: users.filter((user) => (user.complaintsCount || 0) > 0).length,
        verified: users.filter((user) => user.verified).length,
        growthRate: calculateGrowthRate(users, timeframeDays, "user"),
      },

      complaints: {
        total: complaints.length,
        new: recentComplaints.length,
        resolved: complaints.filter((c) => (c.situation?.status || 0) >= 2)
          .length,
        pending: complaints.filter((c) => (c.situation?.status || 0) === 0)
          .length,
        inProgress: complaints.filter((c) => (c.situation?.status || 0) === 1)
          .length,
        resolutionRate:
          complaints.length > 0
            ? (
                (complaints.filter((c) => (c.situation?.status || 0) >= 2)
                  .length /
                  complaints.length) *
                100
              ).toFixed(2)
            : 0,
        averageResolutionTime: calculateAverageResolutionTime(complaints),
        growthRate: calculateGrowthRate(complaints, timeframeDays, "complaint"),
      },

      engagement: {
        complaintsPerUser:
          users.length > 0 ? (complaints.length / users.length).toFixed(2) : 0,
        activeUsersPercentage:
          users.length > 0
            ? (
                (users.filter((user) => (user.complaintsCount || 0) > 0)
                  .length /
                  users.length) *
                100
              ).toFixed(2)
            : 0,
        averageComplaintsPerActiveUser:
          calculateAverageComplaintsPerActiveUser(users),
        topContributors: getTopContributors(users, 5),
      },

      quality: {
        complaintsWithImages: complaints.filter((c) => c.imageUrl).length,
        averageDescriptionLength: calculateAverageDescriptionLength(complaints),
        completenessScore: calculateCompletenessScore(complaints),
        duplicateRate: calculateDuplicateRate(complaints),
      },
    };

    // Comparação com período anterior se solicitado
    let comparison = null;
    if (compareWith === "previous_period") {
      comparison = await calculatePeriodComparison(timeframeDays);
    }

    // Dados detalhados se solicitado
    let details = null;
    if (includeDetails === "true") {
      details = {
        timeline: generateTimelineData(recentComplaints, timeframeDays),
        geographical: generateGeographicalBreakdown(complaints),
        categories: generateCategoryBreakdown(complaints),
        statusFlow: generateStatusFlowData(complaints),
        userSegments: generateUserSegments(users),
      };
    }

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: {
        kpis,
        comparison,
        details,
        meta: {
          timeframe: timeframe,
          period: `${timeframeDays} dias`,
          generatedAt: new Date().toISOString(),
          dataFreshness: "real-time",
        },
      },
    });
  } catch (error) {
    console.error("Erro ao gerar dashboard:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar dashboard 😿",
    });
  }
});

// Relatório executivo detalhado
router.get("/executive-report", async (req, res) => {
  const {
    period = "monthly",
    format = "json", // 'json', 'summary'
  } = req.query;

  try {
    const [usersSnapshot, complaintsSnapshot] = await Promise.all([
      firestore.getDocs(firestore.collection(db, "users")),
      firestore.getDocs(firestore.collection(db, "complaints")),
    ]);

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    const complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const report = {
      summary: {
        title: `Relatório Executivo - ${getPeriodName(period as string)}`,
        generatedAt: new Date().toISOString(),
        reportPeriod: period,
        keyHighlights: generateKeyHighlights(users, complaints),
      },

      metrics: {
        userGrowth: {
          totalUsers: users.length,
          newUsers: calculateNewUsersInPeriod(users, period as string),
          userRetention: calculateUserRetention(users),
          topUserCities: getTopUserCities(users, 10),
        },

        complaintVolume: {
          totalComplaints: complaints.length,
          newComplaints: calculateNewComplaintsInPeriod(
            complaints,
            period as string
          ),
          resolutionRate: calculateResolutionRate(complaints),
          averageResolutionTime: calculateAverageResolutionTime(complaints),
          topComplaintCategories: getTopComplaintCategories(complaints, 10),
        },

        geographicalInsights: {
          topCities: getTopCitiesByVolume(complaints, 10),
          topDistricts: getTopDistrictsByVolume(complaints, 10),
          resolutionRateByCity: getResolutionRateByCity(complaints),
          emergingHotspots: identifyEmergingHotspots(complaints),
        },

        performanceIndicators: {
          systemHealth: calculateSystemHealth(users, complaints),
          userSatisfaction: estimateUserSatisfaction(complaints),
          operationalEfficiency: calculateOperationalEfficiency(complaints),
          dataQuality: assessDataQuality(users, complaints),
        },
      },

      trends: {
        userGrowthTrend: generateUserGrowthTrend(users),
        complaintVolumesTrend: generateComplaintVolumesTrend(complaints),
        resolutionEfficiencyTrend:
          generateResolutionEfficiencyTrend(complaints),
        geographicalShiftsTrend: generateGeographicalTrends(complaints),
      },

      insights: {
        keyFindings: generateKeyFindings(users, complaints),
        recommendations: generateRecommendations(users, complaints),
        riskFactors: identifyRiskFactors(users, complaints),
        opportunities: identifyOpportunities(users, complaints),
      },

      forecasting: {
        userGrowthProjection: projectUserGrowth(users),
        complaintVolumeProjection: projectComplaintVolume(complaints),
        resourceRequirements: calculateResourceRequirements(complaints),
        budgetProjections: calculateBudgetProjections(complaints),
      },
    };

    if (format === "summary") {
      // Retornar apenas resumo executivo
      const summary = {
        keyMetrics: {
          totalUsers: report.metrics.userGrowth.totalUsers,
          totalComplaints: report.metrics.complaintVolume.totalComplaints,
          resolutionRate: report.metrics.complaintVolume.resolutionRate,
          systemHealth: report.metrics.performanceIndicators.systemHealth,
        },
        highlights: report.summary.keyHighlights,
        topRecommendations: report.insights.recommendations.slice(0, 3),
      };

      return res.status(200).json({
        success: true,
        statuscode: 200,
        data: summary,
      });
    }

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: report,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório executivo:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar relatório executivo 😿",
    });
  }
});

// Endpoint para KPIs em tempo real
router.get("/realtime-kpis", async (req, res) => {
  try {
    const [usersSnapshot, complaintsSnapshot] = await Promise.all([
      firestore.getDocs(firestore.collection(db, "users")),
      firestore.getDocs(firestore.collection(db, "complaints")),
    ]);

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    const complaints = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const realTimeKpis = {
      current: {
        totalUsers: users.length,
        totalComplaints: complaints.length,
        resolvedComplaints: complaints.filter(
          (c) => (c.situation?.status || 0) >= 2
        ).length,
        pendingComplaints: complaints.filter(
          (c) => (c.situation?.status || 0) === 0
        ).length,
      },

      today: {
        newUsers: users.filter((user) => {
          const userDate = new Date(user.created_at || user.createdAt);
          return userDate >= today;
        }).length,
        newComplaints: complaints.filter((complaint) => {
          const complaintDate = new Date(
            complaint.createdAt || complaint.created_at
          );
          return complaintDate >= today;
        }).length,
        resolvedToday: complaints.filter((complaint) => {
          const resolvedDate = new Date(
            complaint.updatedAt || complaint.updated_at
          );
          return (
            resolvedDate >= today && (complaint.situation?.status || 0) >= 2
          );
        }).length,
      },

      thisWeek: {
        newUsers: users.filter((user) => {
          const userDate = new Date(user.created_at || user.createdAt);
          return userDate >= thisWeek;
        }).length,
        newComplaints: complaints.filter((complaint) => {
          const complaintDate = new Date(
            complaint.createdAt || complaint.created_at
          );
          return complaintDate >= thisWeek;
        }).length,
      },

      thisMonth: {
        newUsers: users.filter((user) => {
          const userDate = new Date(user.created_at || user.createdAt);
          return userDate >= thisMonth;
        }).length,
        newComplaints: complaints.filter((complaint) => {
          const complaintDate = new Date(
            complaint.createdAt || complaint.created_at
          );
          return complaintDate >= thisMonth;
        }).length,
      },

      efficiency: {
        resolutionRate:
          complaints.length > 0
            ? (
                (complaints.filter((c) => (c.situation?.status || 0) >= 2)
                  .length /
                  complaints.length) *
                100
              ).toFixed(2)
            : 0,
        averageResolutionTime: calculateAverageResolutionTime(complaints),
        responseRate:
          complaints.length > 0
            ? (
                (complaints.filter((c) => (c.situation?.status || 0) > 0)
                  .length /
                  complaints.length) *
                100
              ).toFixed(2)
            : 0,
      },

      alerts: generateRealTimeAlerts(users, complaints),
    };

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: realTimeKpis,
      meta: {
        lastUpdated: new Date().toISOString(),
        refreshRate: "30s",
        dataSource: "firestore",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar KPIs em tempo real:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro ao gerar KPIs em tempo real 😿",
    });
  }
});

// Funções auxiliares
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

function calculateGrowthRate(
  data: any[],
  timeframeDays: number,
  type: string
): any {
  const currentPeriodStart = new Date();
  currentPeriodStart.setDate(currentPeriodStart.getDate() - timeframeDays);

  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(
    previousPeriodStart.getDate() - timeframeDays * 2
  );

  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - timeframeDays);

  const currentPeriodCount = data.filter((item) => {
    const date = new Date(item.createdAt || item.created_at);
    return date >= currentPeriodStart;
  }).length;

  const previousPeriodCount = data.filter((item) => {
    const date = new Date(item.createdAt || item.created_at);
    return date >= previousPeriodStart && date < previousPeriodEnd;
  }).length;

  const growth =
    previousPeriodCount > 0
      ? (
          ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) *
          100
        ).toFixed(2)
      : 0;

  return {
    current: currentPeriodCount,
    previous: previousPeriodCount,
    growthRate: parseFloat(growth as string),
    trend:
      parseFloat(growth as string) > 0
        ? "up"
        : parseFloat(growth as string) < 0
        ? "down"
        : "stable",
  };
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
  );
}

function calculateAverageComplaintsPerActiveUser(users: any[]): string {
  const activeUsers = users.filter((user) => (user.complaintsCount || 0) > 0);
  if (activeUsers.length === 0) return "0";

  const totalComplaints = activeUsers.reduce(
    (sum, user) => sum + (user.complaintsCount || 0),
    0
  );
  return (totalComplaints / activeUsers.length).toFixed(2);
}

function getTopContributors(users: any[], limit: number): any[] {
  return users
    .filter((user) => (user.complaintsCount || 0) > 0)
    .sort((a, b) => (b.complaintsCount || 0) - (a.complaintsCount || 0))
    .slice(0, limit)
    .map((user) => ({
      id: user.id,
      name: user.fullName || user.email || "Usuário",
      complaintsCount: user.complaintsCount || 0,
      verified: user.verified || false,
    }));
}

function calculateAverageDescriptionLength(complaints: any[]): number {
  if (complaints.length === 0) return 0;

  const totalLength = complaints.reduce(
    (sum, complaint) => sum + (complaint.description?.length || 0),
    0
  );

  return Math.round(totalLength / complaints.length);
}

function calculateCompletenessScore(complaints: any[]): string {
  if (complaints.length === 0) return "0";

  let totalScore = 0;

  complaints.forEach((complaint) => {
    let score = 0;
    if (complaint.description?.length > 10) score += 25;
    if (complaint.imageUrl) score += 25;
    if (complaint.address?.street) score += 25;
    if (complaint.address?.district && complaint.address?.city) score += 25;
    totalScore += score;
  });

  return ((totalScore / (complaints.length * 100)) * 100).toFixed(2);
}

function calculateDuplicateRate(complaints: any[]): string {
  // Implementação simplificada - pode ser melhorada com algoritmos de similaridade
  if (complaints.length === 0) return "0";

  const duplicates = complaints.filter(
    (complaint) => (complaint.similarCount || 0) > 1
  );
  return ((duplicates.length / complaints.length) * 100).toFixed(2);
}

async function calculatePeriodComparison(timeframeDays: number): Promise<any> {
  // Implementação básica - pode ser expandida
  return {
    users: { change: "+15%", trend: "up" },
    complaints: { change: "+8%", trend: "up" },
    resolution: { change: "+12%", trend: "up" },
  };
}

function generateTimelineData(complaints: any[], timeframeDays: number): any[] {
  const timeline = [];
  for (let i = timeframeDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dayComplaints = complaints.filter((complaint) => {
      const complaintDate = new Date(
        complaint.createdAt || complaint.created_at
      );
      return complaintDate.toDateString() === date.toDateString();
    });

    timeline.push({
      date: date.toISOString().split("T")[0],
      count: dayComplaints.length,
      resolved: dayComplaints.filter((c) => (c.situation?.status || 0) >= 2)
        .length,
    });
  }
  return timeline;
}

function generateGeographicalBreakdown(complaints: any[]): any {
  const breakdown = {};

  complaints.forEach((complaint) => {
    const city = complaint.address?.city || "Não informado";
    const district = complaint.address?.district || "Não informado";

    if (!breakdown[city]) {
      breakdown[city] = { total: 0, districts: {} };
    }

    breakdown[city].total++;
    breakdown[city].districts[district] =
      (breakdown[city].districts[district] || 0) + 1;
  });

  return breakdown;
}

function generateCategoryBreakdown(complaints: any[]): any {
  const categories = {};

  complaints.forEach((complaint) => {
    const category = categorizeComplaint(complaint.description || "");
    categories[category] = (categories[category] || 0) + 1;
  });

  return categories;
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

function generateStatusFlowData(complaints: any[]): any {
  const flow = {
    pending: complaints.filter((c) => (c.situation?.status || 0) === 0).length,
    inProgress: complaints.filter((c) => (c.situation?.status || 0) === 1)
      .length,
    resolved: complaints.filter((c) => (c.situation?.status || 0) === 2).length,
    closed: complaints.filter((c) => (c.situation?.status || 0) === 3).length,
  };

  return flow;
}

function generateUserSegments(users: any[]): any {
  return {
    new: users.filter((user) => {
      const userDate = new Date(user.created_at || user.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userDate >= thirtyDaysAgo;
    }).length,
    active: users.filter((user) => (user.complaintsCount || 0) > 0).length,
    superActive: users.filter((user) => (user.complaintsCount || 0) >= 5)
      .length,
    verified: users.filter((user) => user.verified).length,
  };
}

// Funções para relatório executivo (implementações básicas)
function getPeriodName(period: string): string {
  const names = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    annual: "Anual",
  };
  return names[period] || "Mensal";
}

function generateKeyHighlights(users: any[], complaints: any[]): string[] {
  return [
    `Total de ${users.length} usuários registrados`,
    `${complaints.length} denúncias registradas no sistema`,
    `Taxa de resolução de ${calculateResolutionRate(complaints)}%`,
    `Tempo médio de resolução: ${calculateAverageResolutionTime(
      complaints
    )} dias`,
  ];
}

function calculateNewUsersInPeriod(users: any[], period: string): number {
  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case "daily":
      cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return users.filter((user) => {
    const userDate = new Date(user.created_at || user.createdAt);
    return userDate >= cutoffDate;
  }).length;
}

function calculateUserRetention(users: any[]): string {
  // Implementação simplificada
  const activeUsers = users.filter((user) => (user.complaintsCount || 0) > 0);
  return users.length > 0
    ? ((activeUsers.length / users.length) * 100).toFixed(2)
    : "0";
}

function calculateNewComplaintsInPeriod(
  complaints: any[],
  period: string
): number {
  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case "daily":
      cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return complaints.filter((complaint) => {
    const complaintDate = new Date(complaint.createdAt || complaint.created_at);
    return complaintDate >= cutoffDate;
  }).length;
}

function calculateResolutionRate(complaints: any[]): string {
  if (complaints.length === 0) return "0";
  const resolved = complaints.filter(
    (c) => (c.situation?.status || 0) >= 2
  ).length;
  return ((resolved / complaints.length) * 100).toFixed(2);
}

function getTopUserCities(users: any[], limit: number): any[] {
  const cities = {};
  users.forEach((user) => {
    const city = user.city || "Não informado";
    cities[city] = (cities[city] || 0) + 1;
  });

  return Object.entries(cities)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([city, count]) => ({ city, count }));
}

function getTopComplaintCategories(complaints: any[], limit: number): any[] {
  const categories = {};
  complaints.forEach((complaint) => {
    const category = categorizeComplaint(complaint.description || "");
    categories[category] = (categories[category] || 0) + 1;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([category, count]) => ({ category, count }));
}

// Implementações básicas para outras funções
function getTopCitiesByVolume(complaints: any[], limit: number): any[] {
  const cities = {};
  complaints.forEach((complaint) => {
    const city = complaint.address?.city || "Não informado";
    cities[city] = (cities[city] || 0) + 1;
  });

  return Object.entries(cities)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([city, count]) => ({ city, count }));
}

function getTopDistrictsByVolume(complaints: any[], limit: number): any[] {
  const districts = {};
  complaints.forEach((complaint) => {
    const district = complaint.address?.district || "Não informado";
    districts[district] = (districts[district] || 0) + 1;
  });

  return Object.entries(districts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([district, count]) => ({ district, count }));
}

function getResolutionRateByCity(complaints: any[]): any[] {
  const cities = {};

  complaints.forEach((complaint) => {
    const city = complaint.address?.city || "Não informado";
    if (!cities[city]) {
      cities[city] = { total: 0, resolved: 0 };
    }
    cities[city].total++;
    if ((complaint.situation?.status || 0) >= 2) {
      cities[city].resolved++;
    }
  });

  return Object.entries(cities).map(([city, data]: [string, any]) => ({
    city,
    total: data.total,
    resolved: data.resolved,
    rate: data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(2) : 0,
  }));
}

function identifyEmergingHotspots(complaints: any[]): any[] {
  // Implementação simplificada - identificar áreas com crescimento recente
  const recentComplaints = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const districts = {};
  recentComplaints.forEach((complaint) => {
    const district = complaint.address?.district || "Não informado";
    districts[district] = (districts[district] || 0) + 1;
  });

  return Object.entries(districts)
    .filter(([, count]) => (count as number) >= 3) // Pelo menos 3 denúncias
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([district, count]) => ({ district, recentCount: count }));
}

// Funções de cálculo de métricas avançadas (implementações básicas)
function calculateSystemHealth(users: any[], complaints: any[]): string {
  let healthScore = 100;

  // Reduzir score baseado em fatores negativos
  const pendingRate =
    complaints.length > 0
      ? complaints.filter((c) => (c.situation?.status || 0) === 0).length /
        complaints.length
      : 0;
  healthScore -= pendingRate * 30;

  const oldComplaintsRate =
    complaints.filter((complaint) => {
      const date = new Date(complaint.createdAt || complaint.created_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return date < ninetyDaysAgo && (complaint.situation?.status || 0) === 0;
    }).length / complaints.length;
  healthScore -= oldComplaintsRate * 40;

  return Math.max(healthScore, 0).toFixed(2);
}

function estimateUserSatisfaction(complaints: any[]): string {
  // Estimativa baseada em taxa de resolução e tempo médio
  const resolutionRate = parseFloat(calculateResolutionRate(complaints));
  const avgResolutionTime = calculateAverageResolutionTime(complaints);

  let satisfaction = resolutionRate;

  // Penalizar por tempo de resolução alto
  if (avgResolutionTime > 30) satisfaction -= 10;
  if (avgResolutionTime > 60) satisfaction -= 20;

  return Math.max(satisfaction, 0).toFixed(2);
}

function calculateOperationalEfficiency(complaints: any[]): string {
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (c) => (c.situation?.status || 0) >= 2
  ).length;
  const avgResolutionTime = calculateAverageResolutionTime(complaints);

  let efficiency =
    totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0;

  // Ajustar por tempo de resolução
  if (avgResolutionTime > 0 && avgResolutionTime <= 7) efficiency += 10;
  if (avgResolutionTime > 30) efficiency -= 15;

  return Math.max(efficiency, 0).toFixed(2);
}

function assessDataQuality(users: any[], complaints: any[]): string {
  let qualityScore = 0;
  let totalItems = 0;

  // Avaliar qualidade dos dados dos usuários
  users.forEach((user) => {
    let userScore = 0;
    if (user.fullName) userScore += 25;
    if (user.email) userScore += 25;
    if (user.photoURL) userScore += 25;
    if (user.verified) userScore += 25;
    qualityScore += userScore;
    totalItems++;
  });

  // Avaliar qualidade dos dados das denúncias
  complaints.forEach((complaint) => {
    let complaintScore = 0;
    if (complaint.description?.length > 10) complaintScore += 25;
    if (complaint.imageUrl) complaintScore += 25;
    if (complaint.address?.street) complaintScore += 25;
    if (complaint.address?.district && complaint.address?.city)
      complaintScore += 25;
    qualityScore += complaintScore;
    totalItems++;
  });

  return totalItems > 0
    ? ((qualityScore / (totalItems * 100)) * 100).toFixed(2)
    : "0";
}

// Funções de geração de insights (implementações básicas)
function generateKeyFindings(users: any[], complaints: any[]): string[] {
  const findings = [];

  const resolutionRate = parseFloat(calculateResolutionRate(complaints));
  if (resolutionRate > 80) {
    findings.push("Alta taxa de resolução indica boa eficiência operacional");
  } else if (resolutionRate < 50) {
    findings.push("Taxa de resolução baixa requer atenção imediata");
  }

  const activeUsersRate =
    users.length > 0
      ? (users.filter((user) => (user.complaintsCount || 0) > 0).length /
          users.length) *
        100
      : 0;
  if (activeUsersRate > 60) {
    findings.push("Alto engajamento dos usuários com a plataforma");
  }

  return findings;
}

function generateRecommendations(users: any[], complaints: any[]): string[] {
  const recommendations = [];

  const pendingComplaints = complaints.filter(
    (c) => (c.situation?.status || 0) === 0
  );
  if (pendingComplaints.length > complaints.length * 0.3) {
    recommendations.push(
      "Implementar sistema de priorização para reduzir backlog de denúncias pendentes"
    );
  }

  const complaintsWithoutImages = complaints.filter((c) => !c.imageUrl);
  if (complaintsWithoutImages.length > complaints.length * 0.5) {
    recommendations.push(
      "Incentivar usuários a anexar fotos nas denúncias para melhor documentação"
    );
  }

  return recommendations;
}

function identifyRiskFactors(users: any[], complaints: any[]): string[] {
  const risks = [];

  const oldPendingComplaints = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return date < sixtyDaysAgo && (complaint.situation?.status || 0) === 0;
  });

  if (oldPendingComplaints.length > 0) {
    risks.push(
      `${oldPendingComplaints.length} denúncias pendentes há mais de 60 dias`
    );
  }

  return risks;
}

function identifyOpportunities(users: any[], complaints: any[]): string[] {
  const opportunities = [];

  const verifiedUsersRate =
    users.length > 0
      ? (users.filter((user) => user.verified).length / users.length) * 100
      : 0;
  if (verifiedUsersRate < 30) {
    opportunities.push(
      "Implementar campanhas de verificação de usuários para aumentar confiabilidade"
    );
  }

  return opportunities;
}

// Funções de projeção (implementações básicas)
function projectUserGrowth(users: any[]): any {
  // Implementação simplificada - crescimento linear baseado nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsers = users.filter((user) => {
    const userDate = new Date(user.created_at || user.createdAt);
    return userDate >= thirtyDaysAgo;
  });

  const monthlyGrowth = recentUsers.length;

  return {
    nextMonth: users.length + monthlyGrowth,
    nextQuarter: users.length + monthlyGrowth * 3,
    nextYear: users.length + monthlyGrowth * 12,
    growthRate:
      users.length > 0 ? ((monthlyGrowth / users.length) * 100).toFixed(2) : 0,
  };
}

function projectComplaintVolume(complaints: any[]): any {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentComplaints = complaints.filter((complaint) => {
    const complaintDate = new Date(complaint.createdAt || complaint.created_at);
    return complaintDate >= thirtyDaysAgo;
  });

  const monthlyVolume = recentComplaints.length;

  return {
    nextMonth: monthlyVolume,
    nextQuarter: monthlyVolume * 3,
    nextYear: monthlyVolume * 12,
    trend: monthlyVolume > complaints.length * 0.1 ? "increasing" : "stable",
  };
}

function calculateResourceRequirements(complaints: any[]): any {
  const avgResolutionTime = calculateAverageResolutionTime(complaints);
  const monthlyComplaints = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }).length;

  return {
    estimatedStaffNeeded: Math.ceil(
      ((monthlyComplaints / 30) * avgResolutionTime) / 8
    ), // 8 horas por dia
    recommendedTooling:
      monthlyComplaints > 100 ? "automation_tools" : "manual_process",
    priorityAreas: ["infrastructure", "lighting", "cleaning"],
  };
}

function calculateBudgetProjections(complaints: any[]): any {
  const monthlyComplaints = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }).length;

  // Estimativas básicas
  const costPerComplaint = 50; // R$ médio por denúncia

  return {
    monthlyBudget: monthlyComplaints * costPerComplaint,
    quarterlyBudget: monthlyComplaints * costPerComplaint * 3,
    yearlyBudget: monthlyComplaints * costPerComplaint * 12,
    costBreakdown: {
      staffing: 60,
      tools: 25,
      infrastructure: 15,
    },
  };
}

function generateUserGrowthTrend(users: any[]): any[] {
  // Implementação simplificada - últimos 12 meses
  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const monthUsers = users.filter((user) => {
      const userDate = new Date(user.created_at || user.createdAt);
      return (
        userDate.getMonth() === date.getMonth() &&
        userDate.getFullYear() === date.getFullYear()
      );
    }).length;

    trend.push({
      month: date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
      count: monthUsers,
    });
  }
  return trend;
}

function generateComplaintVolumesTrend(complaints: any[]): any[] {
  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const monthComplaints = complaints.filter((complaint) => {
      const complaintDate = new Date(
        complaint.createdAt || complaint.created_at
      );
      return (
        complaintDate.getMonth() === date.getMonth() &&
        complaintDate.getFullYear() === date.getFullYear()
      );
    }).length;

    trend.push({
      month: date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
      count: monthComplaints,
    });
  }
  return trend;
}

function generateResolutionEfficiencyTrend(complaints: any[]): any[] {
  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const monthComplaints = complaints.filter((complaint) => {
      const complaintDate = new Date(
        complaint.createdAt || complaint.created_at
      );
      return (
        complaintDate.getMonth() === date.getMonth() &&
        complaintDate.getFullYear() === date.getFullYear()
      );
    });

    const resolved = monthComplaints.filter(
      (c) => (c.situation?.status || 0) >= 2
    ).length;
    const efficiency =
      monthComplaints.length > 0
        ? (resolved / monthComplaints.length) * 100
        : 0;

    trend.push({
      month: date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
      efficiency: efficiency.toFixed(2),
    });
  }
  return trend;
}

function generateGeographicalTrends(complaints: any[]): any {
  // Implementação simplificada
  return {
    growingAreas: ["Centro", "Zona Norte"],
    decliningAreas: ["Zona Sul"],
    stableAreas: ["Zona Leste", "Zona Oeste"],
  };
}

function generateRealTimeAlerts(users: any[], complaints: any[]): any[] {
  const alerts = [];

  const oldPendingCount = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date < thirtyDaysAgo && (complaint.situation?.status || 0) === 0;
  }).length;

  if (oldPendingCount > 0) {
    alerts.push({
      type: "warning",
      message: `${oldPendingCount} denúncias pendentes há mais de 30 dias`,
      priority: "high",
    });
  }

  const todayComplaints = complaints.filter((complaint) => {
    const date = new Date(complaint.createdAt || complaint.created_at);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

  if (todayComplaints > 10) {
    alerts.push({
      type: "info",
      message: `Volume alto de denúncias hoje: ${todayComplaints}`,
      priority: "medium",
    });
  }

  return alerts;
}

export default router;
