import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUturnLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { repertoireService, songService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';

type RepertoireFormData = {
  name: string;
  date: string;
  description: string;
  group: string;
  songs: string[];
  category: string;
};

const RepertoireForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [error, setError] = useState('');
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const { user, activeGroup, userGroups } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<RepertoireFormData>({
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      group: activeGroup?._id || '',
      songs: [],
      category: 'Otro'
    }
  });
  
  // Cargar lista de canciones disponibles
  const { isLoading: isLoadingSongs, data: songsData } = useQuery({
    queryKey: ['songs'],
    queryFn: songService.getAllSongs
  });
  
  // Cargar datos si estamos editando
  const { isLoading: isLoadingRepertoire, data: repertoireData, error: repertoireError } = useQuery({
    queryKey: ['repertoire', id],
    queryFn: () => repertoireService.getRepertoireById(id as string),
    enabled: isEditing
  });
  
  // Usar useEffect para manejar los datos cargados
  useEffect(() => {
    if (repertoireData) {
      reset({
        name: repertoireData.name || '',
        date: repertoireData.date ? new Date(repertoireData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: repertoireData.description || '',
        group: repertoireData.group?._id || activeGroup?._id || '',
        songs: repertoireData.songs?.map((song: any) => song._id) || [],
        category: repertoireData.category || 'Otro'
      });
    }
  }, [repertoireData, reset, activeGroup]);
  
  // Manejar errores
  useEffect(() => {
    if (repertoireError) {
      setError('No se pudo cargar el repertorio para editar.');
    }
  }, [repertoireError]);
  
  // Mutación para crear/editar
  const mutation = useMutation({
    mutationFn: (data: RepertoireFormData) => {
      if (isEditing) {
        return repertoireService.updateRepertoire(id as string, {
          ...data,
          createdBy: user?.id
        });
      } else {
        return repertoireService.createRepertoire({
          ...data,
          createdBy: user?.id
        });
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['repertoires'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['repertoire', id] });
        navigate(`/repertoires/${id}`);
      } else if (data && data._id) {
        navigate(`/repertoires/${data._id}`);
      } else {
        navigate('/repertoires');
      }
    },
    onError: (error: any) => {
      console.error('Error en mutación:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = `Error al ${isEditing ? 'actualizar' : 'crear'} el repertorio. `;
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage += error.response.data.message;
        }
      }
      
      setError(errorMessage);
    }
  });
  
  const onSubmit = (data: RepertoireFormData) => {
    // Limpiar cualquier error previo
    setError('');
    
    // Asegurarnos de que todos los campos obligatorios estén presentes
    if (!data.name.trim()) {
      setError('El nombre del repertorio es obligatorio');
      return;
    }
    
    if (!data.group) {
      setError('Debes seleccionar un grupo para el repertorio');
      return;
    }
    
    mutation.mutate(data);
  };
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Repertorio' : 'Nuevo Repertorio'}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => navigate(isEditing ? `/repertoires/${id}` : '/repertoires')}
          className="flex items-center"
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Cancelar
        </Button>
      </div>
      
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}
      
      {!userGroups.length && (
        <Alert variant="warning" className="mb-6">
          No perteneces a ningún grupo. Debes <Link to="/groups" className="underline">unirte o crear un grupo</Link> antes de poder crear repertorios.
        </Alert>
      )}
      
      {isEditing && isLoadingRepertoire ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Información general */}
            <Card title="Información General" className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Nombre del Repertorio"
                    id="name"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'El nombre es obligatorio',
                      minLength: {
                        value: 3,
                        message: 'El nombre debe tener al menos 3 caracteres',
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Input
                    label="Fecha"
                    id="date"
                    type="date"
                    error={errors.date?.message}
                    {...register('date')}
                  />
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                      Categoría
                    </label>
                    <select
                      id="category"
                      className={`form-select w-full ${errors.category ? 'border-red-500' : ''}`}
                      {...register('category')}
                    >
                      <option value="Alabanza">Alabanza</option>
                      <option value="Adoración">Adoración</option>
                      <option value="Jubilo">Jubilo</option>
                      <option value="Ofrenda">Ofrenda</option>
                      <option value="Comunión">Comunión</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {errors.category?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="group">
                      Grupo
                    </label>
                    <select
                      id="group"
                      className={`form-select w-full ${errors.group ? 'border-red-500' : ''}`}
                      {...register('group', { required: 'Debes seleccionar un grupo' })}
                    >
                      <option value="">Seleccionar grupo</option>
                      {userGroups.map(group => (
                        <option 
                          key={group._id} 
                          value={group._id}
                          selected={group._id === (watch('group') || activeGroup?._id)}
                        >
                          {group.name} {group._id === activeGroup?._id ? '(Activo)' : ''}
                        </option>
                      ))}
                    </select>
                    {errors.group?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.group.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className={`form-input ${errors.description ? 'border-red-500' : ''}`}
                      placeholder="Descripción opcional para este repertorio..."
                      {...register('description')}
                    ></textarea>
                    {errors.description?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Selección de canciones */}
            <Card title={`Canciones ${watch('songs')?.length > 0 ? `(${watch('songs').length} seleccionadas)` : ''}`} className="md:col-span-2">
              {isLoadingSongs ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando canciones...</p>
                </div>
              ) : !songsData || songsData.length === 0 ? (
                <Alert variant="info">
                  No hay canciones disponibles. <Link to="/songs/new" className="text-primary hover:underline">Crear una canción</Link> primero.
                </Alert>
              ) : (
                <div>
                  {/* Buscador de canciones */}
                  <div className="mb-4">
                    <Input
                      placeholder="Buscar canciones por nombre..."
                      type="search"
                      value={songSearchTerm}
                      onChange={(e) => setSongSearchTerm(e.target.value)}
                      icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                  
                  {/* Botones de selección rápida */}
                  <div className="mb-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filteredSongs = songsData.filter((song: any) => 
                          song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
                          (song.author && song.author.toLowerCase().includes(songSearchTerm.toLowerCase())) ||
                          (song.key && song.key.toLowerCase().includes(songSearchTerm.toLowerCase()))
                        );
                        const currentSongs = watch('songs') || [];
                        const filteredSongIds = filteredSongs.map((song: any) => song._id);
                        const newSongs = [...new Set([...currentSongs, ...filteredSongIds])];
                        reset({ ...watch(), songs: newSongs });
                      }}
                    >
                      Seleccionar {songSearchTerm ? 'filtradas' : 'todas'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (songSearchTerm) {
                          const filteredSongs = songsData.filter((song: any) => 
                            song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
                            (song.author && song.author.toLowerCase().includes(songSearchTerm.toLowerCase())) ||
                            (song.key && song.key.toLowerCase().includes(songSearchTerm.toLowerCase()))
                          );
                          const currentSongs = watch('songs') || [];
                          const filteredSongIds = filteredSongs.map((song: any) => song._id);
                          const newSongs = currentSongs.filter((songId: string) => !filteredSongIds.includes(songId));
                          reset({ ...watch(), songs: newSongs });
                        } else {
                          reset({ ...watch(), songs: [] });
                        }
                      }}
                    >
                      Deseleccionar {songSearchTerm ? 'filtradas' : 'todas'}
                    </Button>
                  </div>
                  
                  {/* Lista de canciones filtradas */}
                  <div className="overflow-y-auto max-h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {songsData
                        .filter((song: any) => 
                          song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
                          (song.author && song.author.toLowerCase().includes(songSearchTerm.toLowerCase())) ||
                          (song.key && song.key.toLowerCase().includes(songSearchTerm.toLowerCase()))
                        )
                        .map((song: any) => (
                          <div key={song._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`song-${song._id}`}
                              value={song._id}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                              {...register('songs')}
                            />
                            <label htmlFor={`song-${song._id}`} className="ml-2 block cursor-pointer flex-1">
                              <span className="font-medium">{song.title}</span>
                              <span className="ml-2 text-sm text-gray-500">({song.key})</span>
                              {song.author && <p className="text-xs text-gray-500">{song.author}</p>}
                            </label>
                          </div>
                        ))}
                    </div>
                    
                    {/* Mensaje cuando no hay resultados */}
                    {songSearchTerm && songsData.filter((song: any) => 
                      song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
                      (song.author && song.author.toLowerCase().includes(songSearchTerm.toLowerCase())) ||
                      (song.key && song.key.toLowerCase().includes(songSearchTerm.toLowerCase()))
                    ).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No se encontraron canciones que coincidan con "{songSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/repertoires/${id}` : '/repertoires')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !userGroups.length}
              isLoading={mutation.isPending}
            >
              {isEditing ? 'Actualizar' : 'Crear'} Repertorio
            </Button>
          </div>
        </form>
      )}
    </Layout>
  );
};

export default RepertoireForm; 