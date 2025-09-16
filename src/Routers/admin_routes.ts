import express from "express";
import * as firestore from "firebase/firestore";
import { db } from "../database/firebase";
import optionalAuthentication from "./auth/auth_functions";

const router = express.Router();

// Middleware básico de verificação de admin (implementação simplificada)
interface AdminRequest extends express.Request {
  adminUser?: any;
  user?: any;
}

const requireAdmin = async (req: AdminRequest, res: any, next: any) => {
  // Por simplicidade, considerar usuários verificados como admins
  // Em produção, usar uma verificação mais robusta
  if (!req.user) {
    return res.status(401).json({
      success: false,
      statuscode: 401,
      message: "Acesso negado: autenticação necessária",
    });
  }

  try {
    const userDoc = await firestore.getDoc(
      firestore.doc(db, "users", req.user.uid)
    );

    if (!userDoc.exists()) {
      return res.status(403).json({
        success: false,
        statuscode: 403,
        message: "Acesso negado: usuário não encontrado",
      });
    }

    const userData = userDoc.data();

    // Verificação básica - em produção usar role/permission system
    if (!userData.verified || (userData.complaintsCount || 0) < 5) {
      return res.status(403).json({
        success: false,
        statuscode: 403,
        message: "Acesso negado: privilégios administrativos necessários",
      });
    }

    req.adminUser = userData;
    next();
  } catch (error) {
    console.error("Erro na verificação de admin:", error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Erro na verificação de privilégios",
    });
  }
};

// Rota base do painel administrativo
router.get("/", (req: AdminRequest, res) => {
  res.json({
    success: true,
    statuscode: 200,
    data: {
      message: "ScanITZ Admin Panel API",
      version: "1.0.0",
      endpoints: {
        users: "/api/v1/admin/users",
        complaints: "/api/v1/admin/complaints",
        moderation: "/api/v1/admin/moderation",
        audit: "/api/v1/admin/audit",
        system: "/api/v1/admin/system",
      },
      features: [
        "User Management",
        "Complaint Moderation",
        "System Monitoring",
        "Audit Logging",
      ],
    },
  });
});

// Listar todos os usuários com filtros administrativos
router.get(
  "/users",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    const {
      page = 1,
      limit = 25,
      status = "all", // 'all', 'verified', 'unverified', 'active', 'inactive'
      sortBy = "created_at",
      order = "desc",
      search,
    } = req.query;

    try {
      const usersSnapshot = await firestore.getDocs(
        firestore.collection(db, "users")
      );

      let users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Aplicar filtros
      if (status !== "all") {
        switch (status) {
          case "verified":
            users = users.filter((user) => user.verified);
            break;
          case "unverified":
            users = users.filter((user) => !user.verified);
            break;
          case "active":
            users = users.filter((user) => (user.complaintsCount || 0) > 0);
            break;
          case "inactive":
            users = users.filter((user) => (user.complaintsCount || 0) === 0);
            break;
        }
      }

      // Busca por texto
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        users = users.filter(
          (user) =>
            (user.fullName || "").toLowerCase().includes(searchTerm) ||
            (user.email || "").toLowerCase().includes(searchTerm)
        );
      }

      // Ordenação
      users.sort((a, b) => {
        const aValue = a[sortBy as string] || "";
        const bValue = b[sortBy as string] || "";

        if (order === "desc") {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Paginação
      const startIndex =
        (parseInt(page as string) - 1) * parseInt(limit as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Dados administrativos detalhados
      const adminUsers = paginatedUsers.map((user) => ({
        id: user.id,
        fullName: user.fullName || "Não informado",
        email: user.email,
        verified: user.verified || false,
        complaintsCount: user.complaintsCount || 0,
        createdAt: user.created_at || user.createdAt,
        lastActive: user.lastActive || user.updated_at,
        photoURL: user.photoURL,
        metadata: {
          ipAddress: user.ipAddress || "N/A",
          userAgent: user.userAgent || "N/A",
          registrationSource: user.registrationSource || "app",
        },
        flags: {
          isSuspicious: (user.complaintsCount || 0) > 20, // Muitas denúncias
          needsVerification: !user.verified && (user.complaintsCount || 0) > 3,
          isVIP: user.verified && (user.complaintsCount || 0) > 10,
        },
      }));

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: {
          users: adminUsers,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: users.length,
            totalPages: Math.ceil(users.length / parseInt(limit as string)),
          },
          summary: {
            total: users.length,
            verified: users.filter((u) => u.verified).length,
            active: users.filter((u) => (u.complaintsCount || 0) > 0).length,
            suspicious: users.filter((u) => (u.complaintsCount || 0) > 20)
              .length,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao listar usuários administrativos:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao carregar dados administrativos dos usuários 😿",
      });
    }
  }
);

// Atualizar status de usuário (verificar, suspender, etc.)
router.patch(
  "/users/:userId",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    const { userId } = req.params;
    const { action, reason } = req.body;

    const allowedActions = [
      "verify",
      "unverify",
      "suspend",
      "unsuspend",
      "delete",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message:
          "Ação inválida. Ações permitidas: verify, unverify, suspend, unsuspend, delete",
      });
    }

    try {
      const userRef = firestore.doc(db, "users", userId);
      const userDoc = await firestore.getDoc(userRef);

      if (!userDoc.exists()) {
        return res.status(404).json({
          success: false,
          statuscode: 404,
          message: "Usuário não encontrado",
        });
      }

      const updates: any = {
        updated_at: new Date().toISOString(),
        adminAction: {
          action: action,
          adminId: req.user.uid,
          adminName: req.adminUser.fullName || req.adminUser.email,
          reason: reason || "Ação administrativa",
          timestamp: new Date().toISOString(),
        },
      };

      switch (action) {
        case "verify":
          updates.verified = true;
          break;
        case "unverify":
          updates.verified = false;
          break;
        case "suspend":
          updates.suspended = true;
          updates.suspendedAt = new Date().toISOString();
          break;
        case "unsuspend":
          updates.suspended = false;
          updates.suspendedAt = null;
          break;
        case "delete":
          // Em vez de deletar, marcar como deletado
          updates.deleted = true;
          updates.deletedAt = new Date().toISOString();
          break;
      }

      await firestore.updateDoc(userRef, updates);

      // Log da ação administrativa
      await firestore.addDoc(firestore.collection(db, "admin_logs"), {
        type: "user_action",
        action: action,
        targetUserId: userId,
        adminId: req.user.uid,
        adminName: req.adminUser.fullName || req.adminUser.email,
        reason: reason || "Ação administrativa",
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      });

      res.status(200).json({
        success: true,
        statuscode: 200,
        message: `Ação '${action}' executada com sucesso`,
        data: {
          userId: userId,
          action: action,
          executedBy: req.adminUser.fullName || req.adminUser.email,
          timestamp: updates.updated_at,
        },
      });
    } catch (error) {
      console.error("Erro na ação administrativa:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao executar ação administrativa 😿",
      });
    }
  }
);

// Listar denúncias com controles administrativos
router.get(
  "/complaints",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    const {
      page = 1,
      limit = 25,
      status = "all",
      priority = "all",
      flagged = "all",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    try {
      const complaintsSnapshot = await firestore.getDocs(
        firestore.collection(db, "complaints")
      );

      let complaints = complaintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Aplicar filtros administrativos
      if (status !== "all") {
        const statusMap = {
          pending: 0,
          in_progress: 1,
          resolved: 2,
          closed: 3,
        };
        complaints = complaints.filter(
          (c) =>
            (c.situation?.status || 0) ===
            statusMap[status as keyof typeof statusMap]
        );
      }

      // Filtro por prioridade calculada
      if (priority !== "all") {
        complaints = complaints.filter((complaint) => {
          const calcPriority = calculateComplaintPriority(complaint);
          return calcPriority === priority;
        });
      }

      // Filtro por denúncias sinalizadas
      if (flagged === "true") {
        complaints = complaints.filter((c) => c.flagged || c.similarCount > 5);
      }

      // Ordenação
      complaints.sort((a, b) => {
        const aValue = a[sortBy as string] || "";
        const bValue = b[sortBy as string] || "";

        if (order === "desc") {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Paginação
      const startIndex =
        (parseInt(page as string) - 1) * parseInt(limit as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedComplaints = complaints.slice(startIndex, endIndex);

      // Enriquecer dados para administradores
      const adminComplaints = await Promise.all(
        paginatedComplaints.map(async (complaint) => {
          // Buscar dados do usuário
          let userData = null;
          try {
            const userDoc = await firestore.getDoc(
              firestore.doc(db, "users", complaint.userId)
            );
            if (userDoc.exists()) {
              const user = userDoc.data();
              userData = {
                id: complaint.userId,
                name: user.fullName || user.email,
                email: user.email,
                verified: user.verified,
                complaintsCount: user.complaintsCount || 0,
              };
            }
          } catch (error) {
            console.warn("Erro ao buscar dados do usuário:", error);
          }

          return {
            id: complaint.id,
            description: complaint.description,
            status: complaint.situation?.status || 0,
            address: complaint.address,
            imageUrl: complaint.imageUrl,
            thumbnailUrl: complaint.thumbnailUrl,
            createdAt: complaint.createdAt || complaint.created_at,
            updatedAt: complaint.updatedAt || complaint.updated_at,
            user: userData,
            admin: {
              priority: calculateComplaintPriority(complaint),
              category: categorizeComplaint(complaint.description || ""),
              similarCount: complaint.similarCount || 0,
              flagged: complaint.flagged || false,
              moderationNotes: complaint.moderationNotes || [],
              lastModerated: complaint.lastModerated,
              flags: {
                needsAttention:
                  (complaint.situation?.status || 0) === 0 &&
                  getDaysOld(complaint.createdAt || complaint.created_at) > 7,
                highVolume: (complaint.similarCount || 0) > 3,
                hasImage: !!complaint.imageUrl,
                longDescription: (complaint.description?.length || 0) > 200,
              },
            },
          };
        })
      );

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: {
          complaints: adminComplaints,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: complaints.length,
            totalPages: Math.ceil(
              complaints.length / parseInt(limit as string)
            ),
          },
          summary: {
            total: complaints.length,
            pending: complaints.filter((c) => (c.situation?.status || 0) === 0)
              .length,
            inProgress: complaints.filter(
              (c) => (c.situation?.status || 0) === 1
            ).length,
            resolved: complaints.filter((c) => (c.situation?.status || 0) >= 2)
              .length,
            flagged: complaints.filter(
              (c) => c.flagged || (c.similarCount || 0) > 5
            ).length,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao listar denúncias administrativas:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao carregar dados administrativos das denúncias 😿",
      });
    }
  }
);

// Atualizar status de denúncia ou moderar conteúdo
router.patch(
  "/complaints/:complaintId",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    const { complaintId } = req.params;
    const { action, status, reason, moderationNote } = req.body;

    try {
      const complaintRef = firestore.doc(db, "complaints", complaintId);
      const complaintDoc = await firestore.getDoc(complaintRef);

      if (!complaintDoc.exists()) {
        return res.status(404).json({
          success: false,
          statuscode: 404,
          message: "Denúncia não encontrada",
        });
      }

      const updates: any = {
        updatedAt: new Date().toISOString(),
        adminAction: {
          action: action,
          adminId: req.user.uid,
          adminName: req.adminUser.fullName || req.adminUser.email,
          reason: reason || "Ação administrativa",
          timestamp: new Date().toISOString(),
        },
      };

      // Ações específicas
      switch (action) {
        case "update_status":
          if (status !== undefined) {
            updates["situation.status"] = parseInt(status);
          }
          break;
        case "flag":
          updates.flagged = true;
          updates.flaggedAt = new Date().toISOString();
          break;
        case "unflag":
          updates.flagged = false;
          updates.flaggedAt = null;
          break;
        case "moderate":
          if (moderationNote) {
            const existingNotes = complaintDoc.data().moderationNotes || [];
            updates.moderationNotes = [
              ...existingNotes,
              {
                note: moderationNote,
                adminId: req.user.uid,
                adminName: req.adminUser.fullName || req.adminUser.email,
                timestamp: new Date().toISOString(),
              },
            ];
          }
          updates.lastModerated = new Date().toISOString();
          break;
        case "delete":
          updates.deleted = true;
          updates.deletedAt = new Date().toISOString();
          break;
      }

      await firestore.updateDoc(complaintRef, updates);

      // Log da ação
      await firestore.addDoc(firestore.collection(db, "admin_logs"), {
        type: "complaint_action",
        action: action,
        targetComplaintId: complaintId,
        adminId: req.user.uid,
        adminName: req.adminUser.fullName || req.adminUser.email,
        reason: reason || "Ação administrativa",
        newStatus: status,
        moderationNote: moderationNote,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        statuscode: 200,
        message: `Ação '${action}' executada com sucesso`,
        data: {
          complaintId: complaintId,
          action: action,
          newStatus: status,
          executedBy: req.adminUser.fullName || req.adminUser.email,
        },
      });
    } catch (error) {
      console.error("Erro na ação administrativa de denúncia:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao executar ação administrativa na denúncia 😿",
      });
    }
  }
);

// Logs de auditoria
router.get(
  "/audit-logs",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    const {
      page = 1,
      limit = 50,
      type = "all",
      adminId,
      startDate,
      endDate,
    } = req.query;

    try {
      const logsSnapshot = await firestore.getDocs(
        firestore.collection(db, "admin_logs")
      );

      let logs = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Filtros
      if (type !== "all") {
        logs = logs.filter((log) => log.type === type);
      }

      if (adminId) {
        logs = logs.filter((log) => log.adminId === adminId);
      }

      if (startDate) {
        logs = logs.filter(
          (log) => new Date(log.timestamp) >= new Date(startDate as string)
        );
      }

      if (endDate) {
        logs = logs.filter(
          (log) => new Date(log.timestamp) <= new Date(endDate as string)
        );
      }

      // Ordenar por data (mais recente primeiro)
      logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Paginação
      const startIndex =
        (parseInt(page as string) - 1) * parseInt(limit as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedLogs = logs.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: {
          logs: paginatedLogs,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: logs.length,
            totalPages: Math.ceil(logs.length / parseInt(limit as string)),
          },
          summary: {
            totalActions: logs.length,
            userActions: logs.filter((log) => log.type === "user_action")
              .length,
            complaintActions: logs.filter(
              (log) => log.type === "complaint_action"
            ).length,
            uniqueAdmins: [...new Set(logs.map((log) => log.adminId))].length,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao carregar logs de auditoria:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao carregar logs de auditoria 😿",
      });
    }
  }
);

// Configurações do sistema
router.get(
  "/system-config",
  optionalAuthentication,
  requireAdmin,
  async (req: AdminRequest, res) => {
    try {
      // Configurações básicas do sistema
      const config = {
        system: {
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
          maintainanceMode: false,
          lastBackup: "2024-01-01T00:00:00Z", // Mock
        },
        features: {
          userRegistration: true,
          complaintSubmission: true,
          emailNotifications: true,
          pushNotifications: false,
          geoLocation: true,
          imageUpload: true,
        },
        limits: {
          maxComplaintsPerDay: 10,
          maxImageSizeMB: 5,
          maxDescriptionLength: 500,
          searchResultsLimit: 100,
        },
        moderation: {
          autoModeration: false,
          requireApproval: false,
          flagThreshold: 3,
          suspiciousActivityThreshold: 20,
        },
        notifications: {
          adminEmail: process.env.ADMIN_EMAIL || "admin@scanitz.com",
          newComplaintAlert: true,
          systemHealthAlert: true,
          weeklyReport: true,
        },
      };

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: config,
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Erro ao carregar configurações do sistema 😿",
      });
    }
  }
);

// Funções auxiliares
function calculateComplaintPriority(
  complaint: any
): "low" | "medium" | "high" | "urgent" {
  let score = 0;

  if (complaint.imageUrl) score += 1;
  if (complaint.similarCount > 3) score += 2;
  if (
    complaint.description?.includes("urgente") ||
    complaint.description?.includes("perigo")
  )
    score += 3;

  if (complaint.createdAt) {
    const daysOpen = getDaysOld(complaint.createdAt);
    if (daysOpen > 30) score += 2;
    if (daysOpen > 90) score += 3;
  }

  if (score >= 6) return "urgent";
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
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

function getDaysOld(dateString: string): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default router;
