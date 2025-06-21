import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MusicalNoteIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  DocumentArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { songService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, getRelativeTimeText } from '../../utils/dateUtils';

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
  const navigate = useNavigate();
  
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

  // Función para descargar PDF
  const handleDownloadPDF = (songId: string, songTitle: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevenir navegación
    event.stopPropagation(); // Prevenir propagación del evento
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const pdfUrl = `${backendUrl}/api/songs/${songId}/pdf`;
    
    // Crear un enlace temporal y hacer click en él para descargar
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `cancion_${songTitle.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para obtener el color de la categoría
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Adoración': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Alabanza': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Jubilo': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Ofrenda': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Comunión': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
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
        <div className="text-center py-8 col-span-full">
          <div className="max-w-md mx-auto">
            <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay canciones</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza agregando tu primera canción.
            </p>
            <div className="mt-6">
              <Link to="/songs/new">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Agregar canción
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song: Song) => (
            <Card 
              key={song._id} 
              withHover 
              className="transition-all duration-200 hover:shadow-lg"
            >
              <Link to={`/songs/${song._id}`} className="block">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{song.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {song.author && `Autor: ${song.author}`}
                      {song.author && song.key && ' • '}
                      {song.key && `Tonalidad: ${song.key}`}
                    </p>
                    
                    {/* Categoría */}
                    {song.category && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(song.category)}`}>
                          {song.category}
                        </span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {song.tags && song.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {song.tags.map((tag: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Canción
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default SongList; 