import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserIcon, MusicalNoteIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { songService, repertoireService, api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

// Componentes de pestañas
type TabType = 'users' | 'songs' | 'repertoires' | 'stats';

// Tipos para las estadísticas
interface SongStats {
  totalSongs: number;
  neverPlayed: {
    count: number;
    songs: Array<{
      _id: string;
      title: string;
      category?: string;
      lastPlayed?: string;
    }>;
  };
  notRecentlyPlayed: {
    count: number;
    songs: Array<{
      _id: string;
      title: string;
      category?: string;
      lastPlayed?: string;
    }>;
  };
  byCategory: Array<{
    category: string;
    count: number;
    songs: Array<{
      _id: string;
      title: string;
      lastPlayed?: string;
      playCount: number;
    }>;
  }>;
}

interface RepertoireStats {
  totalRepertoires: number;
  neverPlayed: {
    count: number;
    repertoires: Array<{
      _id: string;
      name: string;
    }>;
  };
  notRecentlyPlayed: {
    count: number;
    repertoires: Array<{
      _id: string;
      name: string;
      lastPlayed?: string;
    }>;
  };
  byCategory: Array<{
    category: string;
    count: number;
    repertoires: Array<{
      _id: string;
      name: string;
      lastPlayed?: string;
      playCount: number;
    }>;
  }>;
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const { user, activeGroup } = useAuth();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.username}. Aquí puedes gestionar todos los aspectos de la aplicación.
        </p>
        {activeGroup && (
          <p className="text-gray-600 mt-1">
            Grupo activo: <span className="font-semibold">{activeGroup.name}</span>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('songs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'songs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Canciones
          </button>
          <button
            onClick={() => setActiveTab('repertoires')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'repertoires'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Repertorios
          </button>
        </nav>
      </div>

      {/* Contenido de la pestaña */}
      <div className="mt-6">
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'songs' && <SongsTab />}
        {activeTab === 'repertoires' && <RepertoiresTab />}
      </div>
    </Layout>
  );
};

// Componente para la pestaña de estadísticas
const StatsTab = () => {
  const { activeGroup } = useAuth();
  
  // Consulta para estadísticas de canciones
  const { data: songStats, isLoading, error } = useQuery({
    queryKey: ['songStats', activeGroup?._id],
    queryFn: () => activeGroup ? songService.getSongStatsByGroup(activeGroup._id) : null,
    enabled: !!activeGroup
  });
  
  // Consulta para estadísticas de repertorios
  const { data: repertoireStats } = useQuery({
    queryKey: ['repertoireStats', activeGroup?._id],
    queryFn: () => activeGroup ? repertoireService.getRepertoireStatsByGroup(activeGroup._id) : null,
    enabled: !!activeGroup
  });
  
  // Tipificar las estadísticas
  const typedSongStats: SongStats | null = songStats as SongStats | null;
  const typedRepertoireStats: RepertoireStats | null = repertoireStats as RepertoireStats | null;
  
  // Validar la existencia de datos para evitar errores
  const hasSongStats = typedSongStats !== null && typedSongStats !== undefined;
  const hasRepertoireStats = typedRepertoireStats !== null && typedRepertoireStats !== undefined;
  
  // Validar la existencia de propiedades específicas
  const hasRecentlyPlayedSongs = hasSongStats && 
    typedSongStats.notRecentlyPlayed && 
    typedSongStats.notRecentlyPlayed.songs && 
    typedSongStats.notRecentlyPlayed.songs.length > 0;
    
  const hasSongCategories = hasSongStats && 
    typedSongStats.byCategory && 
    typedSongStats.byCategory.length > 0;
    
  const hasRepertoireCategories = hasRepertoireStats && 
    typedRepertoireStats.byCategory && 
    typedRepertoireStats.byCategory.length > 0;
    
  const hasNeverPlayedSongs = hasSongStats && 
    typedSongStats.neverPlayed && 
    typedSongStats.neverPlayed.songs && 
    typedSongStats.neverPlayed.songs.length > 0;
    
  const hasNeverPlayedRepertoires = hasRepertoireStats && 
    typedRepertoireStats.neverPlayed && 
    typedRepertoireStats.neverPlayed.repertoires && 
    typedRepertoireStats.neverPlayed.repertoires.length > 0;

  if (!activeGroup) {
    return (
      <Alert variant="warning">
        No hay un grupo activo seleccionado. Por favor, selecciona o crea un grupo para ver estadísticas.
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Estadísticas canciones */}
      <Card className="md:col-span-2 p-6">
        <h3 className="text-lg font-medium mb-4">Estadísticas de canciones</h3>
        
        {isLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : !hasSongStats ? (
          <Alert variant="info">No hay datos de estadísticas disponibles para este grupo.</Alert>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Canciones no tocadas recientemente</h4>
              {hasRecentlyPlayedSongs ? (
                <div className="space-y-2">
                  {typedSongStats.notRecentlyPlayed.songs.slice(0, 3).map((song) => (
                    <div key={song._id} className="border rounded p-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-xs text-gray-500">
                          {song.lastPlayed 
                            ? `Última vez: ${formatDate(song.lastPlayed)}` 
                            : 'Nunca tocada'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/songs/${song._id}`}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Todas las canciones se han tocado recientemente.</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Canciones por categoría</h4>
              {hasSongCategories ? (
                <div className="space-y-4">
                  {typedSongStats.byCategory.map((category) => (
                    <div key={category.category} className="border-b pb-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-gray-500">{category.count} canciones</span>
                      </div>
                      
                      {category.songs.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm text-gray-500 mb-1">Más tocadas:</h5>
                          {category.songs.slice(0, 1).map((song) => (
                            <div key={song._id} className="flex justify-between items-center mt-1 bg-gray-50 p-2 rounded">
                              <span>{song.title}</span>
                              <span className="text-xs text-gray-500">{song.playCount} veces</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay categorías de canciones disponibles.</p>
              )}
            </div>
            
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/songs'}
              >
                Ver todas las canciones
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Estadísticas repertorios */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Estadísticas de repertorios</h3>
        
        {isLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : !hasRepertoireStats ? (
          <Alert variant="info">No hay datos de estadísticas disponibles para este grupo.</Alert>
        ) : (
          <div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Por categoría</h4>
              {hasRepertoireCategories ? (
                <div className="space-y-4">
                  {typedRepertoireStats.byCategory.map((category) => (
                    <div key={category.category} className="border-b pb-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-gray-500">{category.count} repertorios</span>
                      </div>
                      
                      {category.repertoires.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm text-gray-500 mb-1">No tocado desde hace tiempo:</h4>
                          {category.repertoires.slice(0, 1).map((repertoire) => (
                            <div key={repertoire._id} className="flex justify-between items-center mt-1 bg-gray-50 p-2 rounded">
                              <span>{repertoire.name}</span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.location.href = `/repertoires/${repertoire._id}`}
                              >
                                Ver
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay categorías de repertorios disponibles.</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Recomendaciones */}
      <Card className="md:col-span-3 p-6">
        <h3 className="text-lg font-medium mb-4">Recomendaciones</h3>
        
        <div className="space-y-4">
          {/* Canciones nunca tocadas */}
          {hasNeverPlayedSongs ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Canciones nunca tocadas</h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>Hay {typedSongStats?.neverPlayed?.count} canciones que nunca han sido tocadas.</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {typedSongStats?.neverPlayed?.songs?.slice(0, 3).map((song) => (
                        <li key={song._id}>{song.title}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Todas las canciones han sido tocadas</h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>¡Felicitaciones! Todas las canciones han sido tocadas al menos una vez.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Repertorios nunca tocados */}
          {hasNeverPlayedRepertoires ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Repertorios nunca tocados</h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>Hay {typedRepertoireStats?.neverPlayed?.count} repertorios que nunca han sido tocados.</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {typedRepertoireStats?.neverPlayed?.repertoires?.slice(0, 3).map((repertoire) => (
                        <li key={repertoire._id}>{repertoire.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Todos los repertorios han sido tocados</h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>¡Felicitaciones! Todos los repertorios han sido tocados al menos una vez.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Alert variant="info">
            Esta página seguirá mejorando. Próximamente se añadirán más funcionalidades administrativas.
          </Alert>
        </div>
      </Card>
    </div>
  );
};

// Componente para la pestaña de usuarios
const UsersTab = () => {
  const { activeGroup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar miembros del grupo activo
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!activeGroup) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Aquí usaríamos una llamada API para obtener los miembros del grupo con detalles
        // Como API de ejemplo, utilizamos la información que ya tenemos
        const response = await api.get(`/groups/${activeGroup._id}/members`);
        
        if (response.data && response.data.data) {
          setMembers(response.data.data);
        } else {
          // Fallback: Si la API no existe, creamos datos de ejemplo basados en IDs
          const mockMembers = (activeGroup.members || []).map((memberId, index) => {
            // Si ya es un objeto, usar sus propiedades
            if (typeof memberId === 'object' && memberId !== null) {
              return {
                _id: memberId._id || `member-${index}`,
                username: memberId.username || `Usuario ${index + 1}`,
                email: memberId.email || `usuario${index + 1}@ejemplo.com`,
                role: memberId.role || 'user',
                joinedAt: memberId.joinedAt || new Date().toISOString()
              };
            }
            
            // Si es string (ID), crear un objeto simulado
            return {
              _id: memberId,
              username: `Usuario ${index + 1}`,
              email: `usuario${index + 1}@ejemplo.com`,
              role: index === 0 ? 'admin' : 'user',
              joinedAt: new Date().toISOString()
            };
          });
          
          setMembers(mockMembers);
        }
      } catch (error) {
        console.error('Error al cargar miembros del grupo:', error);
        setError('Error al cargar los miembros del grupo');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroupMembers();
  }, [activeGroup]);

  // Filtrar miembros por búsqueda
  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      member.username?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term) ||
      member.role?.toLowerCase().includes(term)
    );
  });

  return (
    <Card>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestión de usuarios</h3>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <p>En esta sección puedes gestionar los usuarios de la aplicación y miembros de grupos.</p>
        </div>
        
        {activeGroup ? (
          <div className="mt-5">
            <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-md mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Grupo: {activeGroup.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Líder: {typeof activeGroup.leader === 'object' ? activeGroup.leader?.username : 'No especificado'}
              </p>
              
              <div className="mt-4 flex items-center">
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  className="w-full md:w-80 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando usuarios...</p>
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-dark-600 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rol
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Miembro desde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {filteredMembers.map((member) => (
                      <tr key={member._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.username || 'Usuario sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {member.email || 'Email no disponible'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.role === 'admin' 
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                              : member.role === 'moderator'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {member.role === 'admin' 
                              ? 'Administrador' 
                              : member.role === 'moderator'
                                ? 'Moderador'
                                : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Activo
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {member.joinedAt 
                            ? formatDate(member.joinedAt) 
                            : 'Fecha desconocida'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-dark-700 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'No se encontraron usuarios que coincidan con la búsqueda.' 
                    : 'No hay miembros en este grupo.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Alert variant="warning" className="mt-4">
            No hay un grupo activo seleccionado. Por favor, selecciona o crea un grupo para ver sus miembros.
          </Alert>
        )}
      </div>
    </Card>
  );
};

// Componente para la pestaña de canciones
const SongsTab = () => {
  return (
    <Card>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestión de canciones</h3>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <p>En esta sección podrás gestionar todas las canciones del sistema.</p>
        </div>
        <div className="mt-5">
          <Button variant="primary" onClick={() => window.location.href = '/songs'}>
            Ir a la página de canciones
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Componente para la pestaña de repertorios
const RepertoiresTab = () => {
  return (
    <Card>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestión de repertorios</h3>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <p>En esta sección podrás gestionar todos los repertorios del sistema.</p>
        </div>
        <div className="mt-5">
          <Button variant="primary" onClick={() => window.location.href = '/repertoires'}>
            Ir a la página de repertorios
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AdminPage;