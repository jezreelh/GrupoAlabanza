import { useState, useEffect, type ReactNode } from 'react';
import Navbar from './Navbar';
import ScrollToTop from '../util/ScrollToTop';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  containerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  withPadding?: boolean;
  withFooter?: boolean;
}

const Layout = ({ 
  children, 
  containerSize = 'xl',
  withPadding = true,
  withFooter = true 
}: LayoutProps) => {
  const { activeGroup } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll para aplicar efecto en el navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clases para contenedor según tamaño
  const containerClasses = {
    xs: 'max-w-md',
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100">
      <Navbar scrolled={scrolled} />
      
      {/* Indicador de grupo activo para móviles */}
      {activeGroup && (
        <div className="bg-primary-500 text-white text-center md:hidden py-2 px-4 text-sm font-medium">
          Grupo activo: {activeGroup.name}
        </div>
      )}
      
      <main className={`flex-grow ${withPadding ? 'px-4 py-6 sm:px-6 sm:py-8' : ''}`}>
        <div className={`mx-auto ${containerClasses[containerSize]}`}>
          {children}
        </div>
      </main>
      
      {withFooter && (
        <footer className="bg-dark-800 text-white py-8 mt-auto">
          <div className={`mx-auto ${containerClasses[containerSize]} px-4 sm:px-6`}>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h3 className="text-lg font-semibold mb-2">Grupo Alabanza</h3>
                <p className="text-sm text-gray-300">
                  Plataforma para organizar y administrar grupos de música para la iglesia.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-2 mb-6 md:mb-0">
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Términos de Uso
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Política de Privacidad
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Contacto
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Ayuda
                </a>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-6 text-center md:text-left text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Grupo Alabanza. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      )}
      
      <ScrollToTop />
    </div>
  );
};

export default Layout; 