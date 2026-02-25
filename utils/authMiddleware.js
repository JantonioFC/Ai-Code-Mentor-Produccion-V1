import AuthLocal from '../lib/auth-local';
import db from '../lib/db';

/**
 * AUTH MIDDLEWARE — Real JWT verification
 *
 * Verifies JWT from httpOnly cookies for each request.
 * No more auto-authenticated demo users.
 */

function extractAndVerifyToken(req) {
  // 1. Try httpOnly cookie first
  const cookieToken = req.cookies?.['ai-code-mentor-auth'];
  if (cookieToken) {
    return AuthLocal.verifyToken(cookieToken);
  }

  // 2. Fallback to Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    return AuthLocal.verifyToken(authHeader);
  }

  // 3. Check for PAT token
  const patToken = req.headers?.['x-api-key'];
  if (patToken) {
    return AuthLocal.verifyPAT(patToken);
  }

  return { isValid: false, error: 'No authentication token provided' };
}

export function withRequiredAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    try {
      const verification = extractAndVerifyToken(req);

      if (!verification.isValid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Load user from DB
      const user = db.findOne('user_profiles', { id: verification.userId });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check roles if specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(verification.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Inject user context
      req.user = user;
      req.authContext = {
        user,
        userId: user.id,
        email: user.email,
        isAuthenticated: true,
        role: verification.role
      };

      return await handler(req, res);

    } catch (error) {
      console.error('[AUTH] Error in auth middleware:', error);
      return res.status(500).json({ error: 'Internal Auth Error' });
    }
  };
}

export function withOptionalAuth(handler) {
  return async (req, res) => {
    try {
      const verification = extractAndVerifyToken(req);

      if (verification.isValid) {
        const user = db.findOne('user_profiles', { id: verification.userId });
        req.user = user || null;
        req.authContext = {
          user: user || null,
          userId: user?.id || null,
          email: user?.email || null,
          isAuthenticated: !!user,
          role: verification.role
        };
      } else {
        req.user = null;
        req.authContext = {
          user: null,
          userId: null,
          email: null,
          isAuthenticated: false,
          role: null
        };
      }

      return await handler(req, res);

    } catch (error) {
      console.error('[AUTH] Error in optional auth middleware:', error);
      req.user = null;
      req.authContext = { isAuthenticated: false };
      return await handler(req, res);
    }
  };
}

export function withAdminAuth(handler) {
  return withRequiredAuth(handler, ['admin']);
}

export function createAdaptiveResponse(req, authenticatedResponse, anonymousResponse) {
  if (req.authContext?.isAuthenticated) {
    return {
      success: true,
      authenticated: true,
      data: authenticatedResponse,
      timestamp: new Date().toISOString()
    };
  }
  return {
    success: true,
    authenticated: false,
    data: anonymousResponse,
    timestamp: new Date().toISOString()
  };
}
