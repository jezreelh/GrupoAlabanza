const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del grupo es obligatorio'],
    unique: true,
    trim: true
  },
  groupId: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  church: {
    type: String,
    default: ''
  },
  invitationCode: {
    type: String,
    default: function() {
      // Generar un código aleatorio de 6 caracteres
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  invitationEnabled: {
    type: Boolean,
    default: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Método para regenerar el código de invitación
GroupSchema.methods.regenerateInvitationCode = function() {
  this.invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return this.invitationCode;
};

// Método para comprobar si un usuario es líder
GroupSchema.methods.isLeader = function(userId) {
  return this.leader.toString() === userId.toString();
};

// Método para comprobar si un usuario es moderador
GroupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(modId => modId.toString() === userId.toString());
};

// Método para comprobar si un usuario tiene permisos de administración (líder o moderador)
GroupSchema.methods.hasAdminPermissions = function(userId) {
  return this.isLeader(userId) || this.isModerator(userId);
};

// Actualizar fecha al modificar
GroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', GroupSchema); 