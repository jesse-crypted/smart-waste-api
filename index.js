const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load service account JSON from environment variable
// Environment variables are preferred for sensitive credentials
const serviceAccountRaw = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Fix the private key by replacing escaped newlines with actual newlines
// This is necessary when storing the key as an environment variable
const serviceAccount = {
  ...serviceAccountRaw,
  private_key: serviceAccountRaw.private_key.replace(/\\n/g, '\n')
};

// Initialize Firebase Admin SDK with service account credentials
// This gives our server privileged access to Firebase services
initializeApp({
  credential: cert(serviceAccount),
});

// Get Firestore database instance
const db = getFirestore();

// Create Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

/**
 * POST endpoint to receive bin status updates
 * @route POST /api/bin-update
 * @param {string} binId - Unique identifier for the bin
 * @param {string} binName - Human-readable name/location of the bin
 * @param {number} fillLevel - Current fill percentage (0-100)
 * @returns {object} Success or error message
 */
app.post('/api/bin-update', async (req, res) => {
  const { binId, binName, fillLevel } = req.body;

  // Validate required parameters
  if (!binId || fillLevel == null || !binName) {
    return res.status(400).json({ error: 'Missing binId or fillLevel' });
  }

  // Determine if bin is considered full (threshold at 90%)
  const isFull = fillLevel >= 90;
  
  // Get reference to the specific bin document
  const binRef = db.collection('bins').doc(binId);

  try {
    // Update bin document with new data
    // Using merge: true to only update specified fields
    await binRef.set(
      {
        location: binName,
        fillLevel,
        isFull,
        lastUpdated: new Date(), // Track when last updated
      },
      { merge: true }
    );

    // 🔔 Example notification code (commented out)
    // if (isFull) {
    //   const message = {
    //     notification: {
    //       title: `🗑️ Bin Full Alert`,
    //       body: `${binName} is ${fillLevel}% full. Please schedule a pickup.`,
    //     },
    //     topic: 'bin_alerts', // clients must subscribe to this topic
    //   };
    //   await getMessaging().send(message);
    // }

    return res.status(200).json({ message: 'Bin updated successfully' });
  } catch (error) {
    console.error('Error updating bin:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
