import { z } from 'zod';
import { withOptionalAuth, createAdaptiveResponse } from '../../../../utils/authMiddleware';
import { logger } from '../../../../lib/utils/logger';
import { profileService } from '../../../../lib/services/ProfileService';
import { createApiHandler, sendSuccess, sendError } from '../../../../lib/api/APIWrapper';
import { withValidation } from '../../../../lib/api/validate';

// Esquema para actualización de perfil
const updateProfileSchema = z.object({
    display_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    preferences: z.record(z.any()).optional(),
    avatar_url: z.string().url().optional()
});

async function handler(req, res) {
    const { isAuthenticated, user, userId } = req.authContext;

    // --- POST: Update Profile ---
    if (req.method === 'POST') {
        if (!isAuthenticated) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                requireAuth: true
            });
        }

        // Validación Zod manual o via middleware específico. 
        // Como este handler maneja GET/POST, hacemos parse manual si no usamos router compuesto.
        const parsedBody = updateProfileSchema.parse(req.body);

        logger.info(`[API v1/PROFILE] Actualizando: ${user?.email}`, { userId });
        const updatedProfile = await profileService.updateProfile(userId, parsedBody);

        return sendSuccess(res, {
            authenticated: true,
            message: 'Perfil actualizado exitosamente',
            profile: updatedProfile
        });
    }

    // --- GET: Get Profile ---
    if (req.method === 'GET') {
        if (isAuthenticated) {
            const profile = await profileService.getProfile(userId, user?.email);

            // Respuesta autenticada estándar
            return sendSuccess(res, {
                profile,
                capabilities: ['Ver progreso', 'Actualizar info'],
                isGuest: false
            });
        } else {
            // Respuesta pública/anónima estándar
            return sendSuccess(res, {
                profile: { display_name: 'Guest User' },
                isGuest: true,
                limitations: ['Solo info básica']
            });
        }
    }

    // --- DELETE: Delete Account (GDPR) ---
    if (req.method === 'DELETE') {
        if (!isAuthenticated) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            profileService.deleteUser(userId);
            // Clear auth cookie header handled by client or subsequent logout
            return sendSuccess(res, {
                message: 'Cuenta eliminada permanentemente. Hasta luego.'
            });
        } catch (e) {
            return sendError(res, e, 'Error eliminando cuenta');
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}

// Envuelto en APIWrapper para manejo de errores global (incluyendo ZodError)
export default withOptionalAuth(createApiHandler(handler));
