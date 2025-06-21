import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  // Efecto para manejar la inicialización después de la recarga
  useEffect(() => {
    // Dar tiempo para que el contexto se inicialice completamente
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000); // 1 segundo para la inicialización

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading durante la inicialización o mientras el contexto está cargando
  if (loading || isInitializing) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  if (!isAuthenticated) {
    console.log('AdminRoute: Usuario no autenticado, redirigiendo al login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene rol de administrador
  if (user?.role !== 'admin') {
    console.log('AdminRoute: Usuario no es administrador, redirigiendo al inicio');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-primary text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  console.log('AdminRoute: Usuario autorizado como administrador');
  return <>{children}</>;
};

export default AdminRoute; 