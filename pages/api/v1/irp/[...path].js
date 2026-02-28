/**
 * API ROUTE - SISTEMA IRP (Revisión de Código)
 * LOCAL AUTH VERSION
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
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-this';

const MOCK_TOKEN_FOR_E2E = 'E2E_MOCK_TOKEN_FOR_TESTING_PURPOSES_ONLY_V5';

async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('cookie-auth-active')) {
    token = authHeader.substring(7);
  } else if (req.cookies && (req.cookies['ai-code-mentor-auth'] || req.cookies.token)) {
    token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;
  }

  if (!token) return null;

  // Permitir token de prueba SOLO en modo E2E
  if (token === MOCK_TOKEN_FOR_E2E) {
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE !== 'true') {
      console.warn('[Security] Attempted use of MOCK_TOKEN in non-E2E environment.');
      return null;
    }
    return {
      id: 'e2e-test-user-id',
      email: 'test@example.com',
      role: 'admin'
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'authenticated'
    };
  } catch (e) {
    return null;
  }
}

function buildPath(queryPath) {
  if (!queryPath) return '/';
  if (Array.isArray(queryPath)) return '/' + queryPath.join('/');
  return '/' + queryPath;
}

export default async function handler(req, res) {
  const params = req.query;
  const path = buildPath(params.path);

  try {
    const user = await getAuthenticatedUser(req);

    // --- HEALTH CHECK ---
    if (req.method === 'GET' && path === '/health') {
      return res.status(200).json({ status: 'healthy', aiAvailable: isAIAvailable() });
    }

    // --- AUTENTICACIÓN ---
    if (!user) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    // --- GET METHODS ---
    if (req.method === 'GET') {
      if (path === '/reviews/history') {
        const { role = 'both', status = 'all', limit = '20', offset = '0' } = req.query;
        const options = { role, status, limit: parseInt(limit), offset: parseInt(offset) };
        const history = await getReviewHistory(user.id, options);
        return res.status(200).json({ reviews: history, total: history.length });
      }

      if (path.match(/^\/reviews\/metrics\/[^/]+$/)) {
        const segments = path.split('/');
        const userId = segments[3];
        const metrics = await calculateUserMetrics(userId);
        return res.status(200).json(metrics);
      }

      if (path.match(/^\/reviews\/[A-Za-z0-9_-]+$/)) {
        const segments = path.split('/');
        const reviewId = segments[2];
        const details = await getReviewDetails(reviewId);
        return res.status(200).json(details);
      }

      if (path === '/admin/stats') {
        if (user.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }
        const stats = await generateSystemStats();
        return res.status(200).json(stats);
      }
    }

    // --- POST METHODS ---
    if (req.method === 'POST') {
      if (path === '/reviews/request') {
        const body = req.body;
        const request = await createReviewRequest(body, user.id);
        if (isAIAvailable()) {
          processAIReview(request, user.id).catch(err => console.error(err));
        }
        return res.status(201).json({
          review_request_id: request.id,
          status: request.status.toLowerCase(),
          created_at: request.created_at,
          message: 'Solicitud creada exitosamente.'
        });
      }
    }

    return res.status(404).json({ error: 'Endpoint no encontrado' });

  } catch (error) {
    console.error(`[IRP] Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
}

async function processAIReview(reviewRequest, userId) {
  try {
    // performAIReview ahora maneja internamente la prioridad (code_content > github)
    const result = await performAIReview(reviewRequest);
    if (result.success) {
      await saveAIReview(reviewRequest.id, result.reviewData, userId);
    }
  } catch (error) {
    console.error('[IRP] AI review error:', error.message);
  }
}
