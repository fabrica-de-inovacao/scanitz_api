import { Router } from "express";
import firestore, { db } from "../../database/firebase";
import {
  optionalAuthentication,
  authenticateFirebaseToken,
} from "../../middleware/auth";

const router = Router();

// Lista todas as denúncias (autenticação opcional - melhor UX se logado)
router.get("/", optionalAuthentication, async (req, res) => {
  try {
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    if (complaintsSnapshot.empty) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhuma denúncia encontrada 😿",
      });
    } else {
      const listComplaints = complaintsSnapshot.docs.map((doc) => {
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
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          // Dados sensíveis apenas para o dono
          ...(isOwner && {
            userName: data.userName,
            userId: data.userId,
            isOwner: true,
          }),
          // Dados extras se autenticado
          ...(req.user && {
            canEdit: isOwner,
            canReport: !isOwner,
          }),
        };
      });

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: listComplaints,
        meta: {
          total: listComplaints.length,
          authenticated: !!req.user,
          userComplaints: req.user
            ? listComplaints.filter((c) => c.isOwner).length
            : 0,
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

// Listar todas as posições das denúncias (público)
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
        .filter((pos) => pos.latitude && pos.longitude); // Filtrar apenas com coordenadas válidas

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

// Buscar denúncia pelo id (autenticação opcional - dados extras se for dono)
router.get("/:id", optionalAuthentication, async (req, res) => {
  const { id } = req.params;

  try {
    const complaintDoc = await firestore.getDoc(
      firestore.doc(db, "complaints", id)
    );

    if (!complaintDoc.exists()) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Denúncia não encontrada 😿",
      });
    } else {
      const data = complaintDoc.data();
      const isOwner = req.user && req.user.uid === data.userId;

      const complaint = {
        id: complaintDoc.id,
        description: data.description,
        address: data.address,
        situation: data.situation,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        similarCount: data.similarCount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Dados sensíveis apenas para o dono
        ...(isOwner && {
          userName: data.userName,
          userId: data.userId,
          isOwner: true,
        }),
        // Dados extras se autenticado
        ...(req.user && {
          canEdit: isOwner,
          canReport: !isOwner,
        }),
      };

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: complaint,
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

// Buscar todas as denúncias de um bairro (público)
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
      userId: req.user.uid,
      userName: req.user.email, // ou buscar do Firestore
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

export default router;
