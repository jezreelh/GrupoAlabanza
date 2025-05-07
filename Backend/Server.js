// server.js
const app = require('./src/app');
const dotenv = require('dotenv');

require('dotenv').config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
