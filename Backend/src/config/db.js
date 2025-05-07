const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión a MongoDB establecida correctamente');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
  }
};

module.exports = { connectDB };