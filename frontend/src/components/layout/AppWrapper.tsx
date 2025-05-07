import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface AppWrapperProps {
  children: React.ReactNode;
}

/**
 * Componente envoltorio que se asegura de que los datos de contexto estén
 * correctamente inicializados cuando se carga la aplicación
 */
const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { user, loadUserGroups, userGroups, activeGroup, setActiveGroup } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastUserId = useRef<string | null>(null);
  const initAttempts = useRef(0);
  const maxAttempts = 3;

  // Efecto para asegurar que los grupos del usuario y el grupo activo estén configurados
  useEffect(() => {
    const initializeUserData = async () => {
      // Detectar cambio de usuario para reinicializar
      if (user?.id !== lastUserId.current) {
        console.log('AppWrapper: Cambio de usuario detectado');
        lastUserId.current = user?.id || null;
        setInitialized(false);
        initAttempts.current = 0;
      }
      
      // Solo ejecutamos la inicialización si no estamos inicializados, el usuario está autenticado 
      // y no hemos excedido el número máximo de intentos
      if (user && !initialized && initAttempts.current < maxAttempts) {
        console.log(`AppWrapper: Inicializando datos del usuario ${user.username} (intento ${initAttempts.current + 1}/${maxAttempts})`);
        initAttempts.current += 1;
        
        try {
          // Cargar grupos del usuario si no hay grupos cargados
          if (userGroups.length === 0) {
            console.log('AppWrapper: Cargando grupos del usuario');
            await loadUserGroups();
          }
          
          // Configurar el grupo activo si hay grupos disponibles
          if (userGroups.length > 0 && !activeGroup) {
            console.log('AppWrapper: Configurando grupo activo');
            const savedGroupId = localStorage.getItem('activeGroupId');
            
            if (savedGroupId) {
              const savedGroup = userGroups.find(g => g._id === savedGroupId);
              if (savedGroup) {
                console.log('AppWrapper: Configurando grupo guardado como activo:', savedGroup.name);
                setActiveGroup(savedGroup);
              } else {
                console.log('AppWrapper: Usando primer grupo como activo');
                setActiveGroup(userGroups[0]);
              }
            } else if (userGroups[0]) {
              console.log('AppWrapper: No hay ID guardado, usando primer grupo');
              setActiveGroup(userGroups[0]);
            }
          } else if (userGroups.length === 0) {
            console.log('AppWrapper: No hay grupos disponibles para el usuario');
          }
          
          setInitialized(true);
          setHasError(false);
          console.log('AppWrapper: Inicialización completada para', user.username);
        } catch (error) {
          console.error('Error al inicializar datos del usuario:', error);
          
          // Si alcanzamos el máximo de intentos, marcar como error
          if (initAttempts.current >= maxAttempts) {
            console.log('AppWrapper: Máximo número de intentos alcanzado, marcando como error');
            setHasError(true);
          }
          
          setInitialized(true); // Marcamos como inicializado aun con error para evitar bucles
        }
      }
    };
    
    initializeUserData();
  }, [user, userGroups, activeGroup, loadUserGroups, setActiveGroup, initialized]);

  // Efecto para recargar si cambian los grupos
  useEffect(() => {
    // Si ya está inicializado pero no hay grupo activo y hay grupos disponibles
    if (initialized && !activeGroup && userGroups.length > 0) {
      console.log('AppWrapper: Detectada situación de grupos sin grupo activo, configurando...');
      setActiveGroup(userGroups[0]);
    }
  }, [initialized, activeGroup, userGroups, setActiveGroup]);

  // Mostrar un mensaje de error si no se pueden cargar los datos
  if (hasError && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Error al cargar los datos</h2>
          <p className="mb-4 text-gray-700">
            No se pudieron cargar correctamente tus grupos después de varios intentos.
          </p>
          <Button
            onClick={() => {
              // Reiniciar el estado y recargar la página
              initAttempts.current = 0;
              setInitialized(false);
              setHasError(false);
              window.location.reload();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppWrapper; 