// core/services/TestingHelpers.js
import { createClient } from '@supabase/supabase-js';

// Cliente con privilegios de servicio para bypasear RLS
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Asegura que el usuario de prueba existe en la tabla users para testing
 * @param {string} testUserId - UUID del usuario de prueba
 * @returns {Promise<object>} El usuario creado o existente
 */
export const ensureTestUserExists = async (testUserId) => {
  try {
    // Verificar si el usuario ya existe en la tabla users (tabla principal)
    const { data: existingUser, error: checkError } = await supabaseService
      .from('users')
      .select('id')
      .eq('id', testUserId)
      .single();

    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe:', testUserId);
      return existingUser;
    }

    // Si no existe, crearlo en la tabla users (tabla principal)
    const { data: newUser, error: createError } = await supabaseService
      .from('users')
      .insert({
        id: testUserId
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creando usuario de prueba:', createError);
      throw createError;
    }

    console.log('✅ Usuario de prueba creado exitosamente:', testUserId);
    return newUser;

  } catch (error) {
    console.error('❌ Error en ensureTestUserExists:', error);
    throw error;
  }
};