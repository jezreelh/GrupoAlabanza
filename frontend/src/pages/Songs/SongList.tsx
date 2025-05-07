import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MusicalNoteIcon, MagnifyingGlassIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { songService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

type Song = {
  _id: string;
  title: string;
  author: string;
  category?: string;
  key?: string;
  tags?: string[];
  lastPlayed?: string;
  playHistory?: Array<{
    date: string;
    notes?: string;
    event?: string;
  }>;
  group?: any;
};

// Categorías predefinidas
const CATEGORIES = ['Adoración', 'Alabanza', 'Ofrenda', 'Comunión', 'Jubilo', 'Otro'];

// Etiquetas populares
const POPULAR_TAGS = ['Rápida', 'Lenta', 'Entrada', 'Juventud', 'Navidad', 'Pascua'];

const SongList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { activeGroup } = useAuth();
  
  const { isLoading, error, data } = useQuery({
    queryKey: ['songs', activeGroup?._id],
    queryFn: () => songService.getAllSongs({ group: activeGroup?._id }),
    enabled: !!activeGroup
  });

  // Manejar selección de categoría
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null); // Deseleccionar si ya estaba seleccionada
    } else {
      setSelectedCategory(category);
      setSearchTerm(''); // Limpiar búsqueda al filtrar por categoría
    }
  };

  // Manejar selección de etiqueta
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deseleccionar si ya estaba seleccionada
    } else {
      setSelectedTag(tag);
      setSearchTerm(''); // Limpiar búsqueda al filtrar por etiqueta
    }
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm('');
  };

  // Filtrar canciones basado en el término de búsqueda, categoría y etiqueta
  const filteredSongs = Array.isArray(data) 
    ? data.filter((song: Song) => {
        // Filtrar por categoría si hay una seleccionada
        if (selectedCategory && song.category !== selectedCategory) {
          return false;
        }

        // Filtrar por etiqueta si hay una seleccionada
        if (selectedTag && (!song.tags || !song.tags.includes(selectedTag))) {
          return false;
        }

        // Filtrar por término de búsqueda
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          song.title?.toLowerCase().includes(searchLower) ||
          song.author?.toLowerCase().includes(searchLower) ||
          song.key?.toLowerCase().includes(searchLower) ||
          song.category?.toLowerCase().includes(searchLower) ||
          (song.tags && song.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      })
    : [];

  // Obtener la última fecha en que se tocó la canción
  const getLastPlayedDate = (song: Song) => {
    if (!song.lastPlayed || !song.playHistory || song.playHistory.length === 0) return null;
    const lastPlayed = song.playHistory[song.playHistory.length - 1].date;
    return formatDate(lastPlayed);
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Canciones</h1>
        <Link to="/songs/new">
          <Button className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Canción
          </Button>
        </Link>
      </div>

      {/* Buscador y filtros */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* Buscador */}
          <div className="max-w-xl">
            <Input
              placeholder="Buscar por título, autor, tonalidad o etiquetas..."
              type="search"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          {/* Filtros por categoría */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Filtrar por categoría:</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtros rápidos por etiquetas populares */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Etiquetas populares:</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {(selectedCategory || selectedTag || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <Alert variant="error">Error al cargar las canciones. Por favor, intenta de nuevo.</Alert>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : !activeGroup ? (
        <Alert variant="warning">
          No hay un grupo activo seleccionado. Por favor, selecciona o crea un grupo para ver sus canciones.
        </Alert>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-10">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay canciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedCategory || selectedTag || searchTerm
              ? 'No se encontraron canciones que coincidan con los filtros aplicados.'
              : 'Comienza añadiendo tu primera canción.'}
          </p>
          {!(selectedCategory || selectedTag || searchTerm) && (
            <div className="mt-6">
              <Link to="/songs/new">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Canción
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song: Song) => (
            <Link key={song._id} to={`/songs/${song._id}`}>
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary hover:border cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{song.title}</h3>
                    <p className="text-gray-600 text-sm">{song.author}</p>
                  </div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-800">
                    {song.key}
                  </div>
                </div>

                <div className="mt-3 flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    song.category === 'Adoración' ? 'bg-blue-100 text-blue-800' :
                    song.category === 'Alabanza' ? 'bg-green-100 text-green-800' :
                    song.category === 'Jubilo' ? 'bg-orange-100 text-orange-800' :
                    song.category === 'Ofrenda' ? 'bg-yellow-100 text-yellow-800' :
                    song.category === 'Comunión' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {song.category || 'Sin categoría'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {song.tags?.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {getLastPlayedDate(song) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Tocada: {getLastPlayedDate(song)}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default SongList; 