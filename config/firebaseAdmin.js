const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Prefer GOOGLE_APPLICATION_CREDENTIALS env var in production
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), 
  });
}

module.exports = admin;

// // config/firebaseAdmin.js
// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json'); // SAME project as the token

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   // explicit projectId is optional if present in the JSON, but safe to include:
//   projectId: 'comp90018-project-6a5e1',
// });

// module.exports = admin;
