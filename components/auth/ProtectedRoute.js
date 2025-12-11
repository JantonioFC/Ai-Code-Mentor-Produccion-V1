/**
 * Protected Route Component - Re-export from lib/auth
 * 
 * @description Este archivo re-exporta el ProtectedRoute oficial desde lib/auth
 *              manteniendo compatibilidad con imports existentes.
 * 
 * @author Mentor Coder
 * @version 2.0.0 (MISIÓN 221)
 * @updated 2025-10-14
 * @mission 221 - Eliminación de Race Condition en Autenticación
 * 
 * NOTA: El componente principal ahora vive en lib/auth/ProtectedRoute.jsx
 *       con toda la lógica de authState triestatal integrada.
 */

export { 
  default,
  useProtectedRoute,
  RequireAuth,
  withAuth
} from '../../lib/auth/ProtectedRoute.jsx';
