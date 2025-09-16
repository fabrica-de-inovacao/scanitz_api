import { Router } from "express";
import firestore, { db } from "../../database/firebase";
import {
  authenticateFirebaseToken,
  requireOwnership,
  optionalAuthentication,
} from "../../middleware/auth";

const router = Router();

// Lista todos os usuários (protegido - só usuários autenticados)
router.get("/", authenticateFirebaseToken, async (req, res) => {
  try {
    const usersSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );

    if (!usersSnapshot) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Nenhum usuário encontrado 😿",
      });
    } else {
      // Não retornar dados sensíveis na lista geral
      const listUsers = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        fullName: doc.data().fullName,
        // CPF e telefone removidos da lista por segurança
      }));

      res.json({
        success: true,
        statuscode: 200,
        data: listUsers,
        meta: {
          total: listUsers.length,
          authenticatedUser: req.user?.uid,
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

// Busca um usuário pelo id (protegido - apenas próprios dados)
router.get(
  "/:uid",
  authenticateFirebaseToken,
  requireOwnership("uid"),
  async (req, res) => {
    const { uid } = req.params;

    try {
      const userDoc = await firestore.getDoc(firestore.doc(db, "users", uid));

      if (!userDoc.exists()) {
        res.status(404).json({
          success: false,
          statuscode: 404,
          message: "Usuário não encontrado 😿",
        });
      } else {
        const userData = {
          uid: userDoc.id,
          ...userDoc.data(),
          // Dados completos pois é o próprio usuário
        };

        res.status(200).json({
          success: true,
          statuscode: 200,
          data: userData,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Ops...erro interno no servidor 😿",
      });
    }
  }
);

// Buscar todas as denúncias de um usuário pelo uid (protegido - apenas próprias)
router.get(
  "/:uid/complaints",
  authenticateFirebaseToken,
  requireOwnership("uid"),
  async (req, res) => {
    const { uid } = req.params;

    try {
      const userComplaintsSnapshot = await firestore.getDocs(
        firestore.query(
          firestore.collection(db, "complaints"),
          firestore.where("userId", "==", uid)
        )
      );

      const userComplaints = userComplaintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: userComplaints,
        meta: {
          total: userComplaints.length,
          userId: uid,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Ops...erro interno no servidor 😿 || erro: " + error,
      });
    }
  }
);

export default router;
