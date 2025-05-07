import axios from 'axios';

// Configuración de axios
export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token de autenticación a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      throw error;
    }
  },
  register: async (userData: { username: string; password: string; confirmPassword?: string }) => {
    // Eliminar confirmPassword antes de enviarlo al backend
    const { confirmPassword, ...userDataToSend } = userData;
    try {
      const response = await api.post('/auth/register', userDataToSend);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Servicio de grupos
export const groupService = {
  getAllGroups: async () => {
    try {
      const response = await api.get('/groups');
      console.log('Grupos obtenidos:', response.data.data || []);
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      throw error;
    }
  },
  getGroupById: async (id: string) => {
    try {
      const response = await api.get(`/groups/${id}`);
      console.log(`Grupo ${id} obtenido:`, response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener grupo con ID ${id}:`, error);
      throw error;
    }
  },
  createGroup: async (groupData: any) => {
    try {
      console.log('Creando grupo con datos:', groupData);
      const response = await api.post('/groups', groupData);
      console.log('Grupo creado:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear grupo:', error);
      throw error;
    }
  },
  updateGroup: async (id: string, groupData: any) => {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      throw error;
    }
  },
  deleteGroup: async (id: string) => {
    try {
      const response = await api.delete(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      throw error;
    }
  },
  // Métodos para gestionar miembros
  addMember: async (groupId: string, userId: string, invitationCode?: string) => {
    try {
      console.log('Intentando unir al usuario al grupo:', { groupId, userId, invitationCode });
      const response = await api.post(`/groups/${groupId}/members`, { 
        userId, 
        invitationCode 
      });
      console.log('Usuario agregado al grupo:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al añadir miembro al grupo:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      throw error;
    }
  },
  removeMember: async (groupId: string, userId: string) => {
    try {
      const response = await api.delete(`/groups/${groupId}/members`, { 
        data: { userId } 
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar miembro del grupo:', error);
      throw error;
    }
  },
  // Métodos para gestionar invitaciones
  regenerateInvitationCode: async (groupId: string, userId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/regenerate-code`, { userId });
      return response.data.data;
    } catch (error) {
      console.error('Error al regenerar código de invitación:', error);
      throw error;
    }
  },
  toggleInvitationStatus: async (groupId: string, userId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/toggle-invitation`, { userId });
      return response.data.data;
    } catch (error) {
      console.error('Error al cambiar estado de invitaciones:', error);
      throw error;
    }
  },
  // Métodos para gestionar moderadores
  addModerator: async (groupId: string, userId: string, moderatorId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/moderators`, { 
        userId,
        moderatorId
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al añadir moderador:', error);
      throw error;
    }
  },
  removeModerator: async (groupId: string, userId: string, moderatorId: string) => {
    try {
      const response = await api.delete(`/groups/${groupId}/moderators`, { 
        data: { 
          userId,
          moderatorId
        } 
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar moderador:', error);
      throw error;
    }
  }
};

// Servicio de canciones
export const songService = {
  getAllSongs: async (filters = {}) => {
    try {
      const response = await api.get('/songs', { params: filters });
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener canciones:', error);
      throw error;
    }
  },
  getSongById: async (id: string) => {
    try {
      const response = await api.get(`/songs/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener canción con ID ${id}:`, error);
      throw error;
    }
  },
  createSong: async (songData: any) => {
    try {
      const response = await api.post('/songs', songData);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear canción:', error);
      throw error;
    }
  },
  updateSong: async (id: string, songData: any) => {
    try {
      const response = await api.put(`/songs/${id}`, songData);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar canción:', error);
      throw error;
    }
  },
  deleteSong: async (id: string) => {
    try {
      const response = await api.delete(`/songs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar canción:', error);
      throw error;
    }
  },
  // Método para marcar la canción como tocada hoy
  markSongAsPlayed: async (id: string, data = {}) => {
    try {
      const response = await api.post(`/songs/${id}/played`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error al marcar canción como tocada:', error);
      throw error;
    }
  },
  // Métodos para gestionar enlaces multimedia
  addMediaLink: async (id: string, linkData: { title: string, url: string, platform?: string }) => {
    try {
      const response = await api.post(`/songs/${id}/media`, linkData);
      return response.data.data;
    } catch (error) {
      console.error('Error al añadir enlace multimedia:', error);
      throw error;
    }
  },
  removeMediaLink: async (songId: string, linkId: string) => {
    try {
      const response = await api.delete(`/songs/${songId}/media/${linkId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar enlace multimedia:', error);
      throw error;
    }
  },
  // Obtener estadísticas por grupo
  getSongStatsByGroup: async (groupId: string) => {
    try {
      const response = await api.get(`/songs/stats/group/${groupId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de canciones:', error);
      throw error;
    }
  }
};

// Servicio de repertorios
export const repertoireService = {
  getAllRepertoires: async (filters = {}) => {
    try {
      const response = await api.get('/repertoires', { params: filters });
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener repertorios:', error);
      throw error;
    }
  },
  getRepertoiresByGroup: async (groupId: string) => {
    try {
      const response = await api.get('/repertoires', { params: { group: groupId } });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error al obtener repertorios del grupo ${groupId}:`, error);
      throw error;
    }
  },
  getRepertoireById: async (id: string) => {
    try {
      const response = await api.get(`/repertoires/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener repertorio con ID ${id}:`, error);
      throw error;
    }
  },
  createRepertoire: async (repertoireData: any) => {
    try {
      const response = await api.post('/repertoires', repertoireData);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear repertorio:', error);
      throw error;
    }
  },
  updateRepertoire: async (id: string, repertoireData: any) => {
    try {
      const response = await api.put(`/repertoires/${id}`, repertoireData);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar repertorio:', error);
      throw error;
    }
  },
  deleteRepertoire: async (id: string) => {
    try {
      const response = await api.delete(`/repertoires/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar repertorio:', error);
      throw error;
    }
  },
  // Método para marcar el repertorio como tocado hoy
  markRepertoireAsPlayed: async (id: string, data = {}) => {
    try {
      const response = await api.post(`/repertoires/${id}/played`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error al marcar repertorio como tocado:', error);
      throw error;
    }
  },
  // Métodos para gestionar versiones
  addVersion: async (id: string, versionData: any) => {
    try {
      console.log('API - Añadiendo versión a repertorio:', id, versionData);
      const response = await api.post(`/repertoires/${id}/versions`, versionData);
      console.log('API - Versión añadida con éxito:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error al añadir versión al repertorio:', error);
      throw error;
    }
  },
  updateVersion: async (repertoireId: string, versionId: string, versionData: any) => {
    try {
      console.log('API - Actualizando versión:', repertoireId, versionId, versionData);
      const response = await api.put(`/repertoires/${repertoireId}/versions/${versionId}`, versionData);
      console.log('API - Versión actualizada con éxito:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar versión del repertorio:', error);
      throw error;
    }
  },
  removeVersion: async (repertoireId: string, versionId: string) => {
    try {
      console.log('API - Eliminando versión:', repertoireId, versionId);
      const response = await api.delete(`/repertoires/${repertoireId}/versions/${versionId}`);
      console.log('API - Versión eliminada con éxito:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar versión del repertorio:', error);
      throw error;
    }
  },
  deleteVersion: async (repertoireId: string, versionId: string) => {
    return repertoireService.removeVersion(repertoireId, versionId);
  },
  // Modificaciones de canciones dentro de versiones
  updateSongInVersion: async (repertoireId: string, versionId: string, modificationData: any) => {
    try {
      console.log('API - Modificando canción en versión:', {
        repertoireId,
        versionId,
        songId: modificationData.song || 'No hay ID de canción',
        position: modificationData.position !== undefined ? modificationData.position : 'No es reordenamiento',
        hasLyrics: modificationData.modifiedLyrics !== undefined,
        lyricsLength: modificationData.modifiedLyrics !== undefined ? 
          (typeof modificationData.modifiedLyrics === 'string' ? 
          modificationData.modifiedLyrics.length : 'No es string') : 'No definido'
      });
      
      // Validar parámetros de entrada
      if (!repertoireId || !versionId) {
        console.error('Error: repertoireId o versionId no proporcionados');
        throw new Error('Parámetros incompletos para modificar canción');
      }
      
      // Verificar que al menos hay un dato para modificar
      if (!modificationData || (!modificationData.song && !modificationData.songId)) {
        console.error('Error: No hay datos de canción para modificar');
        throw new Error('No se proporcionó un ID de canción válido');
      }
      
      // Asegurar que tenemos el ID de canción en el formato correcto
      const songId = modificationData.song || modificationData.songId;
      if (!songId) {
        throw new Error('ID de canción no válido');
      }
      
      // Asegurar que modifiedLyrics es siempre una cadena, incluso si está vacía
      let modifiedLyrics = undefined;
      if (modificationData.modifiedLyrics !== undefined) {
        modifiedLyrics = String(modificationData.modifiedLyrics);
      }
      
      // Crear objeto con campos a modificar
      const modification = {
        song: songId,
        ...(modificationData.position !== undefined && { position: modificationData.position }),
        ...(modifiedLyrics !== undefined && { modifiedLyrics }),
        ...(modificationData.modifiedChords !== undefined && { modifiedChords: modificationData.modifiedChords }),
        ...(modificationData.notes !== undefined && { notes: modificationData.notes })
      };
      
      // Registrar claramente lo que se está enviando
      console.log('API - Enviando modificación a canción:', JSON.stringify(modification));
      
      const response = await api.post(
        `/repertoires/${repertoireId}/versions/${versionId}/songs`, 
        modification
      );
      
      console.log('API - Canción modificada con éxito:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('API - Error al modificar canción en versión:', error.response?.data || error.message);
      // Mejorar el registro de errores para depuración
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
    }
  },
  removeSongModification: async (repertoireId: string, versionId: string, songId: string) => {
    try {
      const response = await api.delete(
        `/repertoires/${repertoireId}/versions/${versionId}/songs/${songId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar modificación de canción:', error);
      throw error;
    }
  },
  // Métodos para gestionar enlaces multimedia
  addMediaLink: async (id: string, linkData: { title: string, url: string, platform?: string }) => {
    try {
      const response = await api.post(`/repertoires/${id}/media`, linkData);
      return response.data.data;
    } catch (error) {
      console.error('Error al añadir enlace multimedia:', error);
      throw error;
    }
  },
  removeMediaLink: async (repertoireId: string, linkId: string) => {
    try {
      const response = await api.delete(`/repertoires/${repertoireId}/media/${linkId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al eliminar enlace multimedia:', error);
      throw error;
    }
  },
  // Generar PDF
  generatePDF: async (id: string, versionIndex = 0) => {
    try {
      // Esta petición devolverá un blob (archivo PDF)
      const response = await api.get(`/repertoires/${id}/pdf`, {
        params: { versionIndex },
        responseType: 'blob'
      });
      
      // Crear URL para el blob y forzar la descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `repertorio.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  },
  // Obtener estadísticas por grupo
  getRepertoireStatsByGroup: async (groupId: string) => {
    try {
      const response = await api.get(`/repertoires/stats/group/${groupId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de repertorios:', error);
      throw error;
    }
  }
};

// Servicios para la API de usuarios
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },
  
  updateProfile: async (userData: any) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },
  
  getGroupMembers: async (groupId: string) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener miembros del grupo:', error);
      throw error;
    }
  },
}; 