/**
 * ProtectedRoute - Componente de Protección de Rutas con Estado Triestatal
 * 
 * @description Componente HOC que protege rutas requiriendo autenticación.
 *              Actualizado para usar authState triestatal y eliminar race conditions.
 * 
 * @author Mentor Coder
 * @version 2.0.0 (MISIÓN 221)
 * @updated 2025-10-14
 * @mission 221 - Eliminación de Race Condition en Autenticación
 * 
 * ARQUITECTURA:
 * - Usa authState directamente (no más lógica derivada)
 * - Muestra <LoadingScreen> durante 'loading'
 * - Redirige a login en 'unauthenticated'
 * - Renderiza children solo en 'authenticated'
 * 
 * CHANGELOG v2.0.0:
 * - Eliminado estado local isChecking (redundante)
 * - Integrado LoadingScreen de Fase 2
 * - Simplificada lógica de renderizado
 * - Eliminadas race conditions en useEffect
 */

import { useEffect } from 'react';
import useAuth from './useAuth';
import LoadingScreen from '../../components/auth/LoadingScreen';

/**
 * Componente de orden superior para proteger rutas que requieren autenticación
 */
const ProtectedRoute = ({
  children,
  redirectTo = '/login',
  showLoadingScreen = true
}) => {
  const { authState, user } = useAuth();

  // MISIÓN 221: Redirección solo cuando authState es definitivamente 'unauthenticated'
  useEffect(() => {
    if (authState === 'unauthenticated') {
      console.log('🔒 [PROTECTED-ROUTE] Usuario no autenticado, redirigiendo a:', redirectTo);
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [authState, redirectTo]);

  // MISIÓN 221: Renderizado basado en authState triestatal
  switch (authState) {
    case 'loading':
      // Estado: Verificando sesión
      console.log('⏳ [PROTECTED-ROUTE] Verificando autenticación...');

      if (showLoadingScreen) {
        return <LoadingScreen message="Verificando acceso..." />;
      }

      // Alternativa: Spinner inline para casos específicos
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Verificando autenticación...</p>
          </div>
        </div>
      );

    case 'unauthenticated':
      // Estado: No autenticado - mostrar mensaje mientras redirige
      console.log('❌ [PROTECTED-ROUTE] Acceso denegado - No autenticado');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
          <div className="text-center">
            <div className="text-white text-6xl mb-4">🔒</div>
            <p className="text-white text-xl font-semibold mb-2">Acceso Restringido</p>
            <p className="text-gray-200 text-sm">Redirigiendo a inicio de sesión...</p>
          </div>
        </div>
      );

    case 'authenticated':
      // Estado: Autenticado - renderizar contenido protegido
      console.log('✅ [PROTECTED-ROUTE] Usuario autenticado:', user?.email);
      return children;

    default:
      // Estado desconocido - failsafe
      console.error('⚠️ [PROTECTED-ROUTE] Estado de autenticación desconocido:', authState);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <div className="text-center">
            <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
            <p className="text-white text-xl font-semibold mb-2">Error de Estado</p>
            <p className="text-gray-400 text-sm">Por favor, recarga la página</p>
          </div>
        </div>
      );
  }
};

export default ProtectedRoute;

/**
 * Hook para proteger componentes que requieren autenticación
 * Versión actualizada con authState triestatal
 * 
 * @param {string} redirectTo - Ruta de redirección (default: '/login')
 * @returns {object} Estado de autenticación y utilidades
 * 
 * @example
 * const { isReady, user } = useProtectedRoute();
 * if (!isReady) return null;
 */
export function useProtectedRoute(redirectTo = '/login') {
  const { user, authState, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // MISIÓN 221: Solo redirigir cuando definitivamente no autenticado
    if (authState === 'unauthenticated') {
      console.log('🔒 [USE-PROTECTED-ROUTE] Redirigiendo a:', redirectTo);
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [authState, redirectTo]);

  return {
    user,
    authState,
    isAuthenticated,
    isLoading,
    isReady: authState === 'authenticated', // Solo ready cuando authenticated
  };
}

/**
 * Componente de protección rápida para páginas completas
 * Versión actualizada con authState y LoadingScreen
 * 
 * @param {React.ReactNode} children - Contenido a proteger
 * @param {React.ReactNode} fallback - Contenido alternativo si no autenticado
 * @param {boolean} useLoadingScreen - Si usar LoadingScreen (default: true)
 * 
 * @example
 * <RequireAuth>
 *   <AdminPanel />
 * </RequireAuth>
 */
export function RequireAuth({
  children,
  fallback = null,
  useLoadingScreen = true
}) {
  const { authState, user } = useAuth();

  // MISIÓN 221: Renderizado basado en authState
  if (authState === 'loading') {
    if (useLoadingScreen) {
      return <LoadingScreen message="Verificando acceso..." />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="text-yellow-400 text-5xl mb-4">⚠️</div>
          <p className="text-white text-lg font-medium mb-2">Autenticación Requerida</p>
          <p className="text-gray-400 text-sm">Necesitas iniciar sesión para acceder a esta página</p>
        </div>
      </div>
    );
  }

  // authState === 'authenticated'
  console.log('✅ [REQUIRE-AUTH] Usuario autenticado:', user?.email);
  return children;
}

/**
 * HOC (Higher-Order Component) para proteger páginas completas
 * 
 * @param {React.Component} Component - Componente a proteger
 * @param {object} options - Opciones de configuración
 * @returns {React.Component} Componente envuelto con protección
 * 
 * @example
 * export default withAuth(DashboardPage);
 */
export function withAuth(Component, options = {}) {
  const {
    redirectTo = '/login',
    showLoadingScreen = true,
  } = options;

  const WrappedComponent = (props) => {
    return (
      <ProtectedRoute redirectTo={redirectTo} showLoadingScreen={showLoadingScreen}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Preservar displayName para debugging
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
