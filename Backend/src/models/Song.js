const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  lyrics: {
    type: String,
    required: [true, 'La letra es obligatoria']
  },
  chords: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Desconocido'
  },
  category: {
    type: String,
    enum: ['Alabanza', 'Adoración', 'Jubilo', 'Ofrenda', 'Comunión', 'Otro'],
    default: 'Otro'
  },
  tags: [String],
  tone: String,
  key: {
    type: String,
    default: 'C'
  },
  tempo: {
    type: Number,
    default: 80
  },
  // Referencias a vídeos de YouTube, TikTok, etc.
  mediaLinks: [{
    title: String,
    url: String,
    platform: {
      type: String,
      enum: ['YouTube', 'TikTok', 'Spotify', 'Instagram', 'Otro'],
      default: 'Otro'
    }
  }],
  // Registro de cuando se tocó la canción
  playHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    // Opcional: evento o servicio en el que se tocó
    event: String
  }],
  // Grupo al que pertenece la canción
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar fecha al modificar
SongSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Métodos para gestionar la historia de reproducciones
SongSchema.methods.addPlay = function(notes = '', event = '') {
  this.playHistory.push({
    date: new Date(),
    notes,
    event
  });
  
  // Mantener solo los últimos 3 registros
  if (this.playHistory.length > 3) {
    this.playHistory = this.playHistory.slice(-3);
  }
  
  return this.save();
};

// Obtener la última vez que se tocó
SongSchema.virtual('lastPlayed').get(function() {
  if (this.playHistory && this.playHistory.length > 0) {
    return this.playHistory[this.playHistory.length - 1].date;
  }
  return null;
});

// Calcular cuánto tiempo ha pasado desde la última vez que se tocó
SongSchema.virtual('daysSinceLastPlayed').get(function() {
  if (!this.lastPlayed) return null;
  
  const now = new Date();
  const diff = now.getTime() - this.lastPlayed.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // Convertir a días
});

// 👇 ESTA LÍNEA ES CLAVE
module.exports = mongoose.model('Song', SongSchema);
