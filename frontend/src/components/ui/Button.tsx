import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'dark' | 'light' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  withRipple?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  rounded = 'md',
  leftIcon,
  rightIcon,
  withRipple = true,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseClass = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:transform active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-button hover:shadow-button-hover dark:bg-primary-600 dark:hover:bg-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-button hover:shadow-button-hover dark:bg-secondary-600 dark:hover:bg-secondary-500',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-button hover:shadow-button-hover dark:bg-danger-600 dark:hover:bg-danger-500',
    success: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-button hover:shadow-button-hover dark:bg-secondary-600 dark:hover:bg-secondary-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 shadow-button hover:shadow-button-hover dark:bg-yellow-600 dark:hover:bg-yellow-500',
    info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-button hover:shadow-button-hover dark:bg-blue-600 dark:hover:bg-blue-500',
    dark: 'bg-dark-700 text-white hover:bg-dark-800 focus:ring-dark-700 shadow-button hover:shadow-button-hover dark:bg-dark-800 dark:hover:bg-dark-700',
    light: 'bg-gray-100 text-dark-800 hover:bg-gray-200 focus:ring-gray-200 shadow-button hover:shadow-button-hover dark:bg-dark-600 dark:text-white dark:hover:bg-dark-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-dark-600 dark:text-gray-200 dark:hover:bg-dark-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-dark-700'
  };
  
  const sizeClasses = {
    xs: 'py-1 px-2 text-xs',
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-2.5 px-5 text-lg',
    xl: 'py-3 px-6 text-xl'
  };
  
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
  
  const loadingClass = isLoading ? 'opacity-80 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';
  const rippleClass = withRipple && !disabled && !isLoading ? 'ripple-effect' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses[rounded]} ${loadingClass} ${widthClass} ${disabledClass} ${rippleClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button; 