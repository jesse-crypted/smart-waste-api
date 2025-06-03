const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load service account JSON from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST endpoint to receive bin updates
app.post('/api/bin-update', async (req, res) => {
  const { binId, fillLevel } = req.body;

  if (!binId || fillLevel == null) {
    return res.status(400).json({ error: 'Missing binId or fillLevel' });
  }

  const isFull = fillLevel >= 90;
  const binRef = db.collection('bins').doc(binId);

  try {
    await binRef.set(
      {
        fillLevel,
        isFull,
        lastUpdated: new Date(),
      },
      { merge: true }
    );
    return res.status(200).json({ message: 'Bin updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
