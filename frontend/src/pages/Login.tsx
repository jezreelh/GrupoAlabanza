import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

type LoginFormData = {
  username: string;
  password: string;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  
  // Verificar si acabamos de cerrar sesión
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut === 'true') {
      // Limpiar el marcador
      sessionStorage.removeItem('justLoggedOut');
      
      // Esperar un momento y recargar la página para limpiar cualquier estado residual
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');
      setLoginStatus('Iniciando sesión...');
      
      // Realizar el inicio de sesión
      const success = await login({ username: data.username, password: data.password });
      
      if (success) {
        setLoginStatus('¡Bienvenido! Redirigiendo...');
        // Esperar un momento antes de redirigir
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta nuevamente.');
        setIsLoading(false);
        setLoginStatus('');
      }
    } catch (err: any) {
      console.error('Error de inicio de sesión:', err);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      // Asegurarnos de que el estado de carga se restablezca si hay un error
      setIsLoading(false);
      setLoginStatus('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          O{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            crea una cuenta nueva
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 shadow-md sm:rounded-lg sm:px-10">
          {error && <Alert variant="error">{error}</Alert>}
          {loginStatus && (
            <div className="mb-4 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-2"></div>
                <p className="text-gray-600">{loginStatus}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Tu nombre de usuario"
                  disabled={isLoading}
                  {...register('username', {
                    required: 'El nombre de usuario es obligatorio',
                  })}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres',
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-dark-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-dark-800 px-2 text-gray-500 dark:text-gray-400">o continuar con</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  Continuar con Google
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login; 