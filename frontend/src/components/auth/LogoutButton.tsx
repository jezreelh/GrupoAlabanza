import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className, children }) => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    // Realizar el cierre de sesión
    logout();
    
    // Guardar un marcador en sessionStorage para indicar que acabamos de cerrar sesión
    sessionStorage.setItem('justLoggedOut', 'true');
    
    // Recargar la página completa para asegurar que todos los estados se resetean
    window.location.href = '/login';
  };

  return (
    <Button 
      variant="danger" 
      onClick={handleLogout}
      className={className}
      disabled={isLoggingOut}
    >
      {children || 'Cerrar sesión'}
    </Button>
  );
};

export default LogoutButton; 