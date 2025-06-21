import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowUturnLeftIcon,
  HandThumbUpIcon,
  LinkIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { songService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, getRelativeTimeText } from '../../utils/dateUtils';

// Nuevos tipos para enlaces multimedia
type MediaLink = {
  _id: string;
  title: string;
  url: string;
  platform: string;
};

type MediaLinkFormData = {
  title: string;
  url: string;
  platform: string;
};

const PLATFORMS = ['YouTube', 'Spotify', 'Instagram', 'TikTok', 'Otro'];

const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estado para el formulario de enlaces multimedia
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaFormData, setMediaFormData] = useState<MediaLinkFormData>({
    title: '',
    url: '',
    platform: 'YouTube'
  });
  const [mediaFormError, setMediaFormError] = useState('');
  
  const { isLoading, error, data: song } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songService.getSongById(id as string),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: () => songService.deleteSong(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      navigate('/songs');
    }
  });

  const playMutation = useMutation({
    mutationFn: () => songService.markSongAsPlayed(id as string),
    onSuccess: (data) => {
      console.log('Canción marcada como tocada:', data);
      queryClient.invalidateQueries({ queryKey: ['song', id] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error) => {
      console.error('Error al marcar canción como tocada:', error);
    }
  });
  
  // Mutación para añadir enlace multimedia
  const addMediaLinkMutation = useMutation({
    mutationFn: (linkData: MediaLinkFormData) => 
      songService.addMediaLink(id as string, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', id] });
      setShowMediaForm(false);
      setMediaFormData({
        title: '',
        url: '',
        platform: 'YouTube'
      });
    },
    onError: (error: any) => {
      console.error('Error al añadir enlace multimedia:', error);
      setMediaFormError(
        error.response?.data?.message || 'Error al añadir el enlace multimedia'
      );
    }
  });
  
  // Mutación para eliminar enlace multimedia
  const removeMediaLinkMutation = useMutation({
    mutationFn: (linkId: string) => 
      songService.removeMediaLink(id as string, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', id] });
    }
  });
  
  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleMarkAsPlayed = () => {
    playMutation.mutate();
  };
  
  // Manejar envío del formulario de enlaces multimedia
  const handleAddMediaLink = () => {
    setMediaFormError('');
    
    if (!mediaFormData.title.trim()) {
      setMediaFormError('El título es obligatorio');
      return;
    }
    
    if (!mediaFormData.url.trim()) {
      setMediaFormError('La URL es obligatoria');
      return;
    }
    
    // Validación básica de URL
    try {
      new URL(mediaFormData.url);
    } catch (error) {
      setMediaFormError('La URL no es válida');
      return;
    }
    
    addMediaLinkMutation.mutate(mediaFormData);
  };
  
  // Manejar eliminación de enlace multimedia
  const handleRemoveMediaLink = (linkId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este enlace?')) {
      removeMediaLinkMutation.mutate(linkId);
    }
  };

  // Función para descargar PDF
  const handleDownloadPDF = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const pdfUrl = `${backendUrl}/api/songs/${id}/pdf`;
    
    // Crear un enlace temporal y hacer click en él para descargar
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `cancion_${song?.title?.replace(/\s+/g, '_') || 'cancion'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !song) {
    return (
      <Layout>
        <Alert variant="error" className="mb-4">
          Error al cargar los datos de la canción. Por favor, intenta de nuevo.
        </Alert>
        <Button 
          variant="outline" 
          onClick={() => navigate('/songs')}
          className="flex items-center"
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Volver a la lista
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header con acciones */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{song.title}</h1>
            <div className="bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-800">
              {song.key}
            </div>
          </div>
          <p className="text-gray-600 mt-1">{song.author}</p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/songs">
            <Button variant="outline" className="flex items-center">
              <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
              Volver
            </Button>
          </Link>
          
          {/* Botón para descargar PDF */}
          <Button 
            variant="secondary" 
            onClick={handleDownloadPDF}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Descargar PDF
          </Button>
          
          {isAuthenticated && (
            <>
              <Button 
                variant="secondary" 
                onClick={handleMarkAsPlayed}
                disabled={playMutation.isPending}
                className="flex items-center"
              >
                <HandThumbUpIcon className="h-5 w-5 mr-2" />
                Tocada hoy
              </Button>
              
              <Link to={`/songs/${id}/edit`}>
                <Button className="flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Editar
                </Button>
              </Link>
              
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                {showDeleteConfirm ? 'Confirmar' : 'Eliminar'}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {showDeleteConfirm && (
        <Alert variant="warning" className="mb-6">
          <div className="flex flex-col">
            <p className="font-medium">¿Estás seguro de que deseas eliminar esta canción?</p>
            <p className="text-sm">Esta acción no se puede deshacer.</p>
            <div className="mt-3 flex gap-2">
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Alert>
      )}
      
      {/* Grid de información */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Información General */}
        <Card title="Información General">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Tonalidad</p>
              <p className="font-medium">{song.key}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tempo</p>
              <p className="font-medium">{song.tempo} BPM</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-medium">{song.category || 'No especificada'}</p>
            </div>
            {song.playHistory && song.playHistory.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Última vez tocada</p>
                <p className="font-medium">{formatDate(song.playHistory[song.playHistory.length - 1].date)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Etiquetas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {song.tags && song.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
                {(!song.tags || song.tags.length === 0) && (
                  <span className="text-gray-500 text-sm">No hay etiquetas</span>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Enlaces multimedia */}
        <Card title="Enlaces multimedia">
          {isAuthenticated && (
            <div className="mb-4">
              {!showMediaForm ? (
                <Button 
                  variant="secondary" 
                  className="flex items-center text-sm" 
                  size="sm"
                  onClick={() => setShowMediaForm(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Añadir enlace
                </Button>
              ) : (
                <div className="border border-gray-200 rounded-md p-3 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Nuevo enlace multimedia</h3>
                    <button 
                      className="text-gray-400 hover:text-gray-600" 
                      onClick={() => {
                        setShowMediaForm(false);
                        setMediaFormError('');
                      }}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {mediaFormError && (
                    <Alert variant="error" className="mb-3 text-sm py-2">
                      {mediaFormError}
                    </Alert>
                  )}
                  
                  <div className="space-y-3">
                    <Input
                      label="Título"
                      value={mediaFormData.title}
                      onChange={(e) => setMediaFormData({...mediaFormData, title: e.target.value})}
                      placeholder="Ej: Video oficial, Versión acústica..."
                    />
                    
                    <Input
                      label="URL"
                      value={mediaFormData.url}
                      onChange={(e) => setMediaFormData({...mediaFormData, url: e.target.value})}
                      placeholder="https://..."
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plataforma
                      </label>
                      <select
                        className="form-select w-full text-sm"
                        value={mediaFormData.platform}
                        onChange={(e) => setMediaFormData({...mediaFormData, platform: e.target.value})}
                      >
                        {PLATFORMS.map(platform => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleAddMediaLink}
                        disabled={addMediaLinkMutation.isPending}
                        isLoading={addMediaLinkMutation.isPending}
                      >
                        Guardar enlace
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {song.mediaLinks && song.mediaLinks.length > 0 ? (
            <div className="space-y-3">
              {song.mediaLinks.map((link: MediaLink) => (
                <div key={link._id} className="flex items-start group">
                  <LinkIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-grow">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {link.title}
                    </a>
                    <p className="text-xs text-gray-500">
                      {link.platform}
                    </p>
                  </div>
                  {isAuthenticated && (
                    <button 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveMediaLink(link._id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No hay enlaces multimedia disponibles.
            </div>
          )}
        </Card>
        
        {/* Historial de reproducción */}
        <Card title="Historial de reproducción">
          {song.playHistory && song.playHistory.length > 0 ? (
            <div className="space-y-2">
              {[...song.playHistory].reverse().slice(0, 3).map((playRecord: any, index: number) => (
                <div key={index} className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="text-sm">{getRelativeTimeText(playRecord.date)}</div>
                </div>
              ))}
              {song.playHistory.length > 3 && (
                <div className="text-xs text-gray-500 mt-2">
                  Mostrando las 3 más recientes de {song.playHistory.length} fechas
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Esta canción aún no ha sido tocada.
            </div>
          )}
        </Card>
      </div>
      
      {/* Letra y acordes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Letra">
          <div className="whitespace-pre-line">{song.lyrics}</div>
        </Card>
        
        {song.chords && (
          <Card title="Acordes">
            <div className="whitespace-pre-line font-mono">{song.chords}</div>
          </Card>
        )}
      </div>
      
      {/* Notas adicionales */}
      {song.notes && (
        <Card title="Notas" className="mt-6">
          <div className="whitespace-pre-line">{song.notes}</div>
        </Card>
      )}
    </Layout>
  );
};

export default SongDetail; 