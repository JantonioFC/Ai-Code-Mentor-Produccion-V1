// lib/auth/auth.js - MIGRADO A @supabase/ssr
// MISIÓN 70.0 FASE 3 - MIGRACIÓN DE FUNCIONES DEPRECADAS COMPLETADA
import { createBrowserClient, createServerClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para componentes del cliente (frontend)
 * Compatible con Pages Router usando @supabase/ssr
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Cliente de Supabase para API routes (servidor)
 * Compatible con Pages Router usando @supabase/ssr
 */
export function createSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=${options.sameSite || 'Lax'}`);
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        },
      },
    }
  );
}

/**
 * Función de login con email y contraseña
 */
export async function signInWithEmail(email, password) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Función de registro con email y contraseña
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Función de logout
 */
export async function signOut() {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Verifica si hay un usuario autenticado en API routes
 */
export async function getServerUser(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error obteniendo usuario del servidor:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error en getServerUser:', error.message);
    return null;
  }
}
