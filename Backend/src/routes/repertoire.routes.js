// src/routes/repertoire.routes.js

const express = require('express');
const router = express.Router();
const repertoireController = require('../controllers/repertoire.controller');
const verifyToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', repertoireController.getAllRepertoires);
router.get('/:id', repertoireController.getRepertoireById);

// Rutas para estadísticas
router.get('/stats/group/:groupId', repertoireController.getRepertoireStats);

// Ruta para generar PDF
router.get('/:id/pdf', repertoireController.generatePDF);

// Rutas protegidas
router.post('/', verifyToken, repertoireController.createRepertoire);
router.put('/:id', verifyToken, repertoireController.updateRepertoire);
router.delete('/:id', verifyToken, repertoireController.deleteRepertoire);

// Rutas para marcar como tocado
router.post('/:id/played', verifyToken, repertoireController.markRepertoireAsPlayed);

// Rutas para gestionar versiones
router.post('/:id/versions', verifyToken, repertoireController.addVersion);
router.put('/:id/versions/:versionId', verifyToken, repertoireController.updateVersion);
router.delete('/:id/versions/:versionId', verifyToken, repertoireController.removeVersion);

// Rutas para gestionar modificaciones de canciones en versiones
router.post('/:id/versions/:versionId/songs', verifyToken, repertoireController.updateSongInVersion);
router.delete('/:id/versions/:versionId/songs/:songId', verifyToken, repertoireController.removeSongModification);

// Rutas para gestionar enlaces multimedia
router.post('/:id/media', verifyToken, repertoireController.addMediaLink);
router.delete('/:id/media/:linkId', verifyToken, repertoireController.removeMediaLink);

module.exports = router;