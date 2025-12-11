/**
 * Auth Components - Barrel Export
 * 
 * @description Exportaciones centralizadas de componentes de autenticación
 * @version 2.0.0 (MISIÓN 221)
 * @mission 221 - Eliminación de Race Condition en Autenticación
 */

// Componentes de UI
export { default as LoadingScreen } from './LoadingScreen';
export { default as AuthLoadingWrapper } from './AuthLoadingWrapper';

// Componentes de Protección de Rutas
export { 
  default as ProtectedRoute,
  useProtectedRoute,
  RequireAuth,
  withAuth
} from './ProtectedRoute';
