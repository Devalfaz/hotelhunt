const admin = require('firebase-admin')
const serviceAccount = require('./permissions.json')

const fire = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

module.exports = fire
