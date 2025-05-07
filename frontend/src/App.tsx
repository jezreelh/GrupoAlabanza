import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppWrapper from './components/layout/AppWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import './App.css';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas de canciones
import SongList from './pages/Songs/SongList';
import SongDetail from './pages/Songs/SongDetail';
import SongForm from './pages/Songs/SongForm';

// Páginas de repertorios
import RepertoireList from './pages/Repertoires/RepertoireList';
import RepertoireDetail from './pages/Repertoires/RepertoireDetail';
import RepertoireForm from './pages/Repertoires/RepertoireForm';

// Página de administración
import AdminPage from './pages/Admin/AdminPage';

// Páginas de grupos
import GroupList from './pages/Groups/GroupList';
import GroupDetail from './pages/Groups/GroupDetail';

// Página de perfil de usuario
import Profile from './pages/Profile';

// Componente para la página no encontrada (404)
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl font-semibold text-gray-800 mb-6">Página no encontrada</p>
      <p className="text-gray-600 mb-8">Lo sentimos, la página que estás buscando no existe.</p>
      <button 
        onClick={() => window.location.href = '/'} 
        className="bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 inline-block"
      >
        Volver al inicio
      </button>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AppWrapper>
        <Routes>
          {/* Páginas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas de canciones */}
          <Route path="/songs" element={<SongList />} />
          <Route path="/songs/new" element={
            <ProtectedRoute>
              <SongForm />
            </ProtectedRoute>
          } />
          <Route path="/songs/:id" element={<SongDetail />} />
          <Route path="/songs/:id/edit" element={
            <ProtectedRoute>
              <SongForm />
            </ProtectedRoute>
          } />
          
          {/* Rutas de repertorios */}
          <Route path="/repertoires" element={<RepertoireList />} />
          <Route path="/repertoires/new" element={
            <ProtectedRoute>
              <RepertoireForm />
            </ProtectedRoute>
          } />
          <Route path="/repertoires/:id" element={<RepertoireDetail />} />
          <Route path="/repertoires/:id/edit" element={
            <ProtectedRoute>
              <RepertoireForm />
            </ProtectedRoute>
          } />
          
          {/* Rutas de grupos */}
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupList />
            </ProtectedRoute>
          } />
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          } />
          
          {/* Ruta de administración */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          
          {/* Ruta de perfil de usuario */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Ruta no encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppWrapper>
    </AuthProvider>
  );
}

export default App;
