var admin = require("firebase-admin");
var serviceAccount = require("./permissions.json");

var fire = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = fire;