import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../auth/LogoutButton';

const navigation = [
  { name: 'Inicio', href: '/', public: true },
  { name: 'Canciones', href: '/songs', public: true },
  { name: 'Repertorios', href: '/repertoires', public: true },
  { name: 'Grupos', href: '/groups', public: false },
  { name: 'Admin', href: '/admin', public: false, adminOnly: true },
];

const Navbar = () => {
  const { user, logout, isAuthenticated, activeGroup, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Disclosure as="nav" className="bg-dark">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="text-white font-bold text-xl">
                    Grupo Alabanza
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation
                    .filter(item => (
                      item.public || 
                      (isAuthenticated && (!item.adminOnly || isAdmin))
                    ))
                    .map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-200 hover:text-white"
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
                      <UserGroupIcon className="h-5 w-5 mr-1" />
                      {activeGroup.name}
                    </span>
                  </div>
                )}
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active: _active }) => (
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                              <div className="font-medium">{user?.username}</div>
                              <div className="text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active: _active }) => (
                            <Link
                              to="/groups"
                              className={`${
                                _active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
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
                                _active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
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
                                  _active ? 'bg-gray-100' : ''
                                } block px-4 py-2 text-sm text-gray-700`}
                              >
                                Administración
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active: _active }) => (
                            <LogoutButton className={`${
                              _active ? 'bg-gray-100' : ''
                            } block w-full text-left px-4 py-2 text-sm text-gray-700`} />
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="space-x-4">
                    <Link
                      to="/login"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-blue-600"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-white hover:bg-gray-50"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
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
                    className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
            </div>
            {isAuthenticated && activeGroup && (
              <div className="px-4 py-2 border-t border-gray-700">
                <div className="flex items-center text-gray-300">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  <span>Grupo: {activeGroup.name}</span>
                </div>
              </div>
            )}
            <div className="border-t border-gray-700 pt-4 pb-3">
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
                      className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Mis Grupos
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Mi Perfil
                    </Disclosure.Button>
                    {isAdmin && (
                      <Disclosure.Button
                        as={Link}
                        to="/admin"
                        className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        Administración
                      </Disclosure.Button>
                    )}
                    <Disclosure.Button
                      as={LogoutButton}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    />
                  </div>
                </>
              ) : (
                <div className="px-4 flex flex-col space-y-2">
                  <Link
                    to="/login"
                    className="w-full text-center px-3 py-2 rounded-md text-white bg-primary hover:bg-blue-600"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center px-3 py-2 rounded-md border border-gray-700 text-white hover:bg-gray-700"
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