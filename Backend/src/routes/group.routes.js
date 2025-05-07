const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const verifyToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);

// Rutas protegidas
router.post('/', verifyToken, groupController.createGroup);
router.put('/:id', verifyToken, groupController.updateGroup);
router.delete('/:id', verifyToken, groupController.deleteGroup);

// Rutas para gestionar invitaciones
router.post('/:id/regenerate-code', verifyToken, groupController.regenerateInvitationCode);
router.post('/:id/toggle-invitation', verifyToken, groupController.toggleInvitationStatus);

// Rutas para gestionar miembros
router.get('/:id/members', verifyToken, groupController.getGroupMembers);
router.post('/:id/members', verifyToken, groupController.addMember);
router.delete('/:id/members', verifyToken, groupController.removeMember);

// Rutas para gestionar moderadores
router.post('/:id/moderators', verifyToken, groupController.addModerator);
router.delete('/:id/moderators', verifyToken, groupController.removeModerator);

module.exports = router; 