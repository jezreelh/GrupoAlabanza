import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

type UserProfileData = {
  username: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();
  const [formData, setFormData] = useState<UserProfileData>({
    username: user?.username || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Actualizar datos del formulario cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Mutación para actualizar el perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileData) => {
      try {
        // Si no hay cambio de contraseña, elimina esos campos
        const dataToSend = { ...data };
        if (!dataToSend.oldPassword) {
          delete dataToSend.oldPassword;
          delete dataToSend.newPassword;
          delete dataToSend.confirmPassword;
        }
        
        // Eliminar confirmPassword antes de enviar
        if (dataToSend.confirmPassword) {
          delete dataToSend.confirmPassword;
        }
        
        const response = await api.put('/users/profile', dataToSend);
        return response.data;
      } catch (error) {
        console.error('Error al actualizar perfil:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Actualizar información de usuario en el contexto
      if (data.data) {
        updateUserInfo({
          ...user,
          username: data.data.username,
          email: data.data.email,
          id: user?.id
        });
      }
      
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Error en la mutación:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al actualizar el perfil. ';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage += error.response.data.message;
        }
      }
      
      setError(errorMessage);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return;
    }
    
    // Validar si está cambiando contraseña
    if (formData.oldPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.oldPassword) {
        setError('Debes ingresar tu contraseña actual para cambiarla');
        return;
      }
      
      if (!formData.newPassword) {
        setError('Debes ingresar una nueva contraseña');
        return;
      }
      
      if (formData.newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }
    
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-10">
          <Alert variant="error">
            Debes iniciar sesión para acceder a esta página.
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4">
        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
        
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información básica */}
          <Card className="md:col-span-2">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la cuenta</h3>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                    <div className="mt-1 text-gray-900">{user.username}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                    <div className="mt-1 text-gray-900">{user.email || 'No especificado'}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1 text-gray-900">
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={() => setIsEditing(true)}>
                      Editar perfil
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Nombre de usuario"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Correo electrónico"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                  />
                  
                  <div className="border-t border-gray-200 mt-6 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Cambiar contraseña (opcional)</h4>
                    
                    <Input
                      label="Contraseña actual"
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      value={formData.oldPassword || ''}
                      onChange={handleInputChange}
                    />
                    
                    <Input
                      label="Nueva contraseña"
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword || ''}
                      onChange={handleInputChange}
                    />
                    
                    <Input
                      label="Confirmar nueva contraseña"
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      isLoading={updateProfileMutation.isPending}
                    >
                      Guardar cambios
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
          
          {/* Resumen de actividad */}
          <Card>
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de actividad</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">Grupos</div>
                    <div className="text-lg font-semibold">{user.groups?.length || 0}</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Grupos a los que perteneces</div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">Cuenta creada</div>
                    <div className="text-sm font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Desconocido'}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/groups')}
                  >
                    Ver mis grupos
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 