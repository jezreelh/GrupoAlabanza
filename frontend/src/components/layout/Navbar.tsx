import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, UserGroupIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../auth/LogoutButton';

interface NavbarProps {
  scrolled?: boolean;
}

const navigation = [
  { name: 'Inicio', href: '/', public: true },
  { name: 'Canciones', href: '/songs', public: true },
  { name: 'Repertorios', href: '/repertoires', public: true },
  { name: 'Grupos', href: '/groups', public: false },
  { name: 'Admin', href: '/admin', public: false, adminOnly: true },
];

const Navbar = ({ scrolled = false }: NavbarProps) => {
  const { user, logout, isAuthenticated, activeGroup, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Para una futura implementación del modo oscuro
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Disclosure 
      as="nav" 
      className={`bg-dark-800 sticky top-0 z-40 transition-shadow duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="text-white font-bold text-xl flex items-center">
                    <span className="text-primary-400 mr-1">♪</span>
                    Grupo Alabanza
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-6">
                  {navigation
                    .filter(item => (
                      item.public || 
                      (isAuthenticated && (!item.adminOnly || isAdmin))
                    ))
                    .map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-200 hover:text-white hover:border-b-2 hover:border-primary-400 transition-all duration-200"
                      >
                        {item.name}
                      </Link>
                    ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isAuthenticated && activeGroup && (
                  <div className="mr-4 text-sm text-gray-300">
                    <span className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-1 text-primary-400" />
                      {activeGroup.name}
                    </span>
                  </div>
                )}
                
                {/* Botón para modo oscuro - para implementación futura */}
                <button 
                  onClick={toggleDarkMode}
                  className="p-1 rounded-full text-gray-300 hover:bg-dark-700 hover:text-white mr-2"
                >
                  <span className="sr-only">Cambiar tema</span>
                  <SunIcon className="h-6 w-6" />
                </button>
                
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        <span className="sr-only">Abrir menú de usuario</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-600" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-dark-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active: _active }) => (
                            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-100 border-b border-gray-100 dark:border-dark-700">
                              <div className="font-medium">{user?.username}</div>
                              <div className="text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active: _active }) => (
                            <Link
                              to="/groups"
                              className={`${
                                _active ? 'bg-gray-100 dark:bg-dark-700' : ''
                              } block px-4 py-2 text-sm text-gray-700 dark:text-gray-100`}
                            >
                              Mis Grupos
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active: _active }) => (
                            <Link
                              to="/profile"
                              className={`${
                                _active ? 'bg-gray-100 dark:bg-dark-700' : ''
                              } block px-4 py-2 text-sm text-gray-700 dark:text-gray-100`}
                            >
                              Mi Perfil
                            </Link>
                          )}
                        </Menu.Item>
                        {isAdmin && (
                          <Menu.Item>
                            {({ active: _active }) => (
                              <Link
                                to="/admin"
                                className={`${
                                  _active ? 'bg-gray-100 dark:bg-dark-700' : ''
                                } block px-4 py-2 text-sm text-gray-700 dark:text-gray-100`}
                              >
                                Administración
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active: _active }) => (
                            <LogoutButton className={`${
                              _active ? 'bg-gray-100 dark:bg-dark-700' : ''
                            } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100`} />
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="space-x-4">
                    <Link
                      to="/login"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-500 bg-white hover:bg-gray-50 dark:bg-dark-700 dark:text-white dark:hover:bg-dark-600"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-dark-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Abrir menú principal</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {navigation
                .filter(item => (
                  item.public || 
                  (isAuthenticated && (!item.adminOnly || isAdmin))
                ))
                .map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
            </div>
            {isAuthenticated && (
              <div className="px-4 py-2 border-t border-dark-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Tema:</span>
                  <button 
                    onClick={toggleDarkMode}
                    className="p-1 rounded-full text-gray-300 hover:bg-dark-700 hover:text-white"
                  >
                    <SunIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div className="border-t border-dark-700 pt-4 pb-3">
              {isAuthenticated ? (
                <>
                  <div className="px-4 flex items-center">
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">{user?.username}</div>
                      <div className="text-sm font-medium text-gray-400">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as={Link}
                      to="/groups"
                      className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white"
                    >
                      Mis Grupos
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white"
                    >
                      Mi Perfil
                    </Disclosure.Button>
                    {isAdmin && (
                      <Disclosure.Button
                        as={Link}
                        to="/admin"
                        className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white"
                      >
                        Administración
                      </Disclosure.Button>
                    )}
                    <Disclosure.Button
                      as={LogoutButton}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white"
                    />
                  </div>
                </>
              ) : (
                <div className="px-4 flex flex-col space-y-2">
                  <Link
                    to="/login"
                    className="w-full text-center px-3 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center px-3 py-2 rounded-md border border-dark-700 text-white hover:bg-dark-700"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar; 