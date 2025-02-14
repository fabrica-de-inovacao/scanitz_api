const admin = require('firebase-admin');
const express = require('express');

// Carregue o arquivo de credenciais do serviço
const serviceAccount = require('./src/firebase/scanitz-firebase-adminsdk-fmuhb-124bbee717.json');

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Obtenha a referência ao Firestore
const db = admin.firestore();

// Inicialize seu servidor Express
const app = express();

// Exemplo de uma rota para salvar dados no Firestore
app.post('/addData', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('your-collection').add(data);
    res.status(200).send(`Document added with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send(`Error adding document: ${error}`);
  }
});

// Inicialize o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
