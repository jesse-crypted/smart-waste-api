
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// admin.initializeApp();

// exports.updateBinStatus = functions.https.onRequest(async (req, res) => {
//   const {binId, fillLevel} = req.body;

//   if (!binId || fillLevel === undefined) {
//     return res.status(400).json({error: "Missing binId or fillLevel"});
//   }

//   const isFull = fillLevel >= 90;

//   try {
//     await admin.firestore().collection("bins").doc(binId).update({
//       fillLevel,
//       isFull,
//       lastUpdated: admin.firestore.Timestamp.now(),
//     });
//     return res.status(200).json({success: true});
//   } catch (error) {
//     return res.status(500).json({error: error.message});
//   }
// });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(), // Assumes you're using GOOGLE_APPLICATION_CREDENTIALS
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

  await binRef.set(
    {
      fillLevel,
      isFull,
      lastUpdated: new Date(),
    },
    { merge: true }
  );

  return res.status(200).json({ message: 'Bin updated successfully' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
