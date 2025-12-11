/**
 * Endpoint de Traducción de Tokens - Autenticación Federada
 * 
 * @description Traduce tokens JWT de Supabase a tokens internos del ecosistema
 *              para permitir comunicación segura con el Microservicio IRP
 * 
 * @endpoint POST /api/v1/auth/translate-token
 * @version 1.0.0
 * @created 2025-09-29
 * @mission 197
 * 
 * FUENTE DE VERDAD: Contrato de API v1.5 (Core)
 * ARQUITECTURA: Autenticación Federada v11.0
 */

import jwt from 'jsonwebtoken';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const JWT_SECRET = process.env.IRP_JWT_SECRET;
const TOKEN_EXPIRATION = '15m'; // 15 minutos - expiración corta por seguridad
const API_VERSION = '1.5';

// Validar que el secret esté configurado
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ [TRANSLATE-TOKEN] IRP_JWT_SECRET no configurado o muy corto');
  console.error('   El secret debe tener al menos 32 caracteres');
}

// ============================================================================
// MANEJADOR PRINCIPAL DEL ENDPOINT
// ============================================================================

export default async function handler(req, res) {
  // Registrar inicio de petición
  const timestamp = new Date().toISOString();
  console.log(`\n🔐 [TRANSLATE-TOKEN] ${timestamp}`);
  console.log(`   Método: ${req.method}`);
  console.log(`   IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);

  // Validar método HTTP
  if (req.method !== 'POST') {
    console.log('❌ [TRANSLATE-TOKEN] Método no permitido:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Solo se permite el método POST',
      code: 'METHOD_NOT_ALLOWED',
      metadata: {
        apiVersion: API_VERSION,
        timestamp,
      }
    });
  }

  // Validar configuración del servidor
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('❌ [TRANSLATE-TOKEN] Configuración de servidor inválida');
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Servidor no configurado correctamente',
      code: 'SERVER_MISCONFIGURED',
      metadata: {
        apiVersion: API_VERSION,
        timestamp,
      }
    });
  }

  try {
    // ========================================================================
    // PASO 1: EXTRACCIÓN Y VALIDACIÓN DEL TOKEN DE SUPABASE
    // ========================================================================

    const { access_token } = req.body;

    if (!access_token) {
      console.log('❌ [TRANSLATE-TOKEN] Token de acceso no proporcionado');
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'El campo access_token es requerido',
        code: 'MISSING_ACCESS_TOKEN',
        metadata: {
          apiVersion: API_VERSION,
          timestamp,
        }
      });
    }

    console.log('📥 [TRANSLATE-TOKEN] Token recibido, validando...');

    // ========================================================================
    // PASO 2: VALIDACIÓN DEL TOKEN CON SUPABASE
    // ========================================================================

    // Crear cliente Supabase para el servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return req.cookies[name];
          },
          set(name, value, options) {
            // No necesitamos setear cookies en este endpoint
          },
          remove(name, options) {
            // No necesitamos remover cookies en este endpoint
          },
        },
      }
    );

    // Validar el token con Supabase usando el token directamente
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);

    if (authError || !user) {
      console.log('❌ [TRANSLATE-TOKEN] Token de Supabase inválido:', authError?.message);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token de Supabase inválido o expirado',
        code: 'INVALID_SUPABASE_TOKEN',
        details: process.env.NODE_ENV === 'development' ? {
          supabaseError: authError?.message || 'Token validation failed',
        } : undefined,
        metadata: {
          apiVersion: API_VERSION,
          timestamp,
        }
      });
    }

    console.log(`✅ [TRANSLATE-TOKEN] Token de Supabase válido para usuario: ${user.email}`);

    // ========================================================================
    // PASO 3: EXTRACCIÓN DE DATOS DEL USUARIO
    // ========================================================================

    const userId = user.id;
    const userEmail = user.email;
    
    // Determinar rol del usuario
    // TODO: Implementar lógica real de determinación de rol desde user_metadata o database
    // Por ahora, asumimos rol 'student' por defecto
    let userRole = 'student';
    
    if (user.user_metadata?.role) {
      userRole = user.user_metadata.role;
    } else if (user.app_metadata?.role) {
      userRole = user.app_metadata.role;
    }

    console.log(`📋 [TRANSLATE-TOKEN] Datos extraídos:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Role: ${userRole}`);

    // ========================================================================
    // PASO 4: GENERACIÓN DEL TOKEN INTERNO
    // ========================================================================

    const now = Math.floor(Date.now() / 1000);
    
    // Payload del token interno
    const internalTokenPayload = {
      sub: userId,           // Subject (ID del usuario) - Estándar JWT
      id: userId,            // ID del usuario - Esperado por microservicio IRP
      email: userEmail,      // Email del usuario
      role: userRole,        // Rol del usuario
      name: user.user_metadata?.full_name || user.email,  // Nombre del usuario
      iat: now,              // Issued At (timestamp de emisión)
      // exp será calculado por jwt.sign con expiresIn
    };

    // Firmar el token interno con el secret compartido con IRP
    const internalToken = jwt.sign(
      internalTokenPayload,
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRATION,
        issuer: 'ai-code-mentor-core',      // Emisor del token
        audience: 'microservicio-irp',       // Audiencia del token
      }
    );

    console.log(`🔑 [TRANSLATE-TOKEN] Token interno generado exitosamente`);
    console.log(`   Expiración: ${TOKEN_EXPIRATION}`);

    // ========================================================================
    // PASO 5: RESPUESTA EXITOSA
    // ========================================================================

    // Calcular timestamp de expiración para el cliente
    const expiresInSeconds = 15 * 60; // 15 minutos en segundos
    const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000)).toISOString();

    const response = {
      success: true,
      data: {
        access_token: internalToken,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
        expires_at: expiresAt,
        user: {
          id: userId,
          email: userEmail,
          role: userRole,
        }
      },
      metadata: {
        apiVersion: API_VERSION,
        timestamp,
        issuer: 'ai-code-mentor-core',
        audience: 'microservicio-irp',
      }
    };

    console.log(`✅ [TRANSLATE-TOKEN] Traducción exitosa para ${userEmail}`);
    console.log(`   Token válido hasta: ${expiresAt}`);

    return res.status(200).json(response);

  } catch (error) {
    // ========================================================================
    // MANEJO DE ERRORES INESPERADOS
    // ========================================================================

    console.error('❌ [TRANSLATE-TOKEN] Error inesperado:', error);
    console.error('   Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error procesando traducción de token',
      code: 'TOKEN_TRANSLATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? {
        errorMessage: error.message,
        errorType: error.name,
      } : undefined,
      metadata: {
        apiVersion: API_VERSION,
        timestamp: new Date().toISOString(),
      }
    });
  }
}

// ============================================================================
// CONFIGURACIÓN DE NEXT.JS
// ============================================================================

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
