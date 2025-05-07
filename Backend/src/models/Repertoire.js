// src/models/Repertoire.js

const mongoose = require('mongoose');

// Esquema para las versiones de un repertorio (para diferentes formas de tocar)
const RepertoireVersionSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Versión principal'
  },
  notes: {
    type: String,
    default: ''
  },
  // Modificaciones específicas para cada canción en esta versión
  songModifications: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    // Letra modificada para esta versión (si es diferente de la original)
    modifiedLyrics: String,
    // Acordes modificados para esta versión
    modifiedChords: String,
    // Notas específicas para esta canción en esta versión
    notes: String,
    // Posición en el repertorio
    position: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const RepertoireSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del repertorio es obligatorio'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  // Categoría principal del repertorio
  category: {
    type: String,
    enum: ['Alabanza', 'Adoración', 'Jubilo', 'Ofrenda', 'Comunión', 'Otro'],
    default: 'Otro'
  },
  // Grupo al que pertenece el repertorio
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  // Lista básica de canciones (referencia a documentos Song)
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  // Versiones diferentes del repertorio
  versions: [RepertoireVersionSchema],
  // Historial de veces que se tocó el repertorio
  playHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    // Opcional: servicio o evento en que se tocó
    event: String,
    // Qué versión se tocó (índice en el array de versiones)
    versionIndex: {
      type: Number,
      default: 0
    }
  }],
  // Enlaces multimedia (videos, grabaciones, etc.)
  mediaLinks: [{
    title: String,
    url: String,
    platform: {
      type: String,
      enum: ['YouTube', 'TikTok', 'Spotify', 'Instagram', 'Otro'],
      default: 'Otro'
    }
  }],
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

// Actualizar la fecha cuando se modifica
RepertoireSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Métodos para gestionar la historia de reproducciones
RepertoireSchema.methods.addPlay = function(notes = '', event = '', versionIndex = 0) {
  this.playHistory.push({
    date: new Date(),
    notes,
    event,
    versionIndex
  });
  return this.save();
};

// Obtener la última vez que se tocó
RepertoireSchema.virtual('lastPlayed').get(function() {
  if (this.playHistory && this.playHistory.length > 0) {
    return this.playHistory[this.playHistory.length - 1].date;
  }
  return null;
});

// Calcular cuánto tiempo ha pasado desde la última vez que se tocó
RepertoireSchema.virtual('daysSinceLastPlayed').get(function() {
  if (!this.lastPlayed) return null;
  
  const now = new Date();
  const diff = now.getTime() - this.lastPlayed.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // Convertir a días
});

module.exports = mongoose.model('Repertoire', RepertoireSchema);