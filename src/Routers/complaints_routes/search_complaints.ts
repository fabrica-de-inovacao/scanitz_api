import { Router } from "express";
import firestore, { db } from "../../database/firebase";
import { where } from "firebase/firestore";

const router = Router();

//lista todas as denuncias
router.get("/", async (req, res) => {
  try {
    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );

    //verifica se a lista esta vazia
    if (complaintsSnapshot.empty) {
      res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Ops... 😿",
      });
    } else {
      const listComplaints = complaintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json({
        success: true,
        statuscode: 200,
        data: listComplaints,
      });
    }
  } catch (error) {
    // Em caso de erro no servidor
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...😿",
    });
  }
});

//buscar todas as denuncias de um usuario pelo o uid
router.get("/:district", async (req, res) => {
  const { district } = req.params;

  try {
    const chave = district.replace(/\s+/g, "").toLowerCase();

    const complaintsSnapshot = await firestore.getDocs(
      firestore.collection(db, "complaints")
    );
    const districtComplaints = [];

    complaintsSnapshot.forEach((doc) => {
      const data = doc.data();
      const address = doc.data().address;

      if (address?.district) {
        const docDistrict = address.district.replace(/\s+/g, "").toLowerCase();

        if (docDistrict === chave) {
          districtComplaints.push({ id: doc.id, ...data });
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

export default router;
