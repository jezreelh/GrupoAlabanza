import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
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
  const { activeGroup, isAuthenticated, isAdmin } = useAuth();
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
        <footer className="bg-gradient-to-br from-dark-900 to-dark-800 text-white">
          <div className={`mx-auto ${containerClasses[containerSize]} px-4 sm:px-6`}>
            
            {/* Sección principal del footer */}
            <div className="py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* Logo y descripción */}
                <div className="lg:col-span-1">
                  <div className="flex items-center mb-4">
                    <MusicalNoteIcon className="h-8 w-8 text-primary-400 mr-2" />
                    <h3 className="text-xl font-bold">Grupo Alabanza</h3>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    Plataforma integral para organizar y administrar grupos de música en la iglesia. 
                    Gestiona canciones, repertorios y presentaciones de manera eficiente.
                  </p>
                  <div className="flex space-x-3">
                    <a
                      href="mailto:info@grupoalabanza.com"
                      className="bg-dark-700 hover:bg-primary-600 p-2 rounded-full transition-colors duration-200"
                      title="Enviar email"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </a>
                    <a
                      href="tel:+1234567890"
                      className="bg-dark-700 hover:bg-primary-600 p-2 rounded-full transition-colors duration-200"
                      title="Llamar"
                    >
                      <PhoneIcon className="h-5 w-5" />
                    </a>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-dark-700 hover:bg-primary-600 p-2 rounded-full transition-colors duration-200"
                      title="Ubicación"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
                
                {/* Enlaces rápidos */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary-300">Enlaces Rápidos</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Inicio
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/songs"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        Canciones
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/repertoires"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <MusicalNoteIcon className="h-4 w-4 mr-2" />
                        Repertorios
                      </Link>
                    </li>
                    {isAuthenticated && (
                      <li>
                        <Link
                          to="/groups"
                          className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                        >
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          Grupos
                        </Link>
                      </li>
                    )}
                    {isAuthenticated && isAdmin && (
                      <li>
                        <Link
                          to="/admin"
                          className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                        >
                          <CogIcon className="h-4 w-4 mr-2" />
                          Administración
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Información de contacto */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary-300">Contacto</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-300 text-sm">Email:</p>
                        <a 
                          href="mailto:info@grupoalabanza.com"
                          className="text-white hover:text-primary-300 transition-colors"
                        >
                          info@grupoalabanza.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-300 text-sm">Teléfono:</p>
                        <a 
                          href="tel:+1234567890"
                          className="text-white hover:text-primary-300 transition-colors"
                        >
                          +1 (234) 567-8900
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-300 text-sm">Ubicación:</p>
                        <p className="text-white">
                          123 Calle Principal<br />
                          Ciudad, Estado 12345
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Soporte y ayuda */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary-300">Soporte</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Centro de Ayuda
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Documentación
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Video Tutoriales
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Reportar Problema
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                      >
                        <span className="mr-2">•</span>
                        Solicitar Función
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Línea divisora */}
            <div className="border-t border-gray-700"></div>
            
            {/* Sección inferior del footer */}
            <div className="py-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-0">
                  <div className="flex items-center mb-2 md:mb-0 md:mr-6">
                    <p className="text-gray-400 text-sm">
                      &copy; {new Date().getFullYear()} Grupo Alabanza. Todos los derechos reservados.
                    </p>
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <span>Hecho con</span>
                    <HeartIcon className="h-4 w-4 text-red-500 mx-1" />
                    <span>para la comunidad cristiana</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                    Términos de Servicio
                </a>
                <a
                  href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Política de Privacidad
                </a>
                <a
                  href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Cookies
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
      
      <ScrollToTop />
    </div>
  );
};

export default Layout; 