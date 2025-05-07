import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { CopyToClipboard } from '../../components/ui/Modal';
import { Link } from 'react-router-dom';
import ReloadGroupsButton from '../../components/util/ReloadGroupsButton';

type GroupFormData = {
  name: string;
  description: string;
  church: string;
};

interface Group {
  _id: string;
  name: string;
  description?: string;
  church?: string;
  invitationCode?: string;
  leader?: string;
  members?: string[];
}

const GroupList = () => {
  const { user, userGroups, activeGroup, setActiveGroup, createGroup, loadUserGroups, leaveGroup } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    church: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedGroups = useRef(false);

  // Obtener todos los grupos - actualizado para usar formato de objeto
  const { data: allGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.getAllGroups
  });

  const queryClient = useQueryClient();
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [showInvitationCodeModal, setShowInvitationCodeModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Efecto para recargar los grupos del usuario si es necesario
  useEffect(() => {
    const ensureUserGroups = async () => {
      // Solo cargamos los grupos una vez por montaje del componente si el usuario está autenticado
      if (user && !hasLoadedGroups.current) {
        console.log('GroupList: Primera carga de grupos para este montaje del componente');
        setIsLoading(true);
        try {
          await loadUserGroups();
          hasLoadedGroups.current = true;
        } catch (error) {
          console.error('Error al cargar grupos del usuario:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    ensureUserGroups();
  }, [user, loadUserGroups]);

  // Restablecer el estado de carga cuando se desmonta el componente
  useEffect(() => {
    return () => {
      hasLoadedGroups.current = false;
    };
  }, []);

  // Mutación para unirse a un grupo - actualizada para usar formato de objeto
  const joinMutation = useMutation({
    mutationFn: ({ groupId, invitationCode }: { groupId: string, invitationCode: string }) => 
      groupService.addMember(groupId, user?.id || '', invitationCode),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      await loadUserGroups();
      
      // Obtener el grupo al que se unió y establecerlo como activo
      const allGroupsUpdated = await groupService.getAllGroups();
      const joinedGroup = allGroupsUpdated.find((g: Group) => g._id === variables.groupId);
      if (joinedGroup) {
        setActiveGroup(joinedGroup);
      }
      
      setInvitationCode('');
      setShowInvitationCodeModal(false);
      setError(null);
      setSelectedGroupId(null);
      
      // Recargar la página para actualizar la UI
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      console.error('Error al unirse al grupo:', error);
      setError(error.response?.data?.message || 'Error al unirse al grupo. Verifica el código de invitación.');
    }
  });

  // Función para manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para crear un nuevo grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.name.trim()) {
        setError('El nombre del grupo es obligatorio');
        return;
      }

      const newGroup = await createGroup({
        name: formData.name,
        description: formData.description,
        church: formData.church
      });

      // Guardar el código de invitación y mostrar el modal
      setNewGroupCode(newGroup.invitationCode || '');
      setNewGroupId(newGroup._id);
      
      // Establecer el nuevo grupo como el grupo activo
      setActiveGroup(newGroup);
      
      // Mostrar modal de éxito
      setIsSuccessModalOpen(true);

      // Actualizar la lista de grupos del usuario
      await loadUserGroups();

      // Limpiar formulario y cerrar modal de creación
      setFormData({ name: '', description: '', church: '' });
      setIsCreateModalOpen(false);
      
      // Tiempo suficiente para ver el modal antes de recargar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear el grupo');
    }
  };

  // Función para unirse a un grupo
  const handleJoinGroup = async (groupId: string) => {
    setError(null);
    try {
      // Asegurarse de que el código de invitación esté en mayúsculas y sin espacios
      const formattedCode = invitationCode.trim().toUpperCase();
      
      console.log('Intentando unirse al grupo:', { 
        groupId, 
        invitationCode: formattedCode, 
        userId: user?.id 
      });
      
      if (!formattedCode) {
        setError('El código de invitación es obligatorio');
        return;
      }
      
      if (!user?.id) {
        setError('Debes iniciar sesión para unirte a un grupo');
        return;
      }
      
      await joinMutation.mutateAsync({ groupId, invitationCode: formattedCode });
    } catch (error: any) {
      console.error('Error al unirse al grupo:', error);
      setError(error.response?.data?.message || 'Error al unirse al grupo. Verifica el código de invitación.');
    }
  };

  // Verificar si el grupo está activo
  const isActive = (groupId: string) => {
    return activeGroup?._id === groupId;
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Mis Grupos</h1>
          <p className="text-gray-600 mt-1">
            Administra tus grupos y selecciona cuál usar.
          </p>
        </div>
        <div className="flex space-x-2">
          <ReloadGroupsButton />
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Nuevo Grupo
          </Button>
        </div>
      </div>

      {/* Mostrar información si no hay grupo activo */}
      {user && userGroups.length > 0 && !activeGroup && (
        <Alert variant="warning" className="mb-4">
          No hay un grupo activo seleccionado. Por favor, activa un grupo para poder administrar canciones y repertorios.
        </Alert>
      )}

      {/* Modal para crear un nuevo grupo */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Grupo"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="church" className="block text-sm font-medium text-gray-700">
              Iglesia
            </label>
            <input
              type="text"
              id="church"
              name="church"
              value={formData.church}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Crear Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para mostrar el código de invitación */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="¡Grupo creado con éxito!"
      >
        <div className="space-y-4">
          <Alert variant="success">
            El grupo ha sido creado correctamente.
          </Alert>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Código de invitación</h3>
            <p className="text-sm text-gray-500 mb-3">
              Comparte este código con los miembros del grupo para que puedan unirse:
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono bg-gray-100 py-1 px-2 rounded border border-gray-200">
                {newGroupCode}
              </span>
              <CopyToClipboard text={newGroupCode} className="ml-2" />
            </div>
            <p className="text-xs text-gray-500">
              <strong>Nota:</strong> Puedes regenerar este código o deshabilitar las invitaciones en la página de detalles del grupo.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setIsSuccessModalOpen(false);
                window.location.href = `/groups/${newGroupId}`;
              }}
              className="flex items-center"
            >
              Ver Grupo <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mis Grupos */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Mis Grupos</h2>
        <ReloadGroupsButton className="text-sm" />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Cargando tus grupos...</span>
        </div>
      ) : userGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userGroups.map((group) => (
            <Card key={group._id} className={`p-6 ${isActive(group._id) ? 'border-primary' : ''}`}>
              <div className="flex justify-between items-start">
                <Link to={`/groups/${group._id}`} className="hover:text-primary transition-colors">
                  <h3 className="text-lg font-medium">{group.name}</h3>
                </Link>
                {isActive(group._id) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                  >
                    Activar
                  </Button>
                )}
              </div>
              {group.church && (
                <p className="text-sm text-gray-600 mt-1">Iglesia: {group.church}</p>
              )}
              {group.description && (
                <p className="text-sm text-gray-500 mt-2">{group.description}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <Link 
                  to={`/groups/${group._id}`}
                  className="text-primary hover:text-primary-dark flex items-center text-sm"
                >
                  Ver detalles <ArrowRightIcon className="ml-1 h-3 w-3" />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => leaveGroup(group._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Salir del grupo
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Alert variant="info" className="mb-8">
          No perteneces a ningún grupo. Crea un nuevo grupo o únete a uno existente.
        </Alert>
      )}

      {/* Otros Grupos */}
      <h2 className="text-xl font-semibold mb-4">Otros Grupos</h2>
      {isLoadingGroups ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : allGroups && allGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allGroups
            .filter((group: Group) => !isMember(group._id))
            .map((group: Group) => (
              <Card key={group._id} className="p-6">
                <h3 className="text-lg font-medium">{group.name}</h3>
                {group.church && (
                  <p className="text-sm text-gray-600 mt-1">Iglesia: {group.church}</p>
                )}
                {group.description && (
                  <p className="text-sm text-gray-500 mt-2">{group.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedGroupId(group._id);
                      setShowInvitationCodeModal(true);
                    }}
                  >
                    Unirse
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      ) : (
        <Alert variant="info">
          No hay otros grupos disponibles.
        </Alert>
      )}

      {/* Modal para ingresar código de invitación */}
      <Modal
        isOpen={showInvitationCodeModal}
        onClose={() => {
          setShowInvitationCodeModal(false);
          setSelectedGroupId(null);
          setError(null);
          setInvitationCode('');
        }}
        title="Ingresar Código de Invitación"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (selectedGroupId) {
            handleJoinGroup(selectedGroupId);
          }
        }} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700">
              Código de Invitación *
            </label>
            <input
              type="text"
              id="invitationCode"
              name="invitationCode"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase().trim())}
              placeholder="Ejemplo: ABC123"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Introduce el código de invitación proporcionado por el administrador del grupo.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowInvitationCodeModal(false);
                setSelectedGroupId(null);
                setError(null);
                setInvitationCode('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Uniéndose...' : 'Unirse'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default GroupList; 