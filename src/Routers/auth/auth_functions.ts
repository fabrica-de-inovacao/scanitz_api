import { Router } from "express";
import firestore, { auth, db } from "../../database/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (!userCredential) {
      res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Ops... credenciais inválidas ou não encontradas 😿",
      });
    } else {
      const docRef = await firestore.collection(db, "users");
      const userCollectionSnapshot = await firestore.getDocs(docRef);
      let userCollectionData = [];
      userCollectionSnapshot.docs.map((doc) => {
        doc.id === userCredential.user.uid
          ? userCollectionData.push(doc.data())
          : null;
      });

      const userData = {
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        fullName: userCollectionData[0].fullName,
        email: userCredential.user.email,
        phoneNumber: userCredential.user.phoneNumber,
        documentNumber: userCollectionData[0].documentNumber
          .replaceAll(".", "")
          .replaceAll("-", ""),
        photoURL: userCredential.user.photoURL,
        token: userCredential.user["stsTokenManager"]["accessToken"],
      };
      res.status(200).json({ success: true, statuscode: 200, data: userData });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿 || erro: " + error,
    });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, fullName, documentNumber, phoneNumber } = req.body;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      fullName: fullName,
      phoneNumber: phoneNumber,
      documentNumber: documentNumber,
    };

    await firestore.setDoc(
      firestore.doc(db, "users", userCredential.user.uid),
      userData
    );

    res.status(201).json({
      success: true,
      statuscode: 201,
      data: userCredential,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Ops...erro interno no servidor 😿 || erro: " + error,
    });
  }
});

export default router;
