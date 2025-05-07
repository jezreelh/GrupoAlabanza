// src/controllers/repertoire.controller.js

const Repertoire = require('../models/Repertoire');
const Song = require('../models/Song');
const Group = require('../models/Group');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Obtener todos los repertorios
exports.getAllRepertoires = async (req, res) => {
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
    
    // Filtrar por fecha
    if (req.query.date) {
      const date = new Date(req.query.date);
      
      // Si la fecha es válida, filtrar por ella
      if (!isNaN(date.getTime())) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query.date = {
          $gte: date,
          $lt: nextDay
        };
      }
    }
    
    // Búsqueda por texto
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }
    
    const repertoires = await Repertoire.find(query)
      .populate('songs', 'title category')
      .populate('group', 'name')
      .populate('createdBy', 'username');
    
    res.status(200).json({
      success: true,
      count: repertoires.length,
      data: repertoires
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los repertorios',
      error: error.message
    });
  }
};

// Obtener un repertorio específico
exports.getRepertoireById = async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id)
      .populate('songs')
      .populate('group', 'name')
      .populate('createdBy', 'username')
      .populate('versions.songModifications.song');
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el repertorio',
      error: error.message
    });
  }
};

// Crear un nuevo repertorio
exports.createRepertoire = async (req, res) => {
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
        message: 'Se requiere especificar un grupo para el repertorio'
      });
    }
    
    // Asignar el usuario actual como creador
    const repertoireData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Si no hay versiones, crear una versión principal por defecto
    if (!repertoireData.versions || repertoireData.versions.length === 0) {
      repertoireData.versions = [{
        name: 'Versión principal',
        songModifications: []
      }];
    }
    
    const repertoire = await Repertoire.create(repertoireData);
    
    res.status(201).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el repertorio',
      error: error.message
    });
  }
};

// Actualizar un repertorio
exports.updateRepertoire = async (req, res) => {
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
    
    const repertoire = await Repertoire.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('songs')
    .populate('group', 'name')
    .populate('createdBy', 'username')
    .populate('versions.songModifications.song');
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el repertorio',
      error: error.message
    });
  }
};

// Eliminar un repertorio
exports.deleteRepertoire = async (req, res) => {
  try {
    const repertoire = await Repertoire.findByIdAndDelete(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el repertorio',
      error: error.message
    });
  }
};

// Marcar que el repertorio fue tocado hoy
exports.markRepertoireAsPlayed = async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Extraer notas, evento y versión opcional
    const { notes = '', event = '', versionIndex = 0 } = req.body;
    
    // Añadir al historial usando el método del modelo
    await repertoire.addPlay(notes, event, versionIndex);
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar el repertorio como tocado',
      error: error.message
    });
  }
};

// Añadir o modificar una versión al repertorio
exports.addVersion = async (req, res) => {
  try {
    const { name, notes, songModifications } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la versión es obligatorio'
      });
    }
    
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Crear la nueva versión
    const newVersion = {
      name,
      notes: notes || '',
      songModifications: songModifications || [],
      createdAt: new Date()
    };
    
    // Añadir la versión
    repertoire.versions.push(newVersion);
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al añadir versión',
      error: error.message
    });
  }
};

// Eliminar una versión del repertorio
exports.removeVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    
    if (!versionId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la versión es obligatorio'
      });
    }
    
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // No permitir eliminar la versión si solo hay una
    if (repertoire.versions.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la única versión del repertorio'
      });
    }
    
    // Eliminar la versión
    repertoire.versions = repertoire.versions.filter(
      version => version._id.toString() !== versionId
    );
    
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar versión',
      error: error.message
    });
  }
};

// Añadir un enlace multimedia
exports.addMediaLink = async (req, res) => {
  try {
    const { title, url, platform = 'Otro' } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'El título y la URL son obligatorios'
      });
    }
    
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Añadir el enlace
    repertoire.mediaLinks.push({ title, url, platform });
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
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
    
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Eliminar el enlace
    repertoire.mediaLinks = repertoire.mediaLinks.filter(
      link => link._id.toString() !== linkId
    );
    
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar enlace multimedia',
      error: error.message
    });
  }
};

// Generar PDF del repertorio
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { versionIndex = 0 } = req.query;
    
    const repertoire = await Repertoire.findById(id)
      .populate('songs')
      .populate('versions.songModifications.song');
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Crear un nuevo documento PDF
    const doc = new PDFDocument();
    
    // Configurar la respuesta HTTP para descargar un PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=repertorio_${repertoire.name.replace(/\s+/g, '_')}.pdf`);
    
    // Enviar el PDF directamente al navegador
    doc.pipe(res);
    
    // Añadir título del repertorio
    doc.fontSize(25).text(repertoire.name, { align: 'center' });
    doc.moveDown();
    
    // Información del repertorio
    doc.fontSize(14).text(`Fecha: ${new Date(repertoire.date).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Categoría: ${repertoire.category}`, { align: 'left' });
    doc.moveDown(0.5);
    
    if (repertoire.description) {
      doc.fontSize(12).text(`Descripción: ${repertoire.description}`, { align: 'left' });
      doc.moveDown();
    }
    
    // Obtener la versión seleccionada
    let selectedVersion = repertoire.versions[versionIndex];
    if (!selectedVersion && repertoire.versions.length > 0) {
      selectedVersion = repertoire.versions[0];
    }
    
    // Versión del repertorio
    if (selectedVersion) {
      doc.fontSize(16).text(`Versión: ${selectedVersion.name}`, { align: 'center' });
      doc.moveDown();
      
      if (selectedVersion.notes) {
        doc.fontSize(12).text(`Notas: ${selectedVersion.notes}`, { align: 'left' });
        doc.moveDown();
      }
    }
    
    // Canciones del repertorio
    doc.fontSize(18).text('Canciones:', { align: 'left' });
    doc.moveDown();
    
    // Procesar cada canción
    for (let i = 0; i < repertoire.songs.length; i++) {
      const song = repertoire.songs[i];
      
      // Buscar si hay modificaciones para esta canción en la versión seleccionada
      let songModification = null;
      if (selectedVersion) {
        songModification = selectedVersion.songModifications.find(
          mod => mod.song && mod.song._id.toString() === song._id.toString()
        );
      }
      
      // Título y categoría de la canción
      doc.fontSize(16).text(`${i + 1}. ${song.title} (${song.category})`, { align: 'left' });
      doc.moveDown(0.5);
      
      // Notas específicas para esta canción en esta versión
      if (songModification && songModification.notes) {
        doc.fontSize(12).text(`Notas: ${songModification.notes}`, { align: 'left' });
        doc.moveDown(0.5);
      }
      
      // Letra de la canción (original o modificada)
      const lyrics = songModification && songModification.modifiedLyrics 
        ? songModification.modifiedLyrics 
        : song.lyrics;
      
      doc.fontSize(12).text(lyrics, { align: 'left' });
      doc.moveDown();
      
      // Acordes si existen
      const chords = songModification && songModification.modifiedChords
        ? songModification.modifiedChords
        : song.chords;
      
      if (chords) {
        doc.fontSize(10).text('Acordes:', { align: 'left' });
        doc.fontSize(10).text(chords, { align: 'left' });
      }
      
      // Separador entre canciones
      if (i < repertoire.songs.length - 1) {
        doc.moveDown();
        doc.strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown();
      }
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

// Obtener estadísticas de repertorios por grupo
exports.getRepertoireStats = async (req, res) => {
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
    
    // Obtener todos los repertorios del grupo
    const repertoires = await Repertoire.find({ group: groupId });
    
    // Repertorios que no se han tocado nunca
    const neverPlayed = repertoires.filter(rep => !rep.lastPlayed);
    
    // Repertorios que no se han tocado en el último mes
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    
    const notRecentlyPlayed = repertoires.filter(rep => {
      if (!rep.lastPlayed) return false;
      return new Date(rep.lastPlayed) < oneMonthAgo;
    });
    
    // Repertorios agrupados por categoría
    const byCategory = {};
    repertoires.forEach(rep => {
      if (!byCategory[rep.category]) {
        byCategory[rep.category] = [];
      }
      byCategory[rep.category].push({
        _id: rep._id,
        name: rep.name,
        lastPlayed: rep.lastPlayed,
        playCount: rep.playHistory?.length || 0
      });
    });
    
    // Ordenar por fecha de última reproducción (más antigua primero)
    const sortByLastPlayed = (repList) => {
      return [...repList].sort((a, b) => {
        // Si nunca se ha tocado, va primero
        if (!a.lastPlayed) return -1;
        if (!b.lastPlayed) return 1;
        // Ordenar por fecha más antigua primero
        return new Date(a.lastPlayed) - new Date(b.lastPlayed);
      });
    };
    
    // Crear las estadísticas finales
    const stats = {
      totalRepertoires: repertoires.length,
      neverPlayed: {
        count: neverPlayed.length,
        repertoires: neverPlayed.map(r => ({ _id: r._id, name: r.name }))
      },
      notRecentlyPlayed: {
        count: notRecentlyPlayed.length,
        repertoires: sortByLastPlayed(notRecentlyPlayed).map(r => ({ 
          _id: r._id, 
          name: r.name,
          lastPlayed: r.lastPlayed
        }))
      },
      byCategory: Object.keys(byCategory).map(category => ({
        category,
        count: byCategory[category].length,
        repertoires: sortByLastPlayed(byCategory[category])
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

// Actualizar una versión existente
exports.updateVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { name, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la versión es obligatorio'
      });
    }
    
    const repertoire = await Repertoire.findById(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Buscar la versión a actualizar
    const versionIndex = repertoire.versions.findIndex(
      v => v._id.toString() === versionId
    );
    
    if (versionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }
    
    // Actualizar los campos de la versión
    repertoire.versions[versionIndex].name = name;
    repertoire.versions[versionIndex].notes = notes || '';
    
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar versión',
      error: error.message
    });
  }
};

// Actualizar o añadir una modificación de canción en una versión
exports.updateSongInVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const { song: songId, modifiedLyrics, modifiedChords, notes, position } = req.body;
    
    console.log('UPDATE SONG IN VERSION - Parámetros recibidos:', { 
      id, versionId, songId, 
      position,
      hasLyrics: modifiedLyrics !== undefined,
      lyricsLength: modifiedLyrics !== undefined ? modifiedLyrics.length : 'No hay lyrics'
    });
    
    if (!songId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la canción es obligatorio'
      });
    }
    
    const repertoire = await Repertoire.findById(id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Encontrar la versión correcta
    const versionIndex = repertoire.versions.findIndex(v => v._id.toString() === versionId);
    
    if (versionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada en el repertorio'
      });
    }
    
    // Manejar el caso especial de reordenamiento
    if (position !== undefined) {
      try {
        // Buscar la canción dentro de las modificaciones
        const songModIndex = Array.isArray(repertoire.versions[versionIndex].songModifications) ? 
          repertoire.versions[versionIndex].songModifications.findIndex(
            mod => mod && mod.song && (typeof mod.song === 'string' ? 
                  mod.song === songId : 
                  mod.song.toString() === songId)
          ) : -1;
        
        // Si está presente, actualizar la posición
        if (songModIndex !== -1) {
          // Guardar la posición actual (o usar el índice en songs como fallback)
          let currentPosition;
          try {
            if (repertoire.versions[versionIndex].songModifications[songModIndex].position !== undefined) {
              currentPosition = repertoire.versions[versionIndex].songModifications[songModIndex].position;
            } else {
              // Si no hay position definida, usar el índice actual en el array de canciones
              currentPosition = repertoire.songs.findIndex(s => s && 
                (typeof s === 'string' ? s === songId : s.toString() === songId));
              
              if (currentPosition === -1) currentPosition = 0;
            }
            
            // Actualizar position en la modificación existente
            repertoire.versions[versionIndex].songModifications[songModIndex].position = position;
            
            console.log(`Canción reordenada: ${songId} - Posición anterior: ${currentPosition}, Nueva posición: ${position}`);
          } catch (err) {
            console.error('Error al calcular o actualizar posición:', err);
            return res.status(500).json({
              success: false,
              message: 'Error al actualizar posición',
              error: err.message
            });
          }
        } else {
          // No hay modificación previa, crear una nueva con la posición
          repertoire.versions[versionIndex].songModifications.push({
            song: songId,
            position: position
          });
          
          console.log(`Nueva modificación para reordenamiento: ${songId} - Posición: ${position}`);
        }
      } catch (err) {
        console.error('Error al reordenar la canción:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al reordenar la canción',
          error: err.message
        });
      }
    } else {
      // Comportamiento original - modificar letra/acordes/notas
      
      // Buscar la canción dentro de las modificaciones
      const songModIndex = repertoire.versions[versionIndex].songModifications.findIndex(
        mod => {
          if (!mod || !mod.song) return false;
          const modSongId = typeof mod.song === 'string' ? mod.song : mod.song.toString();
          return modSongId === songId;
        }
      );
      
      // Asegurar que lyrics tiene un valor válido (podría ser una cadena vacía)
      let safeModifiedLyrics = undefined;
      if (modifiedLyrics !== undefined) {
        // Convertir a cadena para garantizar un formato válido
        safeModifiedLyrics = String(modifiedLyrics);
        console.log(`Actualizando letra de canción ${songId} - Longitud: ${safeModifiedLyrics.length} caracteres`);
      }
      
      // Si la canción ya tiene modificaciones, actualizarlas
      if (songModIndex !== -1) {
        // Actualizar solo los campos proporcionados
        if (safeModifiedLyrics !== undefined) {
          repertoire.versions[versionIndex].songModifications[songModIndex].modifiedLyrics = safeModifiedLyrics;
        }
        
        if (modifiedChords !== undefined) {
          repertoire.versions[versionIndex].songModifications[songModIndex].modifiedChords = modifiedChords;
        }
        
        if (notes !== undefined) {
          repertoire.versions[versionIndex].songModifications[songModIndex].notes = notes;
        }
      } else {
        // Crear una nueva modificación
        const newModification = {
          song: songId,
          ...(safeModifiedLyrics !== undefined && { modifiedLyrics: safeModifiedLyrics }),
          ...(modifiedChords !== undefined && { modifiedChords }),
          ...(notes !== undefined && { notes })
        };
        
        repertoire.versions[versionIndex].songModifications.push(newModification);
      }
    }
    
    // Guardar los cambios
    await repertoire.save();
    
    // Responder con el repertorio actualizado
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    console.error('Error al actualizar canción en versión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar canción en versión',
      error: error.message
    });
  }
};

// Eliminar una modificación de canción en una versión
exports.removeSongModification = async (req, res) => {
  try {
    const { id, versionId, songId } = req.params;
    
    const repertoire = await Repertoire.findById(id);
    
    if (!repertoire) {
      return res.status(404).json({
        success: false,
        message: 'Repertorio no encontrado'
      });
    }
    
    // Buscar la versión
    const versionIndex = repertoire.versions.findIndex(
      v => v._id.toString() === versionId
    );
    
    if (versionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }
    
    // Eliminar la modificación
    repertoire.versions[versionIndex].songModifications = 
      repertoire.versions[versionIndex].songModifications.filter(
        mod => mod.song.toString() !== songId
      );
    
    await repertoire.save();
    
    res.status(200).json({
      success: true,
      data: repertoire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar modificación de canción',
      error: error.message
    });
  }
};