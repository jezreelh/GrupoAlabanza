import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Mostramos un indicador de carga mientras verificamos el estado de autenticación
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado y es administrador
  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene rol de administrador
  if (user?.role !== 'admin') {
    // Redirigir a la página principal si no es administrador
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 