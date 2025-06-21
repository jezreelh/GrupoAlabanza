import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  withHover?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '', 
  withHover = false, 
  rounded = 'lg',
  variant = 'default',
  padding = 'md',
  style,
  onClick
}) => {
  // Clases base
  const baseClasses = 'bg-white dark:bg-dark-800 overflow-hidden transition-all duration-200';
  
  // Clases de bordes redondeados
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };
  
  // Clases de padding
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };
  
  // Clases de variante
  const variantClasses = {
    default: 'border border-gray-200 dark:border-dark-600 shadow-sm dark:shadow-dark-900/20',
    outlined: 'border-2 border-gray-300 dark:border-dark-500',
    elevated: 'shadow-lg dark:shadow-dark-900/40 border border-gray-100 dark:border-dark-700'
  };
  
  // Clases de hover
  const hoverClasses = withHover 
    ? 'hover:shadow-md dark:hover:shadow-dark-900/40 hover:border-gray-300 dark:hover:border-dark-500 cursor-pointer' 
    : '';
  
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${roundedClasses[rounded]} ${paddingClasses[padding]} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${className}`}
      style={style}
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-gray-200 dark:border-dark-600 px-4 py-3 mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className={title ? '' : padding !== 'none' ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
};

export default Card; 