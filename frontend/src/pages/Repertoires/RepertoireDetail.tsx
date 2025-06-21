/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowUturnLeftIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  LinkIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { repertoireService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import type { Repertoire, Song, Version, MediaLink, SongModification } from '../../types/models';

// Componente personalizado de alerta con soporte para onClose
interface CustomAlertProps {
  variant: "error" | "warning" | "success" | "info";
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ variant, className = "", children, onClose }) => {
  return (
    <div className={`relative ${className}`}>
      <Alert variant={variant}>
        {children}
      </Alert>
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Colores para categorías
const categoryColors = {
  'Adoración': 'bg-blue-100 text-blue-800',
  'Alabanza': 'bg-green-100 text-green-800',
  'Jubilo': 'bg-orange-100 text-orange-800',
  'Ofrenda': 'bg-yellow-100 text-yellow-800',
  'Comunión': 'bg-purple-100 text-purple-800',
  'Otro': 'bg-gray-100 text-gray-800'
};

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (versionData: any) => void;
  onDelete?: () => void;
  repertoire: Repertoire;
  editingVersion: Version | null;
}

// Componente modal para agregar/editar versión
const VersionModal: React.FC<VersionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  editingVersion = null 
}) => {
  const [name, setName] = useState(editingVersion?.name || '');
  const [notes, setNotes] = useState(editingVersion?.notes || '');
  
  useEffect(() => {
    if (editingVersion) {
      setName(editingVersion.name || '');
      setNotes(editingVersion.notes || '');
    } else {
      setName('');
      setNotes('');
    }
  }, [editingVersion]);
  
  const handleSave = () => {
    if (!name.trim()) return;
    
    const versionData = {
      name,
      notes,
      songModifications: editingVersion?.songModifications || []
    };
    
    onSave(versionData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {editingVersion ? 'Editar Versión' : 'Nueva Versión'}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre de la versión</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Versión para guitarra"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-md p-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={3}
              placeholder="Ej. Esta versión tiene acordes para guitarra acústica"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex justify-between items-center">
          <div>
            {editingVersion && onDelete && (
              <Button variant="danger" onClick={onDelete}>
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interfaz para el componente AllLyricsEditorModal
interface AllLyricsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifications: any[]) => void;
  repertoire: Repertoire;
  versionIndex: number;
}

// Componente para editar todas las letras juntas como bloc de notas - EDITOR COMPLETAMENTE LIBRE
const AllLyricsEditorModal: React.FC<AllLyricsEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  repertoire, 
  versionIndex 
}) => {
  // Estados para el editor libre
  const [currentText, setCurrentText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generar el texto inicial - PRIORIZAR TEXTO GUARDADO LIBRE
  const generateInitialText = () => {
    try {
      if (!repertoire || !repertoire.songs || !repertoire.versions) {
        return '';
      }
      
      if (versionIndex < 0 || versionIndex >= repertoire.versions.length) {
        return '';
      }
      
      const version = repertoire.versions[versionIndex];
      if (!version) return '';
      
      // NUEVA LÓGICA: Buscar si hay un texto libre guardado
      // Lo guardamos en la primera canción con una clave especial
      const freeTextMod = version.songModifications?.find(m => {
        return m && m.song && (m.song === '__FREE_TEXT__' || (typeof m.song === 'object' && m.song._id === '__FREE_TEXT__'));
      });
      
      if (freeTextMod && freeTextMod.modifiedLyrics) {
        // Si hay texto libre guardado, usarlo
        console.log('Usando texto libre guardado');
        return freeTextMod.modifiedLyrics;
      }
      
      // Si no hay texto libre guardado, generar desde las canciones individuales
      console.log('Generando texto desde canciones individuales');
      return repertoire.songs.map((song, index) => {
        if (!song || !song._id || !song.title) return '';
        
        // Buscar modificaciones para esta canción
        const mod = version.songModifications?.find(m => {
          if (!m || !m.song) return false;
          if (typeof m.song === 'string') return m.song === song._id;
          return m.song._id === song._id;
        });
        
        // Usar letra modificada si existe, de lo contrario la original
        const lyrics = mod?.modifiedLyrics || song.lyrics || '';
        
        // Formato simple
        return `--- CANCIÓN ${index + 1}: ${song.title} ---\n\n${lyrics}\n\n--- FIN CANCIÓN ${index + 1} ---\n\n`;
      }).filter(Boolean).join('');
    } catch (error) {
      console.error('Error al generar texto inicial:', error);
      return '';
    }
  };
  
  // Inicializar textos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initialText = generateInitialText();
      setOriginalText(initialText);
      setCurrentText(initialText);
    }
  }, [isOpen, repertoire, versionIndex]);
  
  // Función para restaurar texto original - AHORA SÍ FUNCIONA
  const handleRestoreOriginalText = () => {
    console.log('Restaurando al texto original...');
    
    // Generar texto desde las canciones originales (sin modificaciones de texto libre)
    try {
      if (!repertoire || !repertoire.songs) {
        setCurrentText('');
        return;
      }
      
      const originalFromSongs = repertoire.songs.map((song, index) => {
        if (!song || !song._id || !song.title) return '';
        
        // Usar SOLO la letra original de la canción, sin modificaciones
        const lyrics = song.lyrics || '';
        
        return `--- CANCIÓN ${index + 1}: ${song.title} ---\n\n${lyrics}\n\n--- FIN CANCIÓN ${index + 1} ---\n\n`;
      }).filter(Boolean).join('');
      
      setCurrentText(originalFromSongs);
      console.log('Texto restaurado al original desde canciones base');
    } catch (error) {
      console.error('Error al restaurar texto original:', error);
      setCurrentText(originalText); // Fallback al texto original cargado
    }
  };
  
  // Guardar cambios - GUARDAR TEXTO LIBRE COMPLETO
  const handleSaveModifications = () => {
    try {
      setIsSubmitting(true);
      
      if (!repertoire || !repertoire.songs) {
        console.error('El repertorio no está disponible');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Guardando texto libre completo...');
      const modifications: any[] = [];
      
      // NUEVA ESTRATEGIA: Guardar el texto completo como texto libre
      // Usar una ID especial para el texto libre
      modifications.push({
        song: '__FREE_TEXT__',
        modifiedLyrics: currentText
      });
      
      // OPCIONAL: También intentar extraer canciones individuales para compatibilidad
      // Esto mantiene la funcionalidad existente pero no es la fuente principal
      repertoire.songs.forEach((song, index) => {
        try {
          const songPattern = `--- CANCIÓN ${index + 1}: ${song.title} ---`;
          const endPattern = `--- FIN CANCIÓN ${index + 1} ---`;
          
          const startIndex = currentText.indexOf(songPattern);
          if (startIndex !== -1) {
            const contentStart = startIndex + songPattern.length + 2;
            let contentEnd = currentText.indexOf(endPattern, contentStart);
            
            if (contentEnd === -1) {
              const nextPattern = `--- CANCIÓN ${index + 2}: `;
              contentEnd = currentText.indexOf(nextPattern, contentStart);
              if (contentEnd === -1) {
                contentEnd = currentText.length;
              }
            }
            
            const songLyrics = currentText.substring(contentStart, contentEnd).trim();
            
            modifications.push({
              song: song._id,
              modifiedLyrics: songLyrics
            });
          } else {
            // Si no encuentra la canción, guardar como vacía
            modifications.push({
              song: song._id,
              modifiedLyrics: ''
            });
          }
        } catch (err) {
          console.error(`Error al procesar canción ${song.title}:`, err);
          modifications.push({
            song: song._id,
            modifiedLyrics: ''
          });
        }
      });
      
      console.log('Guardando modificaciones libres (incluyendo texto completo):', modifications);
      
      // Llamar onSave con todas las modificaciones
      onSave(modifications);
      
    } catch (error) {
      console.error('Error al procesar las modificaciones:', error);
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b sticky top-0 bg-white dark:bg-dark-700 z-10">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Editar letras para versión: {repertoire?.versions?.[versionIndex]?.name || 'Sin nombre'}</h3>
          <p className="text-sm text-gray-500 mt-1">
            <strong>Editor libre:</strong> Puedes agregar, quitar, modificar cualquier texto. Los cambios se guardarán exactamente como los escribas.
          </p>
        </div>
        
        <div className="p-4">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-full border border-gray-300 dark:border-dark-600 rounded-md p-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
            style={{ height: '60vh' }}
            placeholder="Escribe y edita libremente aquí... Puedes agregar, quitar o modificar cualquier cosa."
          />
        </div>
        
        <div className="p-4 border-t sticky bottom-0 bg-white dark:bg-dark-700 flex justify-between items-center">
          <button
            type="button"
            onClick={handleRestoreOriginalText}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
            disabled={isSubmitting}
          >
            Restaurar texto original
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveModifications}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ComponentErrorBoundary para capturar errores no manejados
class VersionErrorBoundary extends React.Component<{ children: React.ReactNode, onError: (error: Error) => void, resetKey: any }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, onError: (error: Error) => void, resetKey: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error en componente de versiones:", error, errorInfo);
    this.props.onError(error);
  }

  componentDidUpdate(prevProps: { resetKey: any }) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
          <h3 className="text-lg font-medium">Ha ocurrido un error inesperado</h3>
          <p className="mt-2">
            Se ha producido un error al procesar la información de versiones.
            Intente refrescar la página o volver al listado de repertorios.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const RepertoireDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, activeGroup, userGroups } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para modales
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [isAllLyricsEditorOpen, setIsAllLyricsEditorOpen] = useState(false);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);
  
  // Obtener el repertorio
  const { isLoading, error, data: repertoire, refetch } = useQuery<Repertoire, Error>({
    queryKey: ['repertoire', id],
    queryFn: () => repertoireService.getRepertoireById(id as string),
    enabled: !!id,
    retry: 1, // Limitar reintentos para evitar ciclos infinitos
  });

  // Efecto para manejar errores de carga
  useEffect(() => {
    if (error) {
      console.error('Error al cargar el repertorio:', error);
      setShowErrorMessage('Error al cargar el repertorio. Por favor, intenta de nuevo más tarde.');
    }
  }, [error]);

  // Establecer versión inicial de forma segura
  useEffect(() => {
    try {
      if (repertoire) {
        // Si no hay versiones, no hacer nada
        if (!repertoire.versions || repertoire.versions.length === 0) {
          console.log('El repertorio no tiene versiones');
          return;
        }
        
        // Asegurarse de que el índice seleccionado no supere el número de versiones
        if (selectedVersionIndex >= repertoire.versions.length) {
          console.log('Índice de versión fuera de rango, ajustando al primer índice');
          setSelectedVersionIndex(0);
        } else if (selectedVersionIndex < 0) {
          console.log('Índice de versión negativo, ajustando al primer índice');
          setSelectedVersionIndex(0);
        }
      }
    } catch (error) {
      console.error('Error al establecer la versión inicial:', error);
    }
  }, [repertoire, selectedVersionIndex]);

  // Efecto adicional para verificar la validez del índice cuando cambia el repertorio
  useEffect(() => {
    if (repertoire?.versions && !repertoire.versions[selectedVersionIndex]) {
      console.log('La versión seleccionada ya no existe, seleccionando la primera versión');
      setSelectedVersionIndex(0);
    }
  }, [repertoire, selectedVersionIndex]);

  // Marcar como tocado hoy
  const playMutation = useMutation({
    mutationFn: () => repertoireService.markRepertoireAsPlayed(id as string, { 
      notes: `Tocado por grupo ${activeGroup?.name || ''}`,
      versionIndex: selectedVersionIndex
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoire', id] });
      queryClient.invalidateQueries({ queryKey: ['repertoires'] });
    }
  });

  // Generar PDF
  const generatePDFMutation = useMutation({
    mutationFn: () => repertoireService.generatePDF(id as string, selectedVersionIndex),
    onError: (error) => {
      console.error('Error al generar PDF:', error);
    }
  });
  
  // Eliminar repertorio
  const deleteMutation = useMutation({
    mutationFn: () => repertoireService.deleteRepertoire(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoires'] });
      navigate('/repertoires');
    }
  });

  // Mutación para agregar/editar versiones
  const versionMutation = useMutation({
    mutationFn: (versionData: any) => {
      console.log('Mutation versionData:', versionData);

      // Verificar si es una nueva versión o una actualización
      if (versionData._id) {
        // Verificar que la versión existe
        const versionExists = repertoire?.versions?.some(v => v._id === versionData._id);
        
        if (!versionExists) {
          console.error(`La versión con ID ${versionData._id} ya no existe. Refrescando datos...`);
          refetch();
          return Promise.reject('La versión ya no existe');
        }
        
        // Editar versión existente
        return repertoireService.updateVersion(id as string, versionData._id, {
          name: versionData.name,
          notes: versionData.notes
        });
      } else {
        // Crear nueva versión
        return repertoireService.addVersion(id as string, versionData);
      }
    },
    onSuccess: () => {
      console.log('Versión guardada con éxito');
      queryClient.invalidateQueries({ queryKey: ['repertoire', id] });
      setIsVersionModalOpen(false);
      setEditingVersion(null);
      setShowErrorMessage('');
    },
    onError: (error) => {
      console.error('Error al guardar versión:', error);
      setShowErrorMessage('Error al guardar la versión. Puede que ya no exista o haya sido modificada.');
    }
  });

  // Mejorar la mutación para manejar correctamente las letras de canciones
  const batchLyricsModificationMutation = useMutation({
    mutationFn: async (modificationsList: any[]) => {
      // Validar que tenemos repertorio y versión válida
      if (!repertoire?.versions || !repertoire.versions[selectedVersionIndex]) {
        console.error('No hay versión seleccionada válida');
        return Promise.reject('No hay versión seleccionada');
      }
      
      // Si no hay modificaciones, no hacer nada
      if (!modificationsList || modificationsList.length === 0) {
        console.warn('No hay modificaciones para guardar');
        return Promise.resolve([]);
      }
      
      // Verificar que la versión exista y tenga un ID válido
      const version = repertoire.versions[selectedVersionIndex];
      if (!version || !version._id) {
        console.error('La versión seleccionada no tiene un ID válido');
        return Promise.reject('La versión seleccionada no tiene un ID válido');
      }
      
      const versionId = version._id;
      
      // Verificar que la versión existe
      const versionExists = repertoire.versions.some((v: Version) => v._id === versionId);
      
      if (!versionExists) {
        console.error(`La versión con ID ${versionId} ya no existe. Refrescando datos...`);
        refetch();
        return Promise.reject('La versión ya no existe');
      }
      
      try {
        // Realizar las peticiones en secuencia para evitar problemas de concurrencia
        const results = [];
        for (const modification of modificationsList) {
          // Verificar que el objeto de modificación es válido y tiene un ID de canción
          if (!modification || !modification.song) {
            console.warn('Modificación inválida, saltando:', modification);
            continue;
          }
          
          // Asegurar que modifiedLyrics sea al menos una cadena vacía, nunca undefined
          const safeModification = {
            ...modification,
            modifiedLyrics: modification.modifiedLyrics ?? ''
          };
          
          // Verificar nuevamente que la versión existe antes de cada petición
          // Esto es crucial para evitar errores si la versión se elimina durante el proceso
          const currentRepertoire = await repertoireService.getRepertoireById(id as string);
          if (!currentRepertoire?.versions) {
            console.error('El repertorio ya no tiene versiones');
            throw new Error('El repertorio ya no tiene versiones');
          }
          
          const versionStillExists = currentRepertoire.versions.some((version: Version) => version._id === versionId);
          if (!versionStillExists) {
            console.error(`La versión con ID ${versionId} ya no existe`);
            throw new Error('La versión ya no existe');
          }
          
          console.log('Enviando modificación:', safeModification);
          const result = await repertoireService.updateSongInVersion(
            id as string,
            versionId,
            safeModification
          );
          
          results.push(result);
        }
        
        return results;
      } catch (error) {
        console.error('Error al actualizar las letras:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repertoire', id] });
      setIsAllLyricsEditorOpen(false);
      setShowErrorMessage('');
    },
    onError: (error) => {
      console.error('Error al modificar letras:', error);
      setShowErrorMessage('Error al guardar las letras. Por favor, intenta de nuevo más tarde.');
      // Importante: desactivar el estado de carga en caso de error
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Asegurar que el estado de carga se desactive siempre
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  });

  // Mutación para eliminar versión
  const deleteVersionMutation = useMutation({
    mutationFn: (versionId: string) => {
      return repertoireService.deleteVersion(id as string, versionId);
    },
    onSuccess: () => {
      // Refrescar datos del repertorio
      queryClient.invalidateQueries({ queryKey: ['repertoire', id] });
      
      // Limpiar el estado de edición
      setEditingVersion(null);
      setIsVersionModalOpen(false);
      
      // Si el componente AllLyricsEditorModal está abierto, cerrarlo por seguridad
      if (isAllLyricsEditorOpen) {
        setIsAllLyricsEditorOpen(false);
        setShowErrorMessage('Se ha cerrado el editor de letras porque la versión ha sido eliminada');
      }
      
      // Seleccionar la primera versión si hay alguna disponible
      refetch().then(refreshedData => {
        if (refreshedData?.data?.versions && refreshedData.data.versions.length > 0) {
          setSelectedVersionIndex(0);
        }
      });
    },
    onError: (error) => {
      console.error('Error al eliminar versión:', error);
      setShowErrorMessage('Error al eliminar la versión');
    }
  });

  // Mejorar la mutación de reordenamiento para actualizar correctamente la UI
  const reorderSongMutation = useMutation({
    mutationFn: (data: {songId: string, newPosition: number}) => {
      // Verificar que tenemos repertorio
      if (!repertoire) {
        return Promise.reject('No hay repertorio disponible');
      }
      
      // Verificar que hay versiones y que el índice es válido
      if (!repertoire.versions || 
          !Array.isArray(repertoire.versions) || 
          selectedVersionIndex < 0 || 
          selectedVersionIndex >= repertoire.versions.length) {
        return Promise.reject('No hay versión seleccionada válida');
      }
      
      // Verificar que la versión tiene un ID
      const versionId = repertoire.versions[selectedVersionIndex]?._id;
      if (!versionId) {
        return Promise.reject('La versión seleccionada no tiene un ID válido');
      }
      
      console.log('Reordenando canción', {
        songId: data.songId,
        newPosition: data.newPosition,
        versionId
      });
      
      return repertoireService.updateSongInVersion(
        id as string,
        versionId,
        {
          song: data.songId,
          position: data.newPosition
        }
      );
    },
    onSuccess: (_, variables) => {
      console.log('Mutación de reordenamiento exitosa para:', variables);
      
      // Forzar una recarga de datos después de un pequeño retraso
      // para asegurar que el backend haya procesado completamente el cambio
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['repertoire', id] })
          .then(() => {
            console.log('Datos recargados después de reordenamiento');
          })
          .catch(err => {
            console.error('Error al recargar datos:', err);
          });
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Error al reordenar las canciones:', error);
      setShowErrorMessage(`Error al reordenar las canciones: ${error.message}`);
    }
  });

  // Funciones de optimización de performance

  // Para evitar re-renderizados innecesarios, envolvemos funciones con useCallback
  const handleMarkAsPlayed = useCallback(() => {
    if (!id || !activeGroup) return;
    
    playMutation.mutate();
  }, [id, activeGroup, playMutation]);

  const handleGeneratePDF = useCallback(() => {
    if (!id) return;
    generatePDFMutation.mutate();
  }, [id, generatePDFMutation]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate();
  }, [id, deleteMutation]);

  const handleAddVersion = useCallback(() => {
    setEditingVersion(null);
    setIsVersionModalOpen(true);
  }, []);

  const handleEditVersion = useCallback((version: Version) => {
    setEditingVersion(version);
    setIsVersionModalOpen(true);
  }, []);

  const handleSaveVersion = useCallback((versionData: any) => {
    console.log('Guardando versión:', versionData);
    
    if (editingVersion) {
      versionMutation.mutate({
        ...versionData,
        _id: editingVersion._id
      });
    } else {
      versionMutation.mutate(versionData);
    }
  }, [editingVersion, versionMutation]);

  const handleDeleteVersion = useCallback(() => {
    try {
      // Solo permitir eliminar si hay más de una versión
      if (!repertoire?.versions || repertoire.versions.length <= 1) {
        setShowErrorMessage('No se puede eliminar la única versión del repertorio');
        return;
      }
      
      // Verificar que editingVersion existe y tiene un ID
      if (!editingVersion || !editingVersion._id) {
        console.error('No se puede eliminar: versión no seleccionada o sin ID');
        return;
      }
      
      // Comprobar si estamos eliminando la versión actualmente seleccionada
      const isDeletingSelectedVersion = repertoire.versions.findIndex(
        (v: Version) => v._id === editingVersion._id
      ) === selectedVersionIndex;
      
      // Ejecutar la mutación para eliminar
      deleteVersionMutation.mutate(editingVersion._id);
      
      // Si estamos eliminando la versión seleccionada, resetear el índice
      if (isDeletingSelectedVersion) {
        // Seleccionar otra versión (la primera por defecto)
        setSelectedVersionIndex(0);
      }
    } catch (error) {
      console.error('Error al intentar eliminar versión:', error);
      setShowErrorMessage('Error al intentar eliminar la versión');
    }
  }, [repertoire?.versions, editingVersion, selectedVersionIndex, deleteVersionMutation, setShowErrorMessage]);

  const handleEditAllLyrics = useCallback(() => {
    if (!repertoire?.versions?.[selectedVersionIndex]) return;
    setIsAllLyricsEditorOpen(true);
  }, [repertoire, selectedVersionIndex]);

  const handleSaveAllLyricsModifications = useCallback((allModifications: any[]) => {
    try {
      console.log('Guardando modificaciones de letras:', allModifications);
      
      if (!allModifications || !Array.isArray(allModifications) || allModifications.length === 0) {
        console.warn('No hay modificaciones para guardar');
        setIsAllLyricsEditorOpen(false);
        return;
      }
      
      // Verificar que el repertorio tenga versiones
      if (!repertoire?.versions || repertoire.versions.length === 0) {
        console.error('No hay versiones disponibles en el repertorio');
        setShowErrorMessage('No hay versiones disponibles para guardar las modificaciones');
        return;
      }
      
      // Verificar índice de versión válido
      if (selectedVersionIndex < 0 || selectedVersionIndex >= repertoire.versions.length) {
        console.error('Índice de versión inválido:', selectedVersionIndex);
        setShowErrorMessage('Error al guardar: versión seleccionada inválida');
        
        // Intentar recuperar - seleccionar una versión válida si hay alguna disponible
        if (repertoire.versions.length > 0) {
          setSelectedVersionIndex(0);
          setShowErrorMessage('Se ha seleccionado la primera versión porque la versión original ya no existe.');
          setIsAllLyricsEditorOpen(false); // Cerrar el modal para evitar problemas
          return;
        }
      }
      
      // Obtener la versión de forma segura
      const currentVersion = repertoire.versions[selectedVersionIndex];
      if (!currentVersion) {
        console.error('No se pudo obtener la versión actual');
        setShowErrorMessage('Error: No se pudo obtener la versión actual');
        return;
      }
      
      // Habilitar la bandera de envío para prevenir envíos múltiples
      setIsSubmitting(true);
      
      // Verificar cada modificación
      const validModifications = allModifications.filter((mod: any) => {
        if (!mod || !mod.song) {
          console.warn('Modificación inválida detectada:', mod);
          return false;
        }
        return true;
      });
      
      if (validModifications.length === 0) {
        console.warn('No hay modificaciones válidas para guardar');
        setShowErrorMessage('No se encontraron modificaciones válidas para guardar');
        setIsSubmitting(false);
        return;
      }
      
      // Ejecutar la mutación con las modificaciones validadas
      batchLyricsModificationMutation.mutate(validModifications, {
        onSuccess: () => {
          console.log('Modificaciones guardadas con éxito');
          setIsAllLyricsEditorOpen(false);
          setIsSubmitting(false);
        },
        onError: (error) => {
          console.error('Error al guardar modificaciones:', error);
          setShowErrorMessage('Error al guardar las modificaciones. Por favor, inténtelo nuevamente.');
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error general al guardar modificaciones:', error);
      setShowErrorMessage('Error inesperado al guardar las modificaciones');
      setIsSubmitting(false);
    }
  }, [
    repertoire?.versions, 
    selectedVersionIndex, 
    batchLyricsModificationMutation, 
    setShowErrorMessage, 
    setIsSubmitting, 
    setIsAllLyricsEditorOpen,
    setSelectedVersionIndex
  ]);

  // Optimización para el selector de categorías con memoización
  const getCategoryColor = useCallback((category: string): string => {
    return categoryColors[category as keyof typeof categoryColors] || categoryColors['Otro'];
  }, []);

  // Verificar acceso al repertorio - memoizado para evitar cálculos repetidos
  const canAccessRepertoire = useCallback(() => {
    try {
      // Si no hay autenticación, negar acceso
      if (!isAuthenticated) return false;
      
      // Si no hay grupo en el repertorio o no hay grupo activo, negar acceso
      if (!repertoire?.group || !activeGroup) return false;
      
      const groupId = typeof repertoire.group === 'string' ? repertoire.group : repertoire.group._id;
      
      // Si el repertorio pertenece al grupo activo
      if (groupId === activeGroup._id) return true;
      
      // Si el usuario pertenece a alguno de los grupos
      if (userGroups && userGroups.length > 0) {
        return userGroups.some(g => g._id === groupId);
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar acceso:', error);
      return false;
    }
  }, [isAuthenticated, repertoire, activeGroup, userGroups]);

  // Renderizar mensajes de error
  const renderErrorMessage = () => {
    if (!showErrorMessage) return null;
    
    return (
      <CustomAlert variant="error" className="mb-4" onClose={() => setShowErrorMessage('')}>
        {showErrorMessage}
      </CustomAlert>
    );
  };

  const handleVersionError = (error: Error) => {
    console.error("Error capturado por boundary:", error);
    setShowErrorMessage('Error inesperado al procesar versiones. Se ha restablecido el estado.');
    setSelectedVersionIndex(0);
    setIsAllLyricsEditorOpen(false);
    setIsVersionModalOpen(false);
    setEditingVersion(null);
    
    // Refrescar datos
    refetch().then(() => {
      // Reiniciar el error boundary
      setErrorBoundaryKey(prev => prev + 1);
    });
  };

  const handleMoveSongUp = (songId: string, currentIndex: number) => {
    try {
      // Verificar que tenemos los datos necesarios
      if (!repertoire || !repertoire.songs) {
        setShowErrorMessage('No hay datos suficientes para reordenar las canciones');
        return;
      }
      
      // Comprobar si ya está en la primera posición
      if (currentIndex <= 0) {
        console.log('Canción ya está en la primera posición');
        return;
      }
      
      // Deshabilitar temporalmente el botón para evitar clics repetidos
      const movingButton = document.getElementById(`move-up-${songId}`);
      if (movingButton) {
        movingButton.setAttribute('disabled', 'true');
      }
      
      console.log(`Moviendo canción hacia arriba: ${songId} desde posición ${currentIndex} a ${currentIndex - 1}`);
      
      reorderSongMutation.mutate(
        {
          songId,
          newPosition: currentIndex - 1
        },
        {
          // Añadir callbacks de onSuccess y onSettled para mejor manejo
          onSuccess: () => {
            console.log(`Canción ${songId} movida exitosamente a la posición ${currentIndex - 1}`);
          },
          onSettled: () => {
            // Re-habilitar el botón cuando la operación termine (éxito o error)
            setTimeout(() => {
              if (movingButton) {
                movingButton.removeAttribute('disabled');
              }
            }, 1000); // Esperar 1 segundo antes de re-habilitar
          }
        }
      );
    } catch (error) {
      console.error("Error al mover canción hacia arriba:", error);
      setShowErrorMessage('Error al reordenar la canción');
    }
  };

  const handleMoveSongDown = (songId: string, currentIndex: number) => {
    try {
      // Verificar que tenemos los datos necesarios
      if (!repertoire || !repertoire.songs) {
        setShowErrorMessage('No hay datos suficientes para reordenar las canciones');
        return;
      }
      
      // Obtener la versión seleccionada
      const currentVersion = repertoire.versions && 
        repertoire.versions[selectedVersionIndex];
      
      if (!currentVersion) {
        setShowErrorMessage('No se pudo obtener la versión actual');
        return;
      }
      
      // Verificar si ya está en la última posición
      if (currentIndex >= filteredSongs.length - 1) {
        console.log('Canción ya está en la última posición');
        return;
      }
      
      // Deshabilitar temporalmente el botón para evitar clics repetidos
      const movingButton = document.getElementById(`move-down-${songId}`);
      if (movingButton) {
        movingButton.setAttribute('disabled', 'true');
      }
      
      console.log(`Moviendo canción hacia abajo: ${songId} desde posición ${currentIndex} a ${currentIndex + 1}`);
      
      reorderSongMutation.mutate(
        {
          songId,
          newPosition: currentIndex + 1
        },
        {
          // Añadir callbacks de onSuccess y onSettled para mejor manejo
          onSuccess: () => {
            console.log(`Canción ${songId} movida exitosamente a la posición ${currentIndex + 1}`);
          },
          onSettled: () => {
            // Re-habilitar el botón cuando la operación termine (éxito o error)
            setTimeout(() => {
              if (movingButton) {
                movingButton.removeAttribute('disabled');
              }
            }, 1000); // Esperar 1 segundo antes de re-habilitar
          }
        }
      );
    } catch (error) {
      console.error("Error al mover canción hacia abajo:", error);
      setShowErrorMessage('Error al reordenar la canción');
    }
  };

  // Filtrar canciones basado en el término de búsqueda
  const filteredSongs = useMemo(() => {
    // Si no hay repertorio o canciones, devolver array vacío
    if (!repertoire?.songs) return [];
    
    // Obtener la versión seleccionada de forma segura
    const currentVersion = repertoire.versions && 
      Array.isArray(repertoire.versions) &&
      selectedVersionIndex >= 0 && 
      selectedVersionIndex < repertoire.versions.length
        ? repertoire.versions[selectedVersionIndex]
        : null;
    
    // Crear una copia de las canciones para poder ordenarlas
    let songsToFilter = [...repertoire.songs];
    
    // Ordenar canciones según las posiciones en la versión actual
    if (currentVersion && Array.isArray(currentVersion.songModifications)) {
      const positionMap: Record<string, number> = {};
      
      // Primero recopilar todas las posiciones existentes
      currentVersion.songModifications.forEach((mod: SongModification) => {
        if (mod && mod.song && mod.position !== undefined) {
          const songId = typeof mod.song === 'string' ? mod.song : (mod.song._id || '');
          if (songId) {
            positionMap[songId] = mod.position;
          }
        }
      });
      
      // Registrar el mapa para depuración
      console.log('Mapa de posiciones para ordenamiento:', positionMap);
      
      // Ordenar canciones basándose en posiciones
      songsToFilter.sort((a, b) => {
        const posA = positionMap[a._id] !== undefined ? positionMap[a._id] : Number.MAX_SAFE_INTEGER;
        const posB = positionMap[b._id] !== undefined ? positionMap[b._id] : Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
      
      // Registrar las canciones ordenadas para depuración
      console.log('Canciones ordenadas:', songsToFilter);
    }
    
    // Devolver todas las canciones ordenadas (eliminamos el filtrado por búsqueda)
    return songsToFilter;
  }, [repertoire?.songs, repertoire?.versions, selectedVersionIndex]);

  // Optimización: usar isSubmitting explícitamente en un log
  useEffect(() => {
    if (isSubmitting) {
      console.log('Estado de envío actual:', isSubmitting);
    }
  }, [isSubmitting]);

  // Sección del renderizado de componentes
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando repertorio...</p>
        </div>
      </Layout>
    );
  }

  if (error || !repertoire) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full text-center">
            <p>Error al cargar el repertorio</p>
            <p className="text-sm mt-2">
              {error instanceof Error ? error.message : 'Contacta al administrador si el problema persiste.'}
            </p>
          </div>
          <Button className="mt-4" onClick={() => navigate('/repertoires')}>
            Volver a repertorios
          </Button>
        </div>
      </Layout>
    );
  }

  // A partir de aquí podemos estar seguros de que repertoire existe y no es null/undefined
  const repertoireData = repertoire as Repertoire;
  
  // Verificar si el usuario puede acceder al repertorio
  const canAccess = canAccessRepertoire();
  if (!canAccess) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            className="mb-6 flex items-center"
            onClick={() => navigate('/repertoires')}
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
            Volver a repertorios
          </Button>
          
          <CustomAlert variant="warning" className="mb-4">
            No tienes acceso a este repertorio porque no perteneces al grupo {
              typeof repertoireData.group === 'string' 
                ? repertoireData.group 
                : repertoireData.group?.name
            }.
          </CustomAlert>
          <Button 
            variant="primary"
            onClick={() => navigate('/groups')}
          >
            Ver grupos disponibles
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-start">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => navigate('/repertoires')}
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
            Volver a repertorios
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleMarkAsPlayed}
              disabled={playMutation.isPending}
            >
              <HandThumbUpIcon className="h-4 w-4 mr-2" />
              Marcar como tocado
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={generatePDFMutation.isPending}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate(`/repertoires/${id}/edit`)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar repertorio
            </Button>
            
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
        
        {renderErrorMessage()}
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{repertoireData.name}</h1>
            {repertoireData.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(repertoireData.category)}`}>
                {repertoireData.category}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-gray-600">
            {repertoireData.date && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(repertoireData.date)}
              </div>
            )}
            
            {repertoireData.group && (
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {typeof repertoireData.group === 'object' && repertoireData.group.name}
              </div>
            )}
            
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              {repertoireData.createdBy && (typeof repertoireData.createdBy === 'object' ? 
                repertoireData.createdBy.username : 'Usuario desconocido')}
            </div>
            
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {repertoireData.playHistory && repertoireData.playHistory.length > 0 
                ? `Tocado ${repertoireData.playHistory.length} veces` 
                : 'Nunca tocado'}
            </div>
          </div>
        </div>
        
        {/* Descripción */}
        {repertoireData.description && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700 whitespace-pre-line">{repertoireData.description}</p>
          </Card>
        )}
        
        {/* Versiones del repertorio */}
        <VersionErrorBoundary onError={handleVersionError} resetKey={errorBoundaryKey}>
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Versiones</h2>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  onClick={handleAddVersion}
                  className="flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Agregar versión
                </Button>
              </div>
            </div>
            
            {(!repertoireData.versions || repertoireData.versions.length === 0) ? (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">
                  No hay versiones creadas aún. Crea una versión para personalizar la letra de las canciones.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {repertoireData.versions.map((version, index) => (
                  <div key={version._id} className="relative">
                    <button
                      onClick={() => setSelectedVersionIndex(index)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        index === selectedVersionIndex 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {version.name}
                    </button>
                    
                    {index === selectedVersionIndex && (
                      <button 
                        onClick={() => handleEditVersion(version)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        title="Editar versión"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Notas de la versión seleccionada */}
            {repertoireData.versions && repertoireData.versions.length > 0 && repertoireData.versions[selectedVersionIndex]?.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Notas de esta versión:</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                  {repertoireData.versions[selectedVersionIndex].notes}
                </p>
              </div>
            )}
          </Card>
        </VersionErrorBoundary>
        
        {/* Enlaces multimedia */}
        {repertoireData.mediaLinks && repertoireData.mediaLinks.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Enlaces multimedia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repertoireData.mediaLinks.map((link: MediaLink) => (
                <div key={link._id} className="border border-gray-200 rounded-md p-3 flex items-start">
                  <LinkIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
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
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Historial de reproducciones */}
        {repertoireData.playHistory && repertoireData.playHistory.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Historial de reproducciones</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Versión
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Evento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {[...repertoireData.playHistory].reverse().slice(0, 3).map((play: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(play.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {repertoireData.versions && play.versionIndex !== undefined ? 
                            repertoireData.versions[play.versionIndex]?.name || 'Versión principal' : 
                            'Versión principal'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{play.event || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{play.notes || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {/* Lista de canciones */}
        <Card title={`Canciones (${repertoireData.songs?.length || 0})`}>
          {!repertoireData.songs || repertoireData.songs.length === 0 ? (
            <div className="text-center py-10">
              <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay canciones en este repertorio</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Este repertorio está vacío por el momento.
              </p>
            </div>
          ) : (
            <div>
              {/* Barra de búsqueda y botón de reordenar */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 px-6 py-2">
                <div>
                  <Button
                    size="sm"
                    variant={isReorderMode ? "primary" : "outline"}
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    className="flex items-center"
                  >
                    <ArrowsUpDownIcon className="h-4 w-4 mr-1" />
                    {isReorderMode ? "Terminar reordenamiento" : "Reordenar canciones"}
                  </Button>
                </div>
              </div>
              
              {/* Mostrar mensaje de error específico para reordenamiento */}
              {showErrorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 mx-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>{showErrorMessage}</p>
                        {isReorderMode && (
                          <p className="mt-1">
                            Intente refrescar la página y volver a intentar. Si el problema persiste, 
                            puede editar el orden de las canciones a través de la edición del repertorio.
                          </p>
                        )}
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowErrorMessage('')}
                          className="text-sm"
                        >
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tabla de canciones */}
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Título
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Autor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tonalidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {filteredSongs.map((song: Song, index: number) => (
                      <tr key={song._id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">{index + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">{song.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700 dark:text-gray-300">{song.author}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700 dark:text-gray-300">{song.key}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {song.tags && song.tags.map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end">
                          {isReorderMode ? (
                            <div className="flex space-x-2">
                              <button
                                id={`move-up-${song._id}`}
                                onClick={() => handleMoveSongUp(song._id, index)}
                                disabled={index === 0}
                                className={`p-1 rounded-full ${index === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600'}`}
                                title="Mover hacia arriba"
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                id={`move-down-${song._id}`}
                                onClick={() => handleMoveSongDown(song._id, index)}
                                disabled={index === filteredSongs.length - 1}
                                className={`p-1 rounded-full ${index === filteredSongs.length - 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600'}`}
                                title="Mover hacia abajo"
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Link
                              to={`/songs/${song._id}`}
                              className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                            >
                              Ver detalles
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
        
        {/* Letras con modificaciones de la versión seleccionada */}
        {repertoireData.songs && repertoireData.songs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Letras de las canciones</h2>
              <div className="flex items-center gap-3">
                {repertoireData.versions && repertoireData.versions.length > 0 && (
                  <>
                    <p className="text-sm text-gray-500">
                      Mostrando versión: <span className="font-medium">{repertoireData.versions[selectedVersionIndex]?.name || 'Principal'}</span>
                    </p>
                    <Button 
                      size="sm"
                      variant="secondary"
                      onClick={handleEditAllLyrics}
                      className="flex items-center"
                      disabled={batchLyricsModificationMutation.isPending}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Editar todas las letras
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {filteredSongs.map((song, index) => {
              // Buscar si hay modificaciones para esta canción en la versión seleccionada
              const modifications = repertoire.versions?.[selectedVersionIndex]?.songModifications?.find(
                (mod: SongModification) => {
                  if (!mod || !mod.song) return false;
                  if (typeof mod.song === 'string') {
                    return mod.song === song._id;
                  }
                  return mod.song._id === song._id;
                }
              );
              
              // Usar la letra modificada si existe, o la original si no
              const displayLyrics = modifications?.modifiedLyrics || song.lyrics || '';
              const displayChords = modifications?.modifiedChords || song.chords || '';
              
              return (
                <Card key={song._id} className={`song-card ${isReorderMode ? 'cursor-move' : ''}`} data-id={`song-${song._id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{index + 1}. {song.title}</h3>
                        {song.key && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-medium">
                            Tono: {song.key}
                          </span>
                        )}
                        {song.tempo && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-medium">
                            Tempo: {song.tempo}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {song.author && `Por ${song.author}`}
                        {song.category && ` • ${song.category}`}
                      </p>
                    </div>
                    
                    {isReorderMode && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleMoveSongUp(song._id, index)}
                          disabled={index === 0}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            index === 0 ? 'text-gray-300' : 'text-gray-600'
                          }`}
                          title="Mover arriba"
                        >
                          <ArrowUpIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleMoveSongDown(song._id, index)}
                          disabled={index === filteredSongs.length - 1}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            index === filteredSongs.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'
                          }`}
                          title="Mover abajo"
                        >
                          <ArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido de la canción */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Letra */}
                    {displayLyrics && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Letra:</h4>
                        <div className="whitespace-pre-line bg-gray-50 p-3 rounded-md text-gray-800 font-mono text-sm">
                          {displayLyrics}
                        </div>
                      </div>
                    )}
                    
                    {/* Acordes */}
                    {displayChords && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Acordes:</h4>
                        <div className="whitespace-pre-line bg-gray-50 p-3 rounded-md text-gray-800 font-mono text-sm">
                          {displayChords}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Enlaces multimedia de la canción */}
                  {song.mediaLinks && song.mediaLinks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Enlaces:</h4>
                      <div className="flex flex-wrap gap-2">
                        {song.mediaLinks.map((link) => (
                          <a
                            key={link._id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notas específicas para esta canción en esta versión */}
                  {modifications?.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Notas para esta versión:</h4>
                      <p className="text-sm text-yellow-700">{modifications.notes}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Modales */}
        <VersionErrorBoundary onError={handleVersionError} resetKey={errorBoundaryKey}>
          {isVersionModalOpen && (
            <VersionModal 
              isOpen={isVersionModalOpen}
              onClose={() => {
                setIsVersionModalOpen(false);
                setEditingVersion(null);
              }}
              onSave={handleSaveVersion}
              onDelete={handleDeleteVersion}
              repertoire={repertoireData}
              editingVersion={editingVersion}
            />
          )}
          
          {/* Modal para editar todas las letras a la vez */}
          {isAllLyricsEditorOpen && repertoire && (
            <AllLyricsEditorModal
              isOpen={isAllLyricsEditorOpen}
              onClose={() => setIsAllLyricsEditorOpen(false)}
              onSave={handleSaveAllLyricsModifications}
              repertoire={repertoireData}
              versionIndex={selectedVersionIndex}
            />
          )}
        </VersionErrorBoundary>
        
        {/* Mostrar diálogo de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-md">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Confirmar eliminación</h3>
              </div>
              <div className="p-4">
                <p>¿Estás seguro de que deseas eliminar este repertorio? Esta acción no se puede deshacer.</p>
              </div>
              <div className="p-4 border-t flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RepertoireDetail; 