import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  UserMinusIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/api';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { CopyToClipboard } from '../../components/ui/Modal';

interface Member {
  _id: string;
  username: string;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);

  // Obtener detalles del grupo
  const { data: group, isLoading, error, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: () => id ? groupService.getGroupById(id) : null,
    enabled: !!id
  });

  // Mutación para regenerar código de invitación
  const regenerateCodeMutation = useMutation({
    mutationFn: () => id && user ? groupService.regenerateInvitationCode(id, user.id) : Promise.reject('No ID or user'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setSuccessMessage(`Código regenerado: ${data.invitationCode}`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  });

  // Mutación para habilitar/deshabilitar invitaciones
  const toggleInvitationMutation = useMutation({
    mutationFn: () => id && user ? groupService.toggleInvitationStatus(id, user.id) : Promise.reject('No ID or user'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setSuccessMessage(`Invitaciones ${data.invitationEnabled ? 'habilitadas' : 'deshabilitadas'}`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  });

  // Mutación para añadir moderador
  const addModeratorMutation = useMutation({
    mutationFn: (moderatorId: string) => 
      id && user ? groupService.addModerator(id, user.id, moderatorId) : Promise.reject('No ID or user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setSuccessMessage('Usuario promovido a moderador');
      setShowSuccessAlert(true);
      setIsPromoteModalOpen(false);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  });

  // Mutación para eliminar moderador
  const removeModeratorMutation = useMutation({
    mutationFn: (moderatorId: string) => 
      id && user ? groupService.removeModerator(id, user.id, moderatorId) : Promise.reject('No ID or user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setSuccessMessage('Moderador removido');
      setShowSuccessAlert(true);
      setIsDemoteModalOpen(false);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  });

  // Gestionar la regeneración del código
  const handleRegenerateCode = async () => {
    try {
      await regenerateCodeMutation.mutateAsync();
    } catch (error) {
      console.error('Error al regenerar código:', error);
    }
  };

  // Gestionar el cambio de estado de invitaciones
  const handleToggleInvitation = async () => {
    try {
      await toggleInvitationMutation.mutateAsync();
    } catch (error) {
      console.error('Error al cambiar estado de invitaciones:', error);
    }
  };

  // Gestionar la promoción a moderador
  const handlePromoteToModerator = async () => {
    if (selectedMemberId) {
      try {
        await addModeratorMutation.mutateAsync(selectedMemberId);
      } catch (error) {
        console.error('Error al promover a moderador:', error);
      }
    }
  };

  // Gestionar la remoción de moderador
  const handleRemoveModerator = async () => {
    if (selectedMemberId) {
      try {
        await removeModeratorMutation.mutateAsync(selectedMemberId);
      } catch (error) {
        console.error('Error al remover moderador:', error);
      }
    }
  };

  // Verificar si el usuario actual es el líder del grupo
  const isGroupLeader = user && group && group.leader._id === user.id;

  // Verificar si un usuario es moderador
  const isModerator = (userId: string) => {
    return group?.moderators?.some((mod: any) => mod._id === userId) || false;
  };

  // Verificar si el usuario actual es moderador
  const isCurrentUserModerator = user && group && isModerator(user.id);

  // Verificar si el usuario tiene permisos administrativos (líder o moderador)
  const hasAdminPermissions = isGroupLeader || isCurrentUserModerator;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !group) {
    return (
      <Layout>
        <Alert variant="error">
          Error al cargar el grupo. Por favor, intenta nuevamente.
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/groups')} className="mt-4">
          Volver a la lista
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.church && (
            <p className="text-gray-600 mt-1">Iglesia: {group.church}</p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/groups')}
        >
          Volver a la lista
        </Button>
      </div>

      {/* Alerta de éxito */}
      {showSuccessAlert && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {/* Sección de información del grupo */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Información del grupo</h2>
        {group.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
            <p className="mt-1">{group.description}</p>
          </div>
        )}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Identificador</h3>
          <p className="mt-1">{group.groupId}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Líder</h3>
          <p className="mt-1">{group.leader.username}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Creado</h3>
          <p className="mt-1">{new Date(group.createdAt).toLocaleDateString()}</p>
        </div>
      </Card>

      {/* Sección de invitaciones - Solo visible para el líder o moderadores */}
      {hasAdminPermissions && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de invitaciones</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-medium">Código de invitación</h3>
                <div className="mt-2 flex items-center">
                  {showInvitationCode ? (
                    <div className="flex items-center">
                      <span className="font-mono bg-gray-100 py-1 px-2 rounded border border-gray-200">
                        {group.invitationCode}
                      </span>
                      <CopyToClipboard 
                        text={group.invitationCode || ''} 
                        className="ml-2" 
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400">••••••</span>
                  )}
                  <button
                    onClick={() => setShowInvitationCode(!showInvitationCode)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    {showInvitationCode ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRegenerateCode}
                disabled={regenerateCodeMutation.isPending}
                className="flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Regenerar
              </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-md font-medium">
                  Estado de invitaciones
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {group.invitationEnabled 
                    ? "Las invitaciones están habilitadas" 
                    : "Las invitaciones están deshabilitadas"}
                </p>
              </div>
              <Button
                variant={group.invitationEnabled ? "primary" : "danger"}
                size="sm"
                onClick={handleToggleInvitation}
                disabled={toggleInvitationMutation.isPending}
              >
                {group.invitationEnabled ? "Deshabilitar" : "Habilitar"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sección de moderadores - Solo visible para el líder */}
      {isGroupLeader && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Moderadores ({group.moderators?.length || 0})
          </h2>
          {group.moderators && group.moderators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {group.moderators.map((mod: Member) => (
                <div 
                  key={mod._id} 
                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                >
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{mod.username}</p>
                    <span className="text-xs text-green-600">Moderador</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMemberId(mod._id);
                      setIsDemoteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">Este grupo no tiene moderadores.</p>
          )}
          <p className="text-sm text-gray-600 mt-2 mb-3">
            Los moderadores pueden gestionar invitaciones y tienen permisos adicionales en el grupo.
          </p>
        </Card>
      )}

      {/* Sección de miembros */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Miembros ({group.members?.length || 0})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {group.members?.map((member: Member) => (
            <div 
              key={member._id} 
              className="flex items-center p-3 border border-gray-200 rounded-lg"
            >
              <div className={`${group.leader._id === member._id ? 'bg-blue-100' : isModerator(member._id) ? 'bg-green-100' : 'bg-gray-100'} p-2 rounded-full mr-3`}>
                <UserGroupIcon className={`h-5 w-5 ${group.leader._id === member._id ? 'text-blue-600' : isModerator(member._id) ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{member.username}</p>
                {group.leader._id === member._id ? (
                  <span className="text-xs text-blue-600">Líder</span>
                ) : isModerator(member._id) ? (
                  <span className="text-xs text-green-600">Moderador</span>
                ) : (
                  <span className="text-xs text-gray-500">Miembro</span>
                )}
              </div>
              {isGroupLeader && member._id !== group.leader._id && !isModerator(member._id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMemberId(member._id);
                    setIsPromoteModalOpen(true);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  Promover
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Modal para promover a moderador */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Promover a moderador"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que deseas promover a este usuario a moderador? Los moderadores pueden gestionar invitaciones y tienen permisos adicionales en el grupo.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPromoteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePromoteToModerator}
              disabled={addModeratorMutation.isPending}
            >
              Promover
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para remover moderador */}
      <Modal
        isOpen={isDemoteModalOpen}
        onClose={() => setIsDemoteModalOpen(false)}
        title="Remover moderador"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que deseas remover a este usuario como moderador? Perderá los permisos adicionales en el grupo.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDemoteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRemoveModerator}
              disabled={removeModeratorMutation.isPending}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default GroupDetail; 