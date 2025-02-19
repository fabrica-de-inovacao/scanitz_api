import { Router } from "express";
import firestore, { db } from "../../database/firebase";

const router = Router();

//lista todos os usuarios
router.get("/", async (req, res) => {
  try {
    const usersSnapshot = await firestore.getDocs(
      firestore.collection(db, "users")
    );

    if (!usersSnapshot) {
      res
        .status(201)
        .json({ success: false, statuscode: 201, message: "Ops... 😿" });
    } else {
      const listUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({
        success: true,
        statuscode: 200,
        data: listUsers,
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

//busca um usuario pelo id
router.get("/:uid", async (req, res) => {
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
      let usuario;
      userSnapshot.docs.map((doc) =>
        doc.id.match(uid)
          ? doc.exists
            ? (usuario = { id: doc.id, ...doc.data() })
            : null
          : null
      );

      if (!usuario) {
        res.status(400).json({
          success: false,
          statuscode: 400,
          message: "Ops... UID inválido ou não encontrado 😿",
        });
      } else {
        res.status(200).json({
          success: true,
          statuscode: 200,
          data: usuario,
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

//buscar todas as denuncias de um usuario pelo o uid
router.get("/:uid/complaints", async (req, res) => {
  const { uid } = req.params;

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
