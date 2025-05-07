import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUturnLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { songService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';

// Tonalidades musicales comunes
const MUSIC_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

// Etiquetas predefinidas
const PREDEFINED_TAGS = ['Adoración', 'Alabanza', 'Rápida', 'Lenta', 'Comunión', 'Ofrenda', 'Navidad', 'Pascua', 'Entrada', 'Juventud'];

// Categorías disponibles
const CATEGORIES = ['Alabanza', 'Adoración', 'Jubilo', 'Ofrenda', 'Comunión', 'Otro'];

// Mapeo de campos a nombres amigables para mensajes de error
const FIELD_NAMES = {
  title: 'título',
  author: 'autor',
  lyrics: 'letra',
  key: 'tonalidad',
  tempo: 'tempo',
  category: 'categoría',
};

type SongFormData = {
  title: string;
  author: string;
  key: string;
  tempo: string;
  lyrics: string;
  chords: string;
  notes: string;
  tags: string[];
  group: string;
  category: string;
};

const SongForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [customTag, setCustomTag] = useState('');
  const [error, setError] = useState('');
  const { activeGroup, userGroups } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SongFormData>({
    defaultValues: {
      title: '',
      author: '',
      key: 'C',
      tempo: '80',
      lyrics: '',
      chords: '',
      notes: '',
      tags: [],
      group: activeGroup?._id || '',
      category: 'Otro',
    }
  });
  
  const selectedTags = watch('tags') || [];
  
  // Cargar datos si estamos editando
  const { isLoading: isLoadingSong, data: songData, error: songError } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songService.getSongById(id as string),
    enabled: isEditing
  });
  
  // Usar useEffect para manejar los datos cargados
  useEffect(() => {
    if (songData) {
      reset({
        title: songData.title || '',
        author: songData.author || '',
        key: songData.key || 'C',
        tempo: songData.tempo?.toString() || '80',
        lyrics: songData.lyrics || '',
        chords: songData.chords || '',
        notes: songData.notes || '',
        tags: songData.tags || [],
        group: songData.group?._id || activeGroup?._id || '',
        category: songData.category || 'Otro',
      });
    }
  }, [songData, reset, activeGroup]);
  
  // Manejar errores
  useEffect(() => {
    if (songError) {
      setError('No se pudo cargar la canción para editar.');
    }
  }, [songError]);
  
  // Mutación para crear/editar
  const mutation = useMutation({
    mutationFn: (data: SongFormData) => {
      if (isEditing) {
        return songService.updateSong(id as string, data);
      } else {
        return songService.createSong(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['song', id] });
        navigate(`/songs/${id}`);
      } else if (data && data._id) {
        navigate(`/songs/${data._id}`);
      } else {
        navigate('/songs');
      }
    },
    onError: (error: any) => {
      console.error('Error en mutación:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = `Error al ${isEditing ? 'actualizar' : 'crear'} la canción. `;
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage += error.response.data.message;
        }
        
        // Si hay errores específicos de validación
        if (error.response.data.error && error.response.data.error.includes('validation')) {
          errorMessage = 'Hay errores de validación. Por favor verifica los campos obligatorios.';
          
          // Destacar campos específicos si la API los menciona
          const errorFields = Object.keys(FIELD_NAMES).filter(field => 
            error.response.data.error.toLowerCase().includes(field.toLowerCase())
          );
          
          if (errorFields.length > 0) {
            const fieldNames = errorFields.map(f => FIELD_NAMES[f as keyof typeof FIELD_NAMES]).join(', ');
            errorMessage += ` Campos con problemas: ${fieldNames}.`;
          }
        }
      }
      
      setError(errorMessage);
    }
  });
  
  const onSubmit = (data: SongFormData) => {
    // Limpiar cualquier error previo
    setError('');
    
    // Asegurarnos de que todos los campos obligatorios estén presentes
    if (!data.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    if (!data.group) {
      setError('Debes seleccionar un grupo para la canción');
      return;
    }
    
    // Convertir tempo a número si es posible
    if (data.tempo) {
      data.tempo = parseInt(data.tempo.toString()).toString();
    }
    
    mutation.mutate(data);
  };
  
  const addTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setValue('tags', [...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setValue('tags', selectedTags.filter(tag => tag !== tagToRemove));
  };
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      removeTag(tag);
    } else {
      setValue('tags', [...selectedTags, tag]);
    }
  };
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Canción' : 'Nueva Canción'}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => navigate(isEditing ? `/songs/${id}` : '/songs')}
          className="flex items-center"
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Cancelar
        </Button>
      </div>
      
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}
      
      {!userGroups.length && (
        <Alert variant="warning" className="mb-6">
          No perteneces a ningún grupo. Debes <Link to="/groups" className="underline">unirte o crear un grupo</Link> antes de poder crear canciones.
        </Alert>
      )}
      
      {isEditing && isLoadingSong ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Información general */}
            <Card title="Información General" className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Título"
                    id="title"
                    error={errors.title?.message}
                    {...register('title', {
                      required: 'El título es obligatorio',
                      minLength: {
                        value: 2,
                        message: 'El título debe tener al menos 2 caracteres',
                      }
                    })}
                  />
                  
                  <Input
                    label="Autor/Compositor"
                    id="author"
                    error={errors.author?.message}
                    {...register('author', {
                      required: 'El autor es obligatorio',
                    })}
                  />
                  
                  {/* Selector de grupo */}
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
                  
                  {/* Selector de categoría */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                      Categoría
                    </label>
                    <select
                      id="category"
                      className={`form-select w-full ${errors.category ? 'border-red-500' : ''}`}
                      {...register('category', { required: 'Debes seleccionar una categoría' })}
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="key">
                      Tonalidad
                    </label>
                    <select
                      id="key"
                      className="form-input"
                      {...register('key', {
                        required: 'La tonalidad es obligatoria',
                      })}
                    >
                      {MUSIC_KEYS.map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    {errors.key?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.key.message}</p>
                    )}
                  </div>
                  
                  <Input
                    label="Tempo (BPM)"
                    id="tempo"
                    type="number"
                    error={errors.tempo?.message}
                    {...register('tempo', {
                      valueAsNumber: true,
                      min: {
                        value: 30,
                        message: 'El tempo mínimo es 30 BPM',
                      },
                      max: {
                        value: 240,
                        message: 'El tempo máximo es 240 BPM',
                      }
                    })}
                  />
                </div>
              </div>
            </Card>
            
            {/* Letra */}
            <Card title="Letra" className="md:col-span-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lyrics">
                  Letra de la canción
                </label>
                <textarea
                  id="lyrics"
                  rows={10}
                  className={`form-input ${errors.lyrics ? 'border-red-500' : ''}`}
                  placeholder="Ingresa la letra de la canción aquí..."
                  {...register('lyrics', {
                    required: 'La letra es obligatoria',
                  })}
                ></textarea>
                {errors.lyrics?.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.lyrics.message}</p>
                )}
              </div>
            </Card>
            
            {/* Etiquetas */}
            <Card title="Etiquetas" className="md:col-span-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {PREDEFINED_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Añadir etiqueta personalizada"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-grow"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="flex items-center"
                  variant="secondary"
                >
                  <PlusIcon className="h-5 w-5" />
                </Button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Etiquetas seleccionadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            
            {/* Acordes y notas */}
            <Card title="Acordes" className="md:col-span-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="chords">
                  Acordes
                </label>
                <textarea
                  id="chords"
                  rows={10}
                  className="form-input font-mono"
                  placeholder="Dm   A7   G   C..."
                  {...register('chords')}
                ></textarea>
              </div>
            </Card>
            
            <Card title="Notas adicionales" className="md:col-span-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
                  Notas o comentarios
                </label>
                <textarea
                  id="notes"
                  rows={10}
                  className="form-input"
                  placeholder="Notas adicionales, comentarios o instrucciones especiales para esta canción..."
                  {...register('notes')}
                ></textarea>
              </div>
            </Card>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/songs/${id}` : '/songs')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              {isEditing ? 'Actualizar' : 'Crear'} Canción
            </Button>
          </div>
        </form>
      )}
    </Layout>
  );
};

export default SongForm; 