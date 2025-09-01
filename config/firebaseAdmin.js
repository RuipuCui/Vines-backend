const admin = require('firebase-admin');
const serviceAccount = require('./comp90018-project-6a5e1-firebase-adminsdk-fbsvc-96f2d6bc21.json'); // SAME project as the token

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // explicit projectId is optional if present in the JSON, but safe to include:
  projectId: 'comp90018-project-6a5e1',
});

module.exports = admin;
