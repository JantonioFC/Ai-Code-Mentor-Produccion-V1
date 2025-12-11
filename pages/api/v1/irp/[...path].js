/**
 * API ROUTE - SISTEMA IRP (Revisión de Código)
 * 
 * Handler unificado para todas las operaciones IRP.
 * Migrado de microservicio a API Route integrada.
 * 
 * @version 2.0.2 - Fixed Auth & E2E Support
 */

import {
  createReviewRequest,
  getReviewHistory,
  getReviewDetails,
  saveAIReview,
  calculateUserMetrics,
  generateSystemStats
} from '../../../../lib/services/irp/reviewService';
import {
  performAIReview,
  fetchCodeFromGitHub,
  isAIAvailable
} from '../../../../lib/services/irp/aiReviewerService';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_CONFIG = {
  name: 'IRP-API-Route',
  version: '2.0.3',
  logRequests: true
};

// Cliente Supabase para validación de tokens
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Extrae el usuario autenticado de la request
 * Soporta: Bearer token (Supabase), E2E Mock token, y cookies
 */
async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];

  // 1. Intentar con Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Soporte para Token Mock de E2E
    if (token === 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5') {
      return {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'e2e-test@example.com',
        role: 'authenticated'
      };
    }

    // Validar token con Supabase
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        console.log(`[IRP] ✅ Token válido para: ${user.email}`);
        return { id: user.id, email: user.email, role: 'authenticated' };
      }
    } catch (err) {
      console.log('[IRP] Token validation failed:', err.message);
    }
  }

  // 2. Intentar con cookies de Supabase
  const cookies = req.headers.cookie || '';
  const authCookieMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);

  if (authCookieMatch) {
    try {
      let cookieValue = decodeURIComponent(authCookieMatch[1]);

      // Supabase cookies may be base64 encoded with 'base64-' prefix
      if (cookieValue.startsWith('base64-')) {
        const base64Data = cookieValue.substring(7); // Remove 'base64-' prefix
        cookieValue = Buffer.from(base64Data, 'base64').toString('utf8');
      }

      const parsed = JSON.parse(cookieValue);
      const accessToken = parsed?.access_token || parsed?.[0]?.access_token;

      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
          console.log(`[IRP] ✅ Cookie válida para: ${user.email}`);
          return { id: user.id, email: user.email, role: 'authenticated' };
        }
      }
    } catch (err) {
      console.log('[IRP] Cookie parsing failed:', err.message);
    }
  }

  return null;
}

function logRequest(req, path, hasAuth) {
  if (!API_CONFIG.logRequests) return;
  console.log(`📡 [IRP] ${req.method} ${path} | Auth: ${hasAuth ? 'Yes' : 'No'}`);
}

function buildPath(queryPath) {
  if (!queryPath) return '/';
  if (Array.isArray(queryPath)) return '/' + queryPath.join('/');
  return '/' + queryPath;
}

// ============================================================================
// HANDLER PRINCIPAL (PAGES ROUTER)
// ============================================================================

export default async function handler(req, res) {
  const params = req.query;
  const path = buildPath(params.path);

  try {
    const user = await getAuthenticatedUser(req);
    logRequest(req, path, !!user);

    // --- HEALTH CHECK ---
    if (req.method === 'GET' && path === '/health') {
      return res.status(200).json({
        status: 'healthy',
        aiAvailable: isAIAvailable(),
        _api: { version: API_CONFIG.version, timestamp: new Date().toISOString() }
      });
    }

    // --- AUTENTICACIÓN ---
    if (!user) {
      return res.status(401).json({
        error: 'Token de autenticación requerido',
        code: 'MISSING_TOKEN'
      });
    }

    // --- GET METHODS ---
    if (req.method === 'GET') {

      // /reviews/history
      if (path === '/reviews/history') {
        const { role = 'both', status = 'all', limit = '20', offset = '0' } = req.query;
        const options = {
          role,
          status,
          limit: parseInt(limit),
          offset: parseInt(offset)
        };

        const history = await getReviewHistory(user.id, options);
        return res.status(200).json({ reviews: history, total: history.length });
      }

      // /reviews/metrics/:userId
      if (path.match(/^\/reviews\/metrics\/[^/]+$/)) {
        const segments = path.split('/');
        const userId = segments[3]; // "", "reviews", "metrics", "userId"
        const metrics = await calculateUserMetrics(userId);
        return res.status(200).json(metrics);
      }

      // /reviews/:id
      if (path.match(/^\/reviews\/[0-9a-f-]+$/)) {
        const segments = path.split('/');
        const reviewId = segments[2];
        const details = await getReviewDetails(reviewId);
        return res.status(200).json(details);
      }

      // /admin/stats
      if (path === '/admin/stats') {
        const stats = await generateSystemStats();
        return res.status(200).json(stats);
      }
    }

    // --- POST METHODS ---
    if (req.method === 'POST') {

      // /reviews/request
      if (path === '/reviews/request') {
        const body = req.body;

        // Validar campos
        const required = ['project_name', 'github_repo_url', 'phase', 'week', 'description'];
        const missing = required.filter(f => !body[f]);

        if (missing.length > 0) {
          return res.status(400).json({
            error: `Campos requeridos: ${missing.join(', ')}`,
            code: 'VALIDATION_ERROR'
          });
        }

        // Crear solicitud
        const request = await createReviewRequest(body, user.id);

        // Iniciar IA en background
        if (isAIAvailable()) {
          processAIReview(request, user.id).catch(err => {
            console.error('[IRP] AI Review failed:', err.message);
          });
        }

        return res.status(201).json({
          review_request_id: request.id,
          status: request.status.toLowerCase(),
          created_at: request.created_at,
          message: 'Solicitud creada exitosamente. La revisión automática está en proceso.'
        });
      }
    }

    return res.status(404).json({ error: 'Endpoint no encontrado', code: 'NOT_FOUND' });

  } catch (error) {
    console.error(`[IRP] Error en ${req.method} ${path}:`, error.message);
    return res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
}

// ============================================================================
// PROCESAMIENTO ASÍNCRONO
// ============================================================================

async function processAIReview(reviewRequest, userId) {
  console.log('[IRP] Starting AI review for:', reviewRequest.id);
  try {
    const codeContent = await fetchCodeFromGitHub(reviewRequest.github_repo_url);
    const result = await performAIReview(reviewRequest, codeContent);
    if (result.success) {
      await saveAIReview(reviewRequest.id, result.reviewData, userId);
      console.log('[IRP] AI review completed for:', reviewRequest.id);
    }
  } catch (error) {
    console.error('[IRP] AI review error:', error.message);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb'
    }
  }
};
