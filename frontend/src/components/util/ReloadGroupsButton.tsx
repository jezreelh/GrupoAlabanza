import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ReloadGroupsButtonProps {
  className?: string;
}

const ReloadGroupsButton: React.FC<ReloadGroupsButtonProps> = ({ className }) => {
  const { forceRefreshGroups } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReload = async () => {
    if (isLoading) return; // Evitar múltiples clics
    
    setIsLoading(true);
    setSuccess(false);
    setHasError(false);
    setErrorMessage('');
    
    try {
      console.log('Forzando recarga de grupos desde botón UI');
      await forceRefreshGroups();
      setSuccess(true);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error al recargar grupos:', error);
      setHasError(true);
      setErrorMessage(error.message || 'No se pudieron cargar los grupos');
      
      // Ocultar mensaje de error después de 5 segundos
      setTimeout(() => {
        setHasError(false);
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  let buttonVariant = "secondary";
  if (success) buttonVariant = "primary";
  if (hasError) buttonVariant = "danger";

  return (
    <div className="inline-flex flex-col items-end">
      <Button 
        variant={buttonVariant as "primary" | "secondary" | "danger" | "outline"}
        onClick={handleReload}
        className={`flex items-center ${className}`}
        disabled={isLoading}
        title={errorMessage || "Recargar la lista de grupos"}
      >
        {isLoading ? (
          <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
        ) : success ? (
          <CheckCircleIcon className="h-4 w-4 mr-1" />
        ) : hasError ? (
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowPathIcon className="h-4 w-4 mr-1" />
        )}
        
        {isLoading ? 'Recargando...' : 
         success ? 'Grupos actualizados' : 
         hasError ? 'Error al recargar' : 
         'Recargar grupos'}
      </Button>
      
      {hasError && errorMessage && (
        <span className="text-xs text-red-600 mt-1">{errorMessage}</span>
      )}
    </div>
  );
};

export default ReloadGroupsButton; 