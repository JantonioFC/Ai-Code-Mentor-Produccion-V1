/**
 * AuthLoadingWrapper - Wrapper de Carga de Autenticación
 * 
 * @description Componente intermedio que verifica el estado de autenticación
 *              y muestra el LoadingScreen mientras la sesión está siendo validada.
 *              Este componente es crítico para prevenir race conditions.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-10-14
 * @mission 221 - Eliminación de Race Condition en Autenticación
 * 
 * ARQUITECTURA:
 * - Debe estar DENTRO de <AuthProvider> para acceder a useAuth()
 * - Muestra <LoadingScreen> cuando authState === 'loading'
 * - Renderiza children solo cuando authState está resuelto
 */

import React from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import LoadingScreen from './LoadingScreen';

export default function AuthLoadingWrapper({ children }) {
  const { authState, loading } = useAuth();

  // MISIÓN 221: Mostrar LoadingScreen mientras se verifica la sesión
  if (authState === 'loading' || loading) {
    console.log('🔄 [AUTH-WRAPPER] Mostrando LoadingScreen - authState:', authState);
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // MISIÓN 221: Estado resuelto - permitir renderizado de la aplicación
  console.log('✅ [AUTH-WRAPPER] Estado resuelto - authState:', authState);
  return <>{children}</>;
}
