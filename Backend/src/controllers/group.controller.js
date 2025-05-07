const Group = require('../models/Group');
const User = require('../models/User');

// Obtener todos los grupos
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('leader', 'username')
      .populate('moderators', 'username')
      .populate('members', 'username');
    
    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los grupos',
      error: error.message
    });
  }
};

// Obtener un grupo específico
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('leader', 'username')
      .populate('moderators', 'username')
      .populate('members', 'username');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el grupo',
      error: error.message
    });
  }
};

// Crear un nuevo grupo
exports.createGroup = async (req, res) => {
  try {
    // Verificar que el usuario sea administrador
    const user = await User.findById(req.body.leader);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no existe'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear grupos'
      });
    }
    
    // Generar un ID personalizado para el grupo
    const customGroupId = generateGroupId();
    
    // Crear el grupo incluyendo al creador como miembro
    const group = await Group.create({
      ...req.body,
      groupId: customGroupId,
      // Asegurarse de que el líder también está en la lista de miembros
      members: [...new Set([req.body.leader, ...(req.body.members || [])])]
    });
    
    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el grupo',
      error: error.message
    });
  }
};

// Función para generar un ID único para el grupo
function generateGroupId() {
  // Generar un ID alfanumérico de 8 caracteres
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Actualizar un grupo
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('leader', 'username')
    .populate('members', 'username');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el grupo',
      error: error.message
    });
  }
};

// Eliminar un grupo
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el grupo',
      error: error.message
    });
  }
};

// Regenerar código de invitación
exports.regenerateInvitationCode = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Verificar que el usuario tiene permisos (líder o moderador)
    if (!group.hasAdminPermissions(req.body.userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para regenerar el código de invitación'
      });
    }
    
    // Regenerar el código
    const newCode = group.regenerateInvitationCode();
    await group.save();
    
    res.status(200).json({
      success: true,
      data: {
        invitationCode: newCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al regenerar el código de invitación',
      error: error.message
    });
  }
};

// Habilitar/deshabilitar invitaciones
exports.toggleInvitationStatus = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Verificar que el usuario tiene permisos (líder o moderador)
    if (!group.hasAdminPermissions(req.body.userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar la configuración de invitaciones'
      });
    }
    
    // Cambiar el estado de las invitaciones
    group.invitationEnabled = !group.invitationEnabled;
    await group.save();
    
    res.status(200).json({
      success: true,
      data: {
        invitationEnabled: group.invitationEnabled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de las invitaciones',
      error: error.message
    });
  }
};

// Añadir miembro a un grupo
exports.addMember = async (req, res) => {
  try {
    const { userId, invitationCode } = req.body;
    
    console.log('Datos recibidos:', { 
      groupId: req.params.id, 
      userId, 
      invitationCode,
      body: req.body 
    });
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario es requerido'
      });
    }
    
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Normalizar el código recibido (quitar espacios y convertir a mayúsculas)
    const normalizedReceivedCode = invitationCode ? invitationCode.trim().toUpperCase() : '';
    const normalizedGroupCode = group.invitationCode ? group.invitationCode.trim().toUpperCase() : '';
    
    console.log('Grupo encontrado:', { 
      id: group._id, 
      name: group.name,
      invitationCode: group.invitationCode,
      normalizedGroupCode,
      invitationEnabled: group.invitationEnabled,
      receivedCode: invitationCode,
      normalizedReceivedCode
    });
    
    // Verificar si las invitaciones están habilitadas
    if (!group.invitationEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Las invitaciones están deshabilitadas para este grupo'
      });
    }
    
    // Verificar el código de invitación si existe el campo
    if (group.invitationCode && normalizedReceivedCode !== normalizedGroupCode) {
      return res.status(403).json({
        success: false,
        message: 'Código de invitación incorrecto'
      });
    }
    
    // Verificar si el usuario ya es miembro
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro del grupo'
      });
    }
    
    // Añadir el usuario al grupo
    group.members.push(userId);
    await group.save();
    
    // Devolver el grupo actualizado con los miembros y líder populados
    const updatedGroup = await Group.findById(group._id)
      .populate('leader', 'username')
      .populate('moderators', 'username')
      .populate('members', 'username');
    
    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error en addMember:', error);
    res.status(500).json({
      success: false,
      message: 'Error al añadir miembro al grupo',
      error: error.message
    });
  }
};

// Eliminar miembro de un grupo
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario es requerido'
      });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // No permitir eliminar al líder
    if (group.leader.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar al líder del grupo'
      });
    }
    
    // Verificar si el usuario es miembro
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es miembro del grupo'
      });
    }
    
    // Eliminar el usuario del grupo
    group.members = group.members.filter(
      member => member.toString() !== userId
    );
    
    await group.save();
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar miembro del grupo',
      error: error.message
    });
  }
};

// Añadir moderador a un grupo
exports.addModerator = async (req, res) => {
  try {
    const { userId, moderatorId } = req.body;
    
    if (!userId || !moderatorId) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los IDs de usuario y moderador'
      });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Verificar que el usuario que realiza la acción es el líder
    if (!group.isLeader(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el líder del grupo puede asignar moderadores'
      });
    }
    
    // Verificar que el usuario a promover existe
    const moderator = await User.findById(moderatorId);
    if (!moderator) {
      return res.status(404).json({
        success: false,
        message: 'Usuario a promover no encontrado'
      });
    }
    
    // Verificar que el usuario a promover es miembro del grupo
    if (!group.members.includes(moderatorId)) {
      return res.status(400).json({
        success: false,
        message: 'El usuario debe ser miembro del grupo para ser promovido a moderador'
      });
    }
    
    // Verificar que el usuario no sea ya un moderador
    if (group.moderators.includes(moderatorId)) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es moderador del grupo'
      });
    }
    
    // Añadir a la lista de moderadores
    group.moderators.push(moderatorId);
    await group.save();
    
    // Devolver el grupo actualizado con los miembros y líder populados
    const updatedGroup = await Group.findById(group._id)
      .populate('leader', 'username')
      .populate('moderators', 'username')
      .populate('members', 'username');
    
    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error en addModerator:', error);
    res.status(500).json({
      success: false,
      message: 'Error al añadir moderador al grupo',
      error: error.message
    });
  }
};

// Eliminar moderador de un grupo
exports.removeModerator = async (req, res) => {
  try {
    const { userId, moderatorId } = req.body;
    
    if (!userId || !moderatorId) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los IDs de usuario y moderador'
      });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Verificar que el usuario que realiza la acción es el líder
    if (!group.isLeader(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el líder del grupo puede eliminar moderadores'
      });
    }
    
    // Verificar que el usuario es moderador
    if (!group.moderators.includes(moderatorId)) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es moderador del grupo'
      });
    }
    
    // Eliminar de la lista de moderadores
    group.moderators = group.moderators.filter(
      id => id.toString() !== moderatorId
    );
    
    await group.save();
    
    // Devolver el grupo actualizado
    const updatedGroup = await Group.findById(group._id)
      .populate('leader', 'username')
      .populate('moderators', 'username')
      .populate('members', 'username');
    
    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error en removeModerator:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar moderador del grupo',
      error: error.message
    });
  }
};

// Obtener miembros de un grupo específico
exports.getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'username email role createdAt')
      .populate('leader', 'username email role');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }
    
    // Crear una lista de miembros que incluya al líder y moderadores con sus roles
    const allMembers = [];
    
    // Añadir el líder si existe
    if (group.leader) {
      const leaderData = typeof group.leader === 'object' ? group.leader : { _id: group.leader };
      allMembers.push({
        ...leaderData,
        role: 'admin',
        joinedAt: group.createdAt // Usar la fecha de creación del grupo para el líder
      });
    }
    
    // Añadir moderadores
    if (group.moderators && group.moderators.length) {
      const moderators = group.moderators.map(mod => {
        const modData = typeof mod === 'object' ? mod : { _id: mod };
        return {
          ...modData,
          role: 'moderator',
          joinedAt: group.createdAt // Como fallback usamos createdAt del grupo
        };
      });
      allMembers.push(...moderators);
    }
    
    // Añadir miembros regulares
    if (group.members && group.members.length) {
      const regularMembers = group.members
        .filter(mem => {
          // Filtrar miembros que ya estén como líder o moderadores
          const memId = typeof mem === 'object' ? mem._id.toString() : mem.toString();
          const leaderId = typeof group.leader === 'object' ? group.leader._id.toString() : group.leader?.toString();
          const modIds = (group.moderators || []).map(mod => 
            typeof mod === 'object' ? mod._id.toString() : mod.toString()
          );
          
          return memId !== leaderId && !modIds.includes(memId);
        })
        .map(mem => {
          const memData = typeof mem === 'object' ? mem : { _id: mem };
          return {
            ...memData,
            role: 'user',
            joinedAt: memData.createdAt || group.createdAt
          };
        });
      
      allMembers.push(...regularMembers);
    }
    
    res.status(200).json({
      success: true,
      count: allMembers.length,
      data: allMembers
    });
  } catch (error) {
    console.error('Error al obtener miembros del grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener miembros del grupo',
      error: error.message
    });
  }
}; 