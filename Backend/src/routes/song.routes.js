const express = require('express');
const router = express.Router();
const { 
  getAllSongs, 
  getSongById, 
  createSong, 
  updateSong, 
  deleteSong,
  markSongAsPlayed,
  addMediaLink,
  removeMediaLink,
  getSongStats
} = require('../controllers/song.controller');

const verifyToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getAllSongs);
router.get('/:id', getSongById);

// Rutas para estadísticas
router.get('/stats/group/:groupId', getSongStats);

// Rutas protegidas
router.post('/', verifyToken, createSong);
router.put('/:id', verifyToken, updateSong);
router.delete('/:id', verifyToken, deleteSong);

// Rutas para marcar como tocada
router.post('/:id/played', verifyToken, markSongAsPlayed);

// Rutas para gestionar enlaces multimedia
router.post('/:id/media', verifyToken, addMediaLink);
router.delete('/:id/media/:linkId', verifyToken, removeMediaLink);

module.exports = router;
