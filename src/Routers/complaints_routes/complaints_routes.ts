import { Router } from "express";
import searchComplaints from "./search_complaints";
import { db } from "../../database/firebase";
import * as firestore from "firebase/firestore";

const RouterComplaints = Router();

//endpoint específico para dados de mapa de calor otimizado (DEVE vir ANTES das rotas com parâmetros)
RouterComplaints.get("/heatmap", async (req, res) => {
  try {
    const {
      bounds, // {north, south, east, west} - opcional para filtrar por região
      zoom = 10, // nível de zoom para clustering
      status = "all", // all, pending, progress, resolved
    } = req.query;

    // Buscar todas as denúncias com coordenadas
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (complaintsSnapshot.empty) {
      return res.status(200).json({
        success: true,
        statuscode: 200,
        data: {
          points: [],
          clusters: [],
          summary: { total: 0, byStatus: {} },
        },
      });
    }

    let complaints = complaintsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          latitude: data.address?.latitude,
          longitude: data.address?.longitude,
          status: data.situation?.status || 0,
          title:
            data.description?.substring(0, 50) +
              (data.description?.length > 50 ? "..." : "") || "Sem descrição",
          description: data.description || "Sem descrição",
          district: data.address?.district || "Não informado",
          city: data.address?.city || "Não informado",
          state: data.address?.state || "Não informado",
          postalCode: data.address?.postalCode || "",
          fallbackName: data.address?.fallbackName || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          userId: data.userId,
          userName: data.userName || "Usuário não identificado",
          similarCount: data.similarCount || 0,
        };
      })
      .filter((complaint) => complaint.latitude && complaint.longitude);

    // Filtrar por status se especificado
    if (status !== "all") {
      const statusMap = { pending: 0, progress: 1, resolved: 2 };
      const statusValue = statusMap[status as string];
      if (statusValue !== undefined) {
        complaints = complaints.filter((c) => c.status === statusValue);
      }
    }

    // Filtrar por bounds se especificado
    if (bounds) {
      const { north, south, east, west } = bounds as any;
      complaints = complaints.filter(
        (c) =>
          c.latitude <= north &&
          c.latitude >= south &&
          c.longitude <= east &&
          c.longitude >= west
      );
    }

    // Gerar dados otimizados para heatmap
    const heatmapData = {
      // Pontos individuais para zoom alto
      points: complaints.map((c) => ({
        lat: c.latitude,
        lng: c.longitude,
        weight: c.status === 0 ? 3 : c.status === 1 ? 2 : 1, // Dar mais peso para pendentes
        status: c.status,
        id: c.id,
        title: c.title,
        district: c.district,
      })),

      // Clusters para zoom baixo
      clusters: generateClusters(complaints, zoom as number),

      // Estatísticas
      summary: {
        total: complaints.length,
        byStatus: {
          pending: complaints.filter((c) => c.status === 0).length,
          progress: complaints.filter((c) => c.status === 1).length,
          resolved: complaints.filter((c) => c.status === 2).length,
        },
        byDistrict: generateDistrictStats(complaints),
        center: calculateCenter(complaints),
        bounds: calculateBounds(complaints),
      },
    };

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: heatmapData,
      meta: {
        total: complaints.length,
        generated_at: new Date().toISOString(),
        zoom_level: zoom,
        filtered_by: status !== "all" ? status : null,
      },
    });
  } catch (error) {
    console.error("Erro no endpoint heatmap:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor ao gerar dados do mapa de calor",
    });
  }
});

// Incluir outras rotas de complaints DEPOIS do heatmap (para evitar conflito com /:id)
RouterComplaints.use("/", searchComplaints);

// Funções auxiliares para o heatmap
function generateClusters(complaints: any[], zoom: number): any[] {
  // Algoritmo simples de clustering baseado em proximidade
  const clusters: any[] = [];
  const processed = new Set();
  const clusterRadius = getClusterRadius(zoom);

  complaints.forEach((complaint, index) => {
    if (processed.has(index)) return;

    const cluster = {
      lat: complaint.latitude,
      lng: complaint.longitude,
      count: 1,
      points: [complaint],
      status_breakdown: { pending: 0, progress: 0, resolved: 0 },
    };

    // Incrementar contadores de status
    const statusKey =
      complaint.status === 0
        ? "pending"
        : complaint.status === 1
        ? "progress"
        : "resolved";
    cluster.status_breakdown[statusKey]++;

    // Procurar pontos próximos para agrupar
    complaints.forEach((other, otherIndex) => {
      if (otherIndex === index || processed.has(otherIndex)) return;

      const distance = calculateDistance(
        complaint.latitude,
        complaint.longitude,
        other.latitude,
        other.longitude
      );

      if (distance <= clusterRadius) {
        cluster.count++;
        cluster.points.push(other);
        processed.add(otherIndex);

        // Atualizar contadores
        const otherStatusKey =
          other.status === 0
            ? "pending"
            : other.status === 1
            ? "progress"
            : "resolved";
        cluster.status_breakdown[otherStatusKey]++;

        // Recalcular centro do cluster
        cluster.lat =
          cluster.points.reduce((sum, p) => sum + p.latitude, 0) /
          cluster.points.length;
        cluster.lng =
          cluster.points.reduce((sum, p) => sum + p.longitude, 0) /
          cluster.points.length;
      }
    });

    clusters.push(cluster);
    processed.add(index);
  });

  return clusters;
}

function getClusterRadius(zoom: number): number {
  // Raio de clustering baseado no zoom (em km)
  const radiusMap: { [key: number]: number } = {
    1: 50,
    2: 25,
    3: 15,
    4: 10,
    5: 7,
    6: 5,
    7: 3,
    8: 2,
    9: 1.5,
    10: 1,
    11: 0.7,
    12: 0.5,
    13: 0.3,
    14: 0.2,
    15: 0.1,
  };
  return radiusMap[zoom] || 1;
}

function generateDistrictStats(complaints: any[]): any {
  const stats: { [key: string]: any } = {};

  complaints.forEach((complaint) => {
    const district = complaint.district || "Não informado";
    if (!stats[district]) {
      stats[district] = { total: 0, pending: 0, progress: 0, resolved: 0 };
    }

    stats[district].total++;
    if (complaint.status === 0) stats[district].pending++;
    else if (complaint.status === 1) stats[district].progress++;
    else stats[district].resolved++;
  });

  return Object.entries(stats)
    .map(([district, data]) => ({ district, ...data }))
    .sort((a, b) => b.total - a.total);
}

function calculateCenter(complaints: any[]): { lat: number; lng: number } {
  if (complaints.length === 0) return { lat: -5.5292, lng: -47.4622 }; // Imperatriz center

  const avgLat =
    complaints.reduce((sum, c) => sum + c.latitude, 0) / complaints.length;
  const avgLng =
    complaints.reduce((sum, c) => sum + c.longitude, 0) / complaints.length;

  return { lat: avgLat, lng: avgLng };
}

function calculateBounds(complaints: any[]): any {
  if (complaints.length === 0) return null;

  return {
    north: Math.max(...complaints.map((c) => c.latitude)),
    south: Math.min(...complaints.map((c) => c.latitude)),
    east: Math.max(...complaints.map((c) => c.longitude)),
    west: Math.min(...complaints.map((c) => c.longitude)),
  };
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default RouterComplaints;
