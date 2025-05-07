const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const songRoutes = require('./routes/song.routes');
const repertoireRoutes = require('./routes/repertoire.routes');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Rutas
app.use('/api/songs', songRoutes);
app.use('/api/repertoires', repertoireRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

// Ruta básica
app.get('/', (req, res) => {
  res.send('API Grupo Alabanza funcionando');
});

module.exports = app;