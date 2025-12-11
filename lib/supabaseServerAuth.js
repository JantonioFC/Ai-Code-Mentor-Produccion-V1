// lib/supabaseServerAuth.js
// CORRECCIÓN CRÍTICA: Cliente Supabase con contexto de autenticación para servidor

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Crea un cliente de Supabase autenticado usando el token JWT del usuario
 * Esto es necesario para que las políticas RLS funcionen correctamente
 * 
 * @param {string} accessToken - Token JWT del usuario autenticado
 * @returns {object} Cliente de Supabase con contexto de autenticación
 */
export function createAuthenticatedSupabaseClient(accessToken) {
  if (!accessToken) {
    throw new Error('Access token requerido para cliente autenticado');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  return supabase;
}

/**
 * Obtiene un cliente autenticado desde el contexto de request de Next.js
 * 
 * @param {object} req - Request object de Next.js con authContext
 * @returns {object} Cliente de Supabase autenticado
 */
export function getAuthenticatedSupabaseFromRequest(req) {
  const { isAuthenticated, supabaseClient } = req.authContext || {};
  
  if (!isAuthenticated) {
    throw new Error('Usuario no autenticado - no se puede crear cliente autenticado');
  }

  if (!supabaseClient) {
    throw new Error('Cliente Supabase no disponible en contexto de request');
  }

  // El cliente ya tiene el contexto de autenticación establecido por el middleware
  return supabaseClient;
}

/**
 * Extrae el token de acceso del objeto user
 * Función helper para diferentes formatos de user object
 */
function extractTokenFromUser(user) {
  // Diferentes lugares donde puede estar el token
  return user.access_token || 
         user.accessToken || 
         user.token || 
         user.jwt ||
         null;
}

// Cliente anónimo para uso público (sin políticas RLS)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
