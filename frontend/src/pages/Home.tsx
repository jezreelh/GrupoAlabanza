import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MusicalNoteIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { songService, repertoireService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Nota: Para implementar un diseño de Figma en el futuro:
// 1. Exporta los componentes SVG/imágenes desde Figma
// 2. Copia los valores de colores, tamaños y espaciados exactos
// 3. Convierte los estilos de Figma a clases de Tailwind o CSS personalizado
// 4. Mantén la misma estructura de componentes que hayas creado en Figma
// 5. Para una integración más profunda, considera usar herramientas como Figma-to-React

const Home = () => {
  const { isAuthenticated, user, activeGroup } = useAuth();
  const [recentCount, setRecentCount] = useState(3);

  // Obtener canciones recientes
  const { data: songs, isLoading: loadingSongs } = useQuery({
    queryKey: ['songs', 'recent', activeGroup?._id],
    queryFn: () => songService.getAllSongs({ 
      limit: 10, 
      group: activeGroup?._id 
    }),
    enabled: !!activeGroup
  });

  // Obtener repertorios recientes
  const { data: repertoires, isLoading: loadingRepertoires } = useQuery({
    queryKey: ['repertoires', 'recent', activeGroup?._id],
    queryFn: () => repertoireService.getAllRepertoires({ 
      limit: 10, 
      group: activeGroup?._id 
    }),
    enabled: !!activeGroup
  });

  // Ajustar el número de elementos a mostrar basado en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setRecentCount(4);
      } else if (window.innerWidth >= 768) {
        setRecentCount(3);
      } else {
        setRecentCount(2);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout>
      {/* Hero Section - Esto podría ser reemplazado por un componente de hero diseñado en Figma */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl overflow-hidden mb-10">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {isAuthenticated ? `¡Bienvenido, ${user?.username}!` : 'Grupo Alabanza'}
          </h1>
          <p className="mt-2 text-lg text-blue-100 max-w-2xl">
            Administra tus canciones y repertorios para el ministerio de alabanza.
          </p>
          {!isAuthenticated ? (
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg">Comenzar ahora</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          ) : !activeGroup ? (
            <div className="mt-6">
              <Link to="/groups">
                <Button size="lg">Gestionar mis grupos</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/songs">
                <Button size="lg" className="flex items-center">
                  <MusicalNoteIcon className="h-5 w-5 mr-2" />
                  Ver mis canciones
                </Button>
              </Link>
              <Link to="/repertoires">
                <Button variant="secondary" size="lg" className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Ver mis repertorios
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Características - Sección que podría utilizar iconos y diseños específicos de Figma */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Características</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="p-3 rounded-full bg-blue-100 mb-4">
              <MusicalNoteIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gestión de Canciones</h3>
            <p className="text-gray-600">
              Organiza todas tus canciones con letras, acordes y etiquetas para encontrarlas fácilmente.
            </p>
          </Card>
          
          <Card className="flex flex-col items-center text-center p-6">
            <div className="p-3 rounded-full bg-green-100 mb-4">
              <BookOpenIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Repertorios</h3>
            <p className="text-gray-600">
              Crea colecciones de canciones para diferentes servicios y eventos de tu iglesia.
            </p>
          </Card>
          
          <Card className="flex flex-col items-center text-center p-6">
            <div className="p-3 rounded-full bg-purple-100 mb-4">
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Colaboración en Equipo</h3>
            <p className="text-gray-600">
              Comparte repertorios y canciones con los miembros de tu grupo de alabanza.
            </p>
          </Card>
        </div>
      </div>

      {/* Contenido reciente - Esta sección podría adaptarse al diseño de tarjetas de Figma */}
      {isAuthenticated && activeGroup && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Canciones recientes</h2>
              <Link to="/songs" className="text-primary hover:underline text-sm font-medium">
                Ver todas
              </Link>
            </div>
            
            {loadingSongs ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : !songs || songs.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600 mb-4">No hay canciones disponibles</p>
                <Link to="/songs/new">
                  <Button>Crear canción</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {songs.slice(0, recentCount).map((song: any) => (
                  <Link key={song._id} to={`/songs/${song._id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{song.title}</h3>
                        <p className="text-gray-600 text-sm">{song.author}</p>
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-800">
                        {song.key}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Repertorios recientes</h2>
              <Link to="/repertoires" className="text-primary hover:underline text-sm font-medium">
                Ver todos
              </Link>
            </div>
            
            {loadingRepertoires ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : !repertoires || repertoires.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600 mb-4">No hay repertorios disponibles</p>
                <Link to="/repertoires/new">
                  <Button>Crear repertorio</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {repertoires.slice(0, recentCount).map((rep: any) => (
                  <Link key={rep._id} to={`/repertoires/${rep._id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(rep.date).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        <span>{rep.songs?.length || 0} canciones</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

// Componente para el icono de calendario
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default Home; 