const Song = require('../models/Song');
const Group = require('../models/Group');
const PDFDocument = require('pdfkit');

// Obtener todas las canciones
exports.getAllSongs = async (req, res) => {
  try {
    let query = {};
    
    // Filtrar por grupo si se proporciona el parámetro
    if (req.query.group) {
      query.group = req.query.group;
    }
    
    // Filtrar por categoría
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filtrar por etiquetas
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }
    
    // Búsqueda por texto
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { lyrics: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    const songs = await Song.find(query)
      .populate('group', 'name')
      .populate('createdBy', 'username');
      
    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las canciones',
      error: error.message
    });
  }
};

// Obtener una canción por ID
exports.getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('group', 'name')
      .populate('createdBy', 'username');
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la canción',
      error: error.message
    });
  }
};

// Crear una nueva canción
exports.createSong = async (req, res) => {
  try {
    // Verificar que el grupo existe
    if (req.body.group) {
      const group = await Group.findById(req.body.group);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'El grupo especificado no existe'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar un grupo para la canción'
      });
    }
    
    // Asignar el usuario actual como creador
    const song = await Song.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la canción',
      error: error.message
    });
  }
};

// Actualizar una canción
exports.updateSong = async (req, res) => {
  try {
    // Verificar que el grupo existe si se está actualizando
    if (req.body.group) {
      const group = await Group.findById(req.body.group);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'El grupo especificado no existe'
        });
      }
    }
    
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('group', 'name')
    .populate('createdBy', 'username');
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la canción',
      error: error.message
    });
  }
};

// Eliminar una canción
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la canción',
      error: error.message
    });
  }
};

// Marcar que la canción fue tocada hoy
exports.markSongAsPlayed = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    // Extraer notas y evento opcional
    const { notes = '', event = '' } = req.body;
    
    // Añadir al historial usando el método del modelo
    await song.addPlay(notes, event);
    
    res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar la canción como tocada',
      error: error.message
    });
  }
};

// Añadir un enlace multimedia a una canción
exports.addMediaLink = async (req, res) => {
  try {
    const { title, url, platform = 'Otro' } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'El título y la URL son obligatorios'
      });
    }
    
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    // Añadir el enlace
    song.mediaLinks.push({ title, url, platform });
    await song.save();
    
    res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al añadir enlace multimedia',
      error: error.message
    });
  }
};

// Eliminar un enlace multimedia
exports.removeMediaLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    
    if (!linkId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del enlace es obligatorio'
      });
    }
    
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    // Eliminar el enlace
    song.mediaLinks = song.mediaLinks.filter(
      link => link._id.toString() !== linkId
    );
    
    await song.save();
    
    res.status(200).json({
      success: true,
      data: song
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar enlace multimedia',
      error: error.message
    });
  }
};

// Obtener estadísticas de canciones por grupo
exports.getSongStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verificar que el grupo existe
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Obtener todas las canciones del grupo
    const songs = await Song.find({ group: groupId });
    
    // Canciones que no se han tocado nunca
    const neverPlayed = songs.filter(song => !song.lastPlayed);
    
    // Canciones que no se han tocado en el último mes
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    
    const notRecentlyPlayed = songs.filter(song => {
      if (!song.lastPlayed) return false;
      return new Date(song.lastPlayed) < oneMonthAgo;
    });
    
    // Canciones agrupadas por categoría
    const byCategory = {};
    songs.forEach(song => {
      if (!byCategory[song.category]) {
        byCategory[song.category] = [];
      }
      byCategory[song.category].push({
        _id: song._id,
        title: song.title,
        lastPlayed: song.lastPlayed,
        playCount: song.playHistory?.length || 0
      });
    });
    
    // Ordenar por fecha de última reproducción (más antigua primero)
    const sortByLastPlayed = (songList) => {
      return [...songList].sort((a, b) => {
        // Si nunca se ha tocado, va primero
        if (!a.lastPlayed) return -1;
        if (!b.lastPlayed) return 1;
        // Ordenar por fecha más antigua primero
        return new Date(a.lastPlayed) - new Date(b.lastPlayed);
      });
    };
    
    // Crear las estadísticas finales
    const stats = {
      totalSongs: songs.length,
      neverPlayed: {
        count: neverPlayed.length,
        songs: neverPlayed.map(s => ({ _id: s._id, title: s.title }))
      },
      notRecentlyPlayed: {
        count: notRecentlyPlayed.length,
        songs: sortByLastPlayed(notRecentlyPlayed).map(s => ({ 
          _id: s._id, 
          title: s.title,
          lastPlayed: s.lastPlayed
        }))
      },
      byCategory: Object.keys(byCategory).map(category => ({
        category,
        count: byCategory[category].length,
        songs: sortByLastPlayed(byCategory[category])
      }))
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Generar PDF de la letra de la canción
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const song = await Song.findById(id)
      .populate('group', 'name')
      .populate('createdBy', 'username');
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    // Crear un nuevo documento PDF
    const doc = new PDFDocument();
    
    // Configurar la respuesta HTTP para descargar un PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cancion_${song.title.replace(/\s+/g, '_')}.pdf`);
    
    // Enviar el PDF directamente al navegador
    doc.pipe(res);
    
    // Añadir título de la canción
    doc.fontSize(25).text(song.title, { align: 'center' });
    doc.moveDown();
    
    // Información del autor
    if (song.author) {
      doc.fontSize(16).text(`Autor: ${song.author}`, { align: 'center' });
      doc.moveDown();
    }
    
    // Separador
    doc.strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown();
    
    // Letra de la canción
    if (song.lyrics) {
      doc.fontSize(18).text('Letra:', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(song.lyrics, { align: 'left' });
    } else {
      doc.fontSize(12).text('No hay letra disponible para esta canción.', { align: 'center', style: 'italic' });
    }
    
    // Finalizar el PDF
    doc.end();
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: error.message
    });
  }
};