import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService, groupService } from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Definición de tipos
export interface Group {
  _id: string;
  name: string;
  description?: string;
  church?: string;
  invitationCode?: string;
  leader?: string | any; // Puede ser string o objeto
  members?: (string | any)[]; // Puede ser array de strings u objetos
  moderators?: (string | any)[];
}

export interface User {
  id: string;
  username: string;
  role: string;
  groups?: string[]; // IDs de los grupos a los que pertenece
  email?: string;
  createdAt?: string;
}

type AuthContextType = {
  user: User | null;
  activeGroup: Group | null;
  groups: Group[];
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  register: (userData: { username: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  userGroups: Group[];
  setActiveGroup: (group: Group) => void;
  loadUserGroups: () => Promise<void>;
  createGroup: (groupData: { name: string; description?: string; church?: string }) => Promise<Group>;
  joinGroup: (groupId: string, invitationCode?: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  isAdmin: boolean;
  forceRefreshGroups: () => Promise<void>;
  updateUserInfo: (updatedUser: User) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

// Función para decodificar JWT
const decodeToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<any>(token);
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      groups: decoded.groups || [],
      email: decoded.email,
      createdAt: decoded.createdAt
    };
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};

// Función auxiliar para extraer el ID de forma segura
const extractId = (item: any): string => {
  if (!item) return '';
  
  if (typeof item === 'string') return item;
  
  if (typeof item === 'object') {
    if ('id' in item) return String(item.id);
    if ('_id' in item) return String(item._id);
  }
  
  return String(item);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Función para resetear el estado
  const resetState = () => {
    setActiveGroup(null);
    setGroups([]);
    setUserGroups([]);
    localStorage.removeItem('activeGroupId');
    setInitialized(false);
  };

  // Cargar los datos del usuario desde localStorage
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedUser = decodeToken(token);
          
          if (decodedUser) {
            console.log('Usuario cargado desde localStorage:', decodedUser);
            setUser(decodedUser);
            
            // Cargar los grupos al iniciar
            await loadUserGroups();
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        // Si hay un error con el token, hacer logout
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Efecto para recargar grupos cuando cambia el usuario
  useEffect(() => {
    const loadGroups = async () => {
      if (user) {
        // Si acabamos de establecer un usuario y no estamos inicializados, cargar sus grupos
        if (!initialized) {
          console.log('Cargando grupos para el usuario recién establecido:', user.username);
          await loadUserGroups();
          setInitialized(true);
        }
      }
    };
    
    loadGroups();
  }, [user]);

  // Método para forzar la recarga de grupos
  const forceRefreshGroups = async () => {
    console.log('Forzando recarga de grupos para el usuario actual');
    
    if (!user) {
      console.log('No hay usuario activo para recargar grupos');
      return [];
    }
    
    try {
      // Limpiar referencias de grupos antiguos
      const previousActiveGroupId = activeGroup?._id;
      
      // Mostrar indicador de carga
      setLoading(true);
      
      // Recargar los grupos con un timeout
      const userGroupsList = await loadUserGroups();
      console.log('Grupos recargados:', userGroupsList);
      
      // Si después de recargar no hay un grupo activo pero hay grupos disponibles,
      // configurar el primer grupo como activo
      if (!activeGroup && userGroupsList.length > 0) {
        if (previousActiveGroupId) {
          const previousGroup = userGroupsList.find((g: Group) => g._id === previousActiveGroupId);
          if (previousGroup) {
            setActiveGroup(previousGroup);
            localStorage.setItem('activeGroupId', previousActiveGroupId);
            console.log('Restablecido grupo activo previo:', previousGroup.name);
          } else {
            setActiveGroup(userGroupsList[0]);
            localStorage.setItem('activeGroupId', userGroupsList[0]._id);
            console.log('Configurado nuevo grupo activo:', userGroupsList[0].name);
          }
        } else {
          setActiveGroup(userGroupsList[0]);
          localStorage.setItem('activeGroupId', userGroupsList[0]._id);
          console.log('Configurado grupo activo por defecto:', userGroupsList[0].name);
        }
      } else if (userGroupsList.length === 0) {
        // Si el usuario no tiene grupos, asegurarse de que no haya grupo activo
        setActiveGroup(null);
        localStorage.removeItem('activeGroupId');
        console.log('Usuario sin grupos, limpiando grupo activo');
      }
      
      console.log('Recarga de grupos completada con éxito');
      return userGroupsList;
    } catch (error) {
      console.error('Error al forzar recarga de grupos:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cargar los grupos a los que pertenece el usuario
  const loadUserGroups = async () => {
    if (!user) {
      console.log('No hay usuario para cargar grupos');
      return [];
    }
    
    console.log('Cargando grupos para el usuario:', user.username);
    
    // Crear un timeout para evitar que se quede cargando indefinidamente
    const timeoutPromise = new Promise<Group[]>((resolve) => {
      setTimeout(() => {
        console.log('Timeout alcanzado al cargar grupos');
        resolve([]);
      }, 10000); // 10 segundos de timeout
    });
    
    try {
      // Usar Promise.race para limitar el tiempo de la operación
      const loadPromise = (async () => {
        // Obtener todos los grupos
        const allGroups = await groupService.getAllGroups();
        console.log('Todos los grupos obtenidos:', allGroups);
        setGroups(allGroups);
        
        console.log('Filtrando grupos para el usuario:', { userId: user.id, allGroups });
        
        // Filtrar los grupos a los que pertenece el usuario
        const userGroupsList = allGroups.filter((group: Group) => {
          // Convertir IDs a string para comparación segura
          const userId = String(user.id);
          const leaderId = extractId(group.leader);
          
          // Verificar si el usuario es líder
          const isLeader = leaderId === userId;
          
          // Verificar si el usuario es miembro
          const isMember = group.members && Array.isArray(group.members) && group.members.some((member: any) => {
            return extractId(member) === userId;
          });
          
          console.log('Comprobando grupo:', { 
            groupId: group._id, 
            groupName: group.name, 
            leaderId, 
            userId, 
            isLeader, 
            isMember,
            members: group.members
          });
          
          return isLeader || isMember;
        });
        
        console.log('Grupos del usuario filtrados:', userGroupsList);
        
        setUserGroups(userGroupsList);
        
        // Si hay grupos disponibles, establecer grupo activo
        if (userGroupsList.length > 0) {
          const savedGroupId = localStorage.getItem('activeGroupId');
          
          if (savedGroupId) {
            const savedGroup = userGroupsList.find((g: Group) => g._id === savedGroupId);
            if (savedGroup) {
              setActiveGroup(savedGroup);
              console.log('Grupo activo restaurado:', savedGroup);
            } else {
              setActiveGroup(userGroupsList[0]);
              localStorage.setItem('activeGroupId', userGroupsList[0]._id);
              console.log('Primer grupo establecido como activo:', userGroupsList[0]);
            }
          } else {
            setActiveGroup(userGroupsList[0]);
            localStorage.setItem('activeGroupId', userGroupsList[0]._id);
            console.log('Primer grupo establecido como activo (sin ID guardado):', userGroupsList[0]);
          }
        } else if (userGroupsList.length === 0) {
          console.log('No se encontraron grupos para el usuario');
          setActiveGroup(null);
          localStorage.removeItem('activeGroupId');
        }
        
        return userGroupsList;
      })();
      
      return await Promise.race([loadPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error al cargar grupos del usuario:', error);
      return [];
    }
  };

  // Establecer el grupo activo
  const changeActiveGroup = (group: Group) => {
    setActiveGroup(group);
    localStorage.setItem('activeGroupId', group._id);
  };

  // Funciones para gestionar grupos
  const createGroup = async (groupData: { name: string; description?: string; church?: string }): Promise<Group> => {
    if (!user) throw new Error('Debe iniciar sesión para crear un grupo');
    
    try {
      const newGroup = await groupService.createGroup({
        ...groupData,
        leader: user.id
      });
      
      console.log('Grupo creado:', newGroup);
      
      // Establecer el nuevo grupo como activo
      setActiveGroup(newGroup);
      localStorage.setItem('activeGroupId', newGroup._id);
      
      console.log('Grupo recién creado establecido como activo:', newGroup);
      
      // Recargar los grupos del usuario
      await loadUserGroups();
      
      return newGroup;
    } catch (error) {
      console.error('Error al crear grupo:', error);
      throw error;
    }
  };

  const joinGroup = async (groupId: string, invitationCode?: string) => {
    if (!user) throw new Error('Debe iniciar sesión para unirse a un grupo');
    
    try {
      console.log('Intentando unir al usuario a grupo:', { groupId, userId: user.id });
      const groupResponse = await groupService.addMember(groupId, user.id, invitationCode);
      console.log('Usuario unido al grupo:', groupResponse);
      
      // Obtener la lista de grupos actualizada antes de intentar usar el grupo
      const allGroups = await groupService.getAllGroups();
      
      // Buscar el grupo actualizado después de unirse
      const joinedGroup = allGroups.find((g: Group) => g._id === groupId);
      
      if (joinedGroup) {
        console.log('Grupo encontrado después de unirse:', joinedGroup);
        // Asegurarse de que el usuario realmente es miembro del grupo
        const userId = String(user.id);
        const isMember = joinedGroup.members && Array.isArray(joinedGroup.members) && 
          joinedGroup.members.some((member: any) => extractId(member) === userId);
        
        if (isMember) {
          // Actualizar los grupos del usuario con la lista actualizada
          const userGroupsList = allGroups.filter((g: Group) => {
            const userId = String(user.id);
            const leaderId = extractId(g.leader);
            const isLeader = leaderId === userId;
            const isMember = g.members && Array.isArray(g.members) && 
              g.members.some((member: any) => extractId(member) === userId);
            return isLeader || isMember;
          });
          
          setUserGroups(userGroupsList);
          
          // Establecer el grupo al que se unió como activo
          setActiveGroup(joinedGroup);
          localStorage.setItem('activeGroupId', joinedGroup._id);
          console.log('Grupo al que se unió establecido como activo:', joinedGroup);
        } else {
          console.error('El usuario no aparece como miembro del grupo después de unirse');
          throw new Error('Error al unirse al grupo: el usuario no aparece como miembro');
        }
      } else {
        console.error('No se pudo encontrar el grupo después de unirse');
        throw new Error('Error al unirse al grupo: no se pudo encontrar');
      }
    } catch (error) {
      console.error('Error al unirse al grupo:', error);
      throw error;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) throw new Error('Debe iniciar sesión para salir de un grupo');
    
    try {
      console.log('Iniciando proceso de salir del grupo:', groupId);
      
      // Obtener una referencia al estado actual antes de hacer cambios
      const wasActiveGroup = activeGroup && activeGroup._id === groupId;
      
      // Primero eliminamos al usuario del grupo en el servidor
      await groupService.removeMember(groupId, user.id);
      console.log('Usuario eliminado del grupo en el servidor');
      
      // Si el grupo activo es el que se está dejando, establecer el grupo activo a null
      if (wasActiveGroup) {
        console.log('El grupo que se está dejando es el activo, limpiando estado');
        setActiveGroup(null);
        localStorage.removeItem('activeGroupId');
      }
      
      // Obtener los grupos actualizados del servidor
      const allGroups = await groupService.getAllGroups();
      console.log('Obtenidos todos los grupos después de salir');
      
      // Filtrar para obtener sólo los grupos del usuario
      const userGroupsList = allGroups.filter((group: Group) => {
        const userId = String(user.id);
        const leaderId = extractId(group.leader);
        
        // Verificar si el usuario es líder
        const isLeader = leaderId === userId;
        
        // Verificar si el usuario es miembro
        const isMember = group.members && Array.isArray(group.members) && 
          group.members.some((member: any) => extractId(member) === userId);
        
        return isLeader || isMember;
      });
      
      // Actualizar el estado con los grupos del usuario
      console.log('Grupos del usuario actualizados después de salir:', userGroupsList);
      setUserGroups(userGroupsList);
      
      // Si era el grupo activo y hay otros grupos disponibles, establecer uno nuevo como activo
      if (wasActiveGroup && userGroupsList.length > 0) {
        console.log('Estableciendo nuevo grupo activo después de salir');
        setActiveGroup(userGroupsList[0]);
        localStorage.setItem('activeGroupId', userGroupsList[0]._id);
      }
      
      return userGroupsList;
    } catch (error) {
      console.error('Error al salir del grupo:', error);
      throw error;
    }
  };

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      // Resetear el estado antes de iniciar sesión con un nuevo usuario
      resetState();
      setLoading(true);
      
      console.log('Iniciando sesión con:', credentials.username);
      const response = await authService.login(credentials);
      
      localStorage.setItem('token', response.token);
      
      const userData = decodeToken(response.token);
      if (userData) {
        console.log('Sesión iniciada como:', userData.username);
        setUser(userData);
        
        // Esperar un momento para asegurarse de que el usuario está configurado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cargar los grupos del usuario
        await loadUserGroups();
        
        console.log('Inicio de sesión completo, usuario y grupos cargados');
        setLoading(false);
        setInitialized(true);
        return true;
      }
      
      // Si llegamos aquí, no hay userData
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: { username: string; password: string; confirmPassword?: string }) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      localStorage.setItem('token', response.token);
      
      const newUserData = decodeToken(response.token);
      if (newUserData) {
        setUser(newUserData);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Cerrando sesión');
    authService.logout();
    setUser(null);
    resetState();
  };

  const updateUserInfo = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    activeGroup,
    groups,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    userGroups,
    setActiveGroup: changeActiveGroup,
    loadUserGroups,
    forceRefreshGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    isAdmin: user?.role === 'admin',
    updateUserInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 