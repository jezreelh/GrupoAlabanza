import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpenIcon, MagnifyingGlassIcon, PlusIcon, CalendarIcon, UserGroupIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { repertoireService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

type Repertoire = {
  _id: string;
  name: string;
  date: string;
  description?: string;
  group: {
    _id: string;
    name: string;
  };
  songs: {
    _id: string;
    title: string;
    key: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
  };
  category?: string;
};

const RepertoireList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllGroups, setShowAllGroups] = useState(false);
  const { isAuthenticated, activeGroup, userGroups } = useAuth();
  
  const { isLoading, error, data: allRepertoires } = useQuery({
    queryKey: ['repertoires'],
    queryFn: repertoireService.getAllRepertoires
  });

  // Primero filtramos por grupo
  const groupFilteredRepertoires = allRepertoires?.filter((repertoire: Repertoire) => {
    if (!activeGroup) return false;
    
    if (showAllGroups) {
      // Si se muestra de todos los grupos, asegurarse de que sea un grupo al que pertenece el usuario
      return userGroups.some(group => group._id === repertoire.group?._id);
    } else {
      // Solo mostrar los del grupo activo
      return repertoire.group?._id === activeGroup._id;
    }
  });

  // Luego aplicamos el filtro de búsqueda
  const filteredRepertoires = groupFilteredRepertoires?.filter((repertoire: Repertoire) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      repertoire.name.toLowerCase().includes(searchLower) ||
      (repertoire.description && repertoire.description.toLowerCase().includes(searchLower)) ||
      (repertoire.date && formatDate(repertoire.date).toLowerCase().includes(searchLower)) ||
      (repertoire.category && repertoire.category.toLowerCase().includes(searchLower)) ||
      (repertoire.songs && repertoire.songs.some(song => song.title.toLowerCase().includes(searchLower))) ||
      (repertoire.group?.name && repertoire.group.name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Repertorios</h1>
          {activeGroup && (
            <p className="text-gray-600 mt-1">
              {showAllGroups 
                ? 'Mostrando repertorios de todos tus grupos' 
                : `Mostrando repertorios del grupo: ${activeGroup.name}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isAuthenticated && activeGroup && (
            <Link to="/repertoires/new">
              <Button className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Repertorio
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-grow max-w-xl">
            <Input
              placeholder="Buscar por nombre, descripción o fecha..."
              type="search"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          {userGroups.length > 1 && (
            <div className="flex items-center self-end md:self-auto">
              <button 
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  showAllGroups 
                    ? 'bg-secondary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setShowAllGroups(!showAllGroups)}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {showAllGroups ? 'Todos mis grupos' : 'Solo grupo activo'}
              </button>
            </div>
          )}
        </div>
      </Card>

      {!activeGroup && (
        <Alert variant="warning" className="mb-6">
          No tienes un grupo activo seleccionado. Por favor, <Link to="/groups" className="underline">selecciona un grupo activo</Link> para ver sus repertorios.
        </Alert>
      )}

      {error ? (
        <Alert variant="error">Error al cargar los repertorios. Por favor, intenta de nuevo.</Alert>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredRepertoires?.length === 0 ? (
        <div className="text-center py-10">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay repertorios</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'No se encontraron repertorios que coincidan con tu búsqueda.' 
              : showAllGroups 
                ? 'No hay repertorios en ninguno de tus grupos.' 
                : `No hay repertorios en el grupo ${activeGroup?.name}.`}
          </p>
          {isAuthenticated && !searchTerm && activeGroup && (
            <div className="mt-6">
              <Link to="/repertoires/new">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Repertorio
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepertoires?.map((repertoire: Repertoire) => (
            <Link key={repertoire._id} to={`/repertoires/${repertoire._id}`}>
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary hover:border cursor-pointer">
                <div className="flex flex-col h-full">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{repertoire.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mt-1">
                      {repertoire.date && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(repertoire.date)}
                        </div>
                      )}
                      
                      {showAllGroups && repertoire.group && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {repertoire.group.name}
                        </div>
                      )}
                    </div>
                    
                    {repertoire.description && (
                      <p className="mt-2 text-gray-600 text-sm line-clamp-2">{repertoire.description}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex-grow">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      Canciones ({repertoire.songs?.length || 0})
                    </h4>
                    <ul className="space-y-1">
                      {repertoire.songs?.slice(0, 3).map(song => (
                        <li key={song._id} className="text-sm">
                          <div className="flex justify-between items-center">
                            <span className="truncate">{song.title}</span>
                            <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {song.key}
                            </span>
                          </div>
                        </li>
                      ))}
                      {repertoire.songs && repertoire.songs.length > 3 && (
                        <li className="text-xs text-gray-500 italic">
                          Y {repertoire.songs.length - 3} más...
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Creado por: {repertoire.createdBy?.username || 'Usuario desconocido'}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default RepertoireList; 