import type { ReactNode } from 'react';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  dismissible?: boolean;
  className?: string;
}

const Alert = ({ 
  children, 
  variant = 'info', 
  dismissible = true, 
  className = '' 
}: AlertProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const variantClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className={`rounded-md border p-4 mb-4 ${variantClasses[variant]} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-grow">{children}</div>
        {dismissible && (
          <button
            type="button"
            className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => setIsVisible(false)}
            aria-label="Cerrar alerta"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert; 