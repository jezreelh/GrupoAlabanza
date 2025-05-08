import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  withHover?: boolean;
  withBorder?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'dark';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

const Card = ({ 
  children, 
  title, 
  className = '', 
  withHover = false, 
  withBorder = false,
  rounded = 'lg',
  variant = 'default',
  padding = 'md',
  style
}: CardProps) => {
  // Clases base
  const baseClasses = 'bg-white dark:bg-dark-800 overflow-hidden transition-all duration-200';
  
  // Clases de bordes redondeados
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  // Clases de padding
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };
  
  // Clases de variantes
  const variantClasses = {
    default: `shadow-card ${withBorder ? 'border border-gray-200 dark:border-dark-700' : ''}`,
    primary: `border-l-4 border-primary-500 shadow-card ${withBorder ? 'border border-gray-200 dark:border-dark-700' : ''}`,
    secondary: `border-l-4 border-secondary-500 shadow-card ${withBorder ? 'border border-gray-200 dark:border-dark-700' : ''}`,
    accent: `border-l-4 border-accent-500 shadow-card ${withBorder ? 'border border-gray-200 dark:border-dark-700' : ''}`,
    dark: `border-l-4 border-dark-500 shadow-card ${withBorder ? 'border border-gray-200 dark:border-dark-700' : ''}`
  };
  
  // Clases de hover
  const hoverClasses = withHover ? 'hover:shadow-card-hover transform hover:-translate-y-1' : '';
  
  return (
    <div 
      className={`${baseClasses} ${roundedClasses[rounded]} ${paddingClasses[padding]} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      style={style}
    >
      {title && (
        <div className="border-b border-gray-200 dark:border-dark-700 px-4 py-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        </div>
      )}
      <div className={title ? '' : padding !== 'none' ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
};

export default Card; 