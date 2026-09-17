const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const FIREBASE_API_KEY = 'AIzaSyD3vm6uUakGd9lBHjC7DYCGcZk2OKtgeP8';

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ projeto: 'Aplicativo de Rotina Escolar', mensagem: 'Servidor funcionando!' }));

app.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const usuario = await admin.auth().createUser({ email, password: senha });
    await db.collection('usuarios').doc(usuario.uid).set({ nome, email, criadoEm: new Date().toISOString() });
    res.json({ uid: usuario.uid, nome, email });
  } catch (erro) {
    res.status(400).json({ erro: 'Verifique os dados e tente novamente.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const resposta = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    });
    const dados = await resposta.json();
    if (dados.error) throw new Error();
    const doc = await db.collection('usuarios').doc(dados.localId).get();
    res.json({ uid: dados.localId, email, nome: doc.data()?.nome });
  } catch (erro) {
    res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
});

app.get('/agenda', async (req, res) => {
  const snapshot = await db.collection('agenda').get();
  res.json(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
});

app.post('/agenda', async (req, res) => {
  const { id, titulo, data, tipo } = req.body;
  await db.collection('agenda').doc(id).set({ titulo, data, tipo });
  res.json({ id });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
