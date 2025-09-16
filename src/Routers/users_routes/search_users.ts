import { Router } from "express";
import firestore, { db } from "../../database/firebase";
import {
  authenticateFirebaseToken,
  optionalAuthentication,
} from "../../middleware/auth";

const router = Router();

//lista todos os usuarios com filtros avançados (protegido - apenas usuários autenticados)
router.get("/", authenticateFirebaseToken, async (req, res) => {
  try {
    // Query parameters para filtros e paginação
    const {
      page = "1",
      limit = "50",
      search = "",
      orderBy = "created_at",
      order = "desc",
      status = "all",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Buscar todos os usuários primeiro (Firebase Firestore limitações)
    const usersSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );

    if (usersSnapshot.empty) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhum usuário encontrado 😿",
      });
    }

    // Mapear e aplicar filtros
    let allUsers: any[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at || new Date(), // garantir campo de data
    }));

    // Filtro de busca por nome, email ou CPF
    if (search) {
      const searchLower = (search as string).toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          (user.fullName &&
            user.fullName.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.cpf && user.cpf.includes(searchLower))
      );
    }

    // Filtro por status (se tiver campo status)
    if (status !== "all") {
      allUsers = allUsers.filter((user) => user.status === status);
    }

    // Ordenação
    allUsers.sort((a, b) => {
      let aValue = a[orderBy as string];
      let bValue = b[orderBy as string];

      // Tratar datas
      if (orderBy === "created_at") {
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
    const totalUsers = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + limitNum);

    // Contar denúncias para cada usuário (para estatísticas)
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    const userComplaintsCounts: any = {};
    complaintsSnapshot.docs.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) {
        userComplaintsCounts[userId] = (userComplaintsCounts[userId] || 0) + 1;
      }
    });

    // Adicionar estatísticas básicas a cada usuário
    const usersWithStats = paginatedUsers.map((user) => ({
      ...user,
      statistics: {
        totalComplaints: userComplaintsCounts[user.id] || 0,
        joinedDaysAgo: user.created_at
          ? Math.floor(
              (new Date().getTime() - new Date(user.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      },
    }));

    res.json({
      success: true,
      statuscode: 200,
      data: usersWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers: totalUsers,
        usersPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
        hasPrevPage: pageNum > 1,
      },
      filters: {
        search,
        orderBy,
        order,
        status,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

//estatísticas gerais de usuários (protegido)
router.get("/stats", authenticateFirebaseToken, async (req, res) => {
  try {
    const usersSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (usersSnapshot.empty) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhum usuário encontrado 😿",
      });
    }

    const allUsers: any[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const allComplaints: any[] = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calcular estatísticas
    const totalUsers = allUsers.length;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Usuários novos este mês
    const newUsersThisMonth = allUsers.filter((user) => {
      if (!user.created_at) return false;
      const userDate = new Date(user.created_at);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    // Usuários ativos (que fizeram denúncias nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentComplaints = allComplaints.filter((complaint) => {
      if (!complaint.created_at) return false;
      return new Date(complaint.created_at) > thirtyDaysAgo;
    });

    const activeUserIds = [...new Set(recentComplaints.map((c) => c.userId))];
    const activeUsers = activeUserIds.length;

    // Usuários por bairro
    const usersByDistrict: any = {};
    allUsers.forEach((user) => {
      if (user.address && user.address.district) {
        const district = user.address.district;
        usersByDistrict[district] = (usersByDistrict[district] || 0) + 1;
      }
    });

    const usersByDistrictArray = Object.entries(usersByDistrict)
      .map(([district, count]) => ({ district, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10); // Top 10 bairros

    // Gráfico de crescimento de usuários (últimos 6 meses)
    const userGrowthChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthUsers = allUsers.filter((user) => {
        if (!user.created_at) return false;
        const userDate = new Date(user.created_at);
        return (
          userDate.getMonth() === date.getMonth() &&
          userDate.getFullYear() === date.getFullYear()
        );
      }).length;

      userGrowthChart.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM format
        count: monthUsers,
      });
    }

    res.json({
      success: true,
      statuscode: 200,
      data: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        usersByDistrict: usersByDistrictArray,
        userGrowthChart,
        insights: {
          growthRate:
            newUsersThisMonth > 0
              ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) + "%"
              : "0%",
          activeUsersPercentage:
            totalUsers > 0
              ? ((activeUsers / totalUsers) * 100).toFixed(2) + "%"
              : "0%",
          topDistrict:
            usersByDistrictArray.length > 0
              ? usersByDistrictArray[0].district
              : "N/A",
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de usuários:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor 😿",
    });
  }
});

//usuários mais ativos/contribuidores (protegido)
router.get("/top-contributors", authenticateFirebaseToken, async (req, res) => {
  try {
    const { limit = "10" } = req.query;
    const limitNum = parseInt(limit as string);

    const usersSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (usersSnapshot.empty) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhum usuário encontrado 😿",
      });
    }

    const allUsers: any[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const allComplaints: any[] = complaintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calcular pontuação para cada usuário
    const userStats = allUsers.map((user) => {
      const userComplaints = allComplaints.filter((c) => c.userId === user.id);
      const resolvedComplaints = userComplaints.filter(
        (c) => c.situation?.status === 2 || c.situation?.status === 3
      );

      // Sistema de pontuação:
      // - 1 ponto por denúncia
      // - 3 pontos por denúncia resolvida
      // - Bônus por tempo de conta (1 ponto por mês)
      const complaintsScore = userComplaints.length * 1;
      const resolvedScore = resolvedComplaints.length * 3;

      let timeBonus = 0;
      if (user.created_at) {
        const accountAgeMonths = Math.floor(
          (new Date().getTime() - new Date(user.created_at).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        );
        timeBonus = Math.min(accountAgeMonths, 12); // máximo 12 pontos
      }

      const totalScore = complaintsScore + resolvedScore + timeBonus;

      return {
        uid: user.id,
        name: user.fullName || user.email || "Usuário",
        email: user.email,
        totalComplaints: userComplaints.length,
        resolvedComplaints: resolvedComplaints.length,
        score: totalScore,
        joinedDate: user.created_at,
        avatar: user.photoURL || null,
      };
    });

    // Ordenar por pontuação e pegar os top contributors
    const topContributors = userStats
      .filter((user) => user.totalComplaints > 0) // apenas usuários com denúncias
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum);

    res.json({
      success: true,
      statuscode: 200,
      data: topContributors,
      meta: {
        total: topContributors.length,
        scoring: {
          complaintPoints: 1,
          resolvedPoints: 3,
          maxTimeBonus: 12,
          explanation:
            "Pontuação baseada em denúncias criadas, resolvidas e tempo de conta",
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar top contributors:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro interno no servidor 😿",
    });
  }
});

//busca um usuario pelo id (protegido - apenas o próprio usuário ou admin)
router.get("/:uid", authenticateFirebaseToken, async (req, res) => {
  const { uid } = req.params;

  try {
    const userSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );
    if (!userSnapshot) {
      res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Ops... 😿",
      });
    } else {
      // Verificar se o usuário pode acessar este perfil (apenas o próprio)
      if (req.user?.uid !== uid) {
        return res.status(403).json({
          success: false,
          statuscode: 403,
          message: "Acesso negado: você só pode ver seu próprio perfil 🔒",
        });
      }

      let usuario;
      userSnapshot.docs.map((doc) =>
        doc.id.match(uid)
          ? doc.exists
            ? (usuario = { id: doc.id, ...doc.data() })
            : null
          : null
      );

      if (!usuario) {
        res.status(404).json({
          success: false,
          statuscode: 404,
          message: "Usuário não encontrado 😿",
        });
      } else {
        // Buscar estatísticas detalhadas do usuário
        const complaintsSnapshot = await firestore.getDocs(
          firestore.collection(db, "complaints")
        );

        const userComplaints: any[] = complaintsSnapshot.docs
          .filter((doc) => doc.data().userId === uid)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        // Calcular estatísticas
        const resolvedComplaints = userComplaints.filter(
          (c) => c.situation?.status === 2 || c.situation?.status === 3
        );
        const pendingComplaints = userComplaints.filter(
          (c) => c.situation?.status === 0 || c.situation?.status === 1
        );

        // Calcular tempo médio de resposta (aproximado)
        const complaintsWithDates = userComplaints.filter(
          (c) => c.created_at && c.updated_at
        );
        const averageResponseTime =
          complaintsWithDates.length > 0
            ? complaintsWithDates.reduce((acc, c) => {
                const created = new Date(c.created_at);
                const updated = new Date(c.updated_at);
                return acc + (updated.getTime() - created.getTime());
              }, 0) /
              complaintsWithDates.length /
              (1000 * 60 * 60 * 24) // em dias
            : 0;

        const joinedDate = usuario.created_at
          ? new Date(usuario.created_at)
          : new Date();
        const joinedDaysAgo = Math.floor(
          (new Date().getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Última atividade (última denúncia criada)
        const lastActivity =
          userComplaints.length > 0
            ? userComplaints.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )[0].created_at
            : usuario.created_at;

        const userWithStats = {
          ...usuario,
          statistics: {
            totalComplaints: userComplaints.length,
            resolvedComplaints: resolvedComplaints.length,
            pendingComplaints: pendingComplaints.length,
            averageResponseTime: Math.round(averageResponseTime * 100) / 100, // 2 casas decimais
            joinedDaysAgo: joinedDaysAgo,
            lastActivityDate: lastActivity,
            recentComplaints: userComplaints
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .slice(0, 5) // últimas 5 denúncias
              .map((c) => ({
                id: c.id,
                description:
                  c.description.substring(0, 100) +
                  (c.description.length > 100 ? "..." : ""),
                status: c.situation?.status || 0,
                created_at: c.created_at,
              })),
          },
        };

        res.status(200).json({
          success: true,
          statuscode: 200,
          data: userWithStats,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

//obter dados do usuário logado
router.get("/me", authenticateFirebaseToken, async (req, res) => {
  try {
    const userDoc = await firestore.getDoc(
      firestore.doc(db, "users", req.user!.uid)
    );

    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Usuário não encontrado no banco de dados 😿",
      });
    }

    res.status(200).json({
      success: true,
      statuscode: 200,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
        // Dados extras do Firebase Auth
        email: req.user!.email,
        email_verified: req.user!.email_verified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿",
    });
  }
});

//buscar todas as denuncias de um usuario pelo o uid (protegido)
router.get("/:uid/complaints", authenticateFirebaseToken, async (req, res) => {
  const { uid } = req.params;

  // Verificar se o usuário pode acessar estas denúncias (apenas as próprias)
  if (req.user?.uid !== uid) {
    return res.status(403).json({
      success: false,
      statuscode: 403,
      message: "Acesso negado: você só pode ver suas próprias denúncias 🔒",
    });
  }

  try {
    const userComplaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );
    if (!userComplaintsSnapshot) {
      res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Ops... 😿",
      });
    } else {
      let userComplaints = [];

      userComplaintsSnapshot.forEach((doc) => {
        doc.data()["userId"].match(uid)
          ? userComplaints.push({
              id: doc.id,
              ...doc.data(),
            })
          : null;
      });

      if (!userComplaints) {
        res.status(201).json({
          success: false,
          statuscode: 400,
          message: "Ops... UID inválido ou não encontrado 😿",
        });
      } else {
        res.status(200).json({
          success: true,
          statuscode: 200,
          data: userComplaints,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿 || erro: " + error,
    });
  }
});

export default router;
