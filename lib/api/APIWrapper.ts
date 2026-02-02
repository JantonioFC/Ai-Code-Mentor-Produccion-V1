
/**
 * API Wrapper - Response Standardization (TypeScript)
 * Ensures consistent API response format with strict typing.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Generic Response Type
export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: string | null;
    meta: {
        timestamp: string;
        [key: string]: any;
    };
    details?: any[]; // For Zod validation errors
}

// Handler Type
type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void | any>;

/**
 * HOF to wrap API handlers with error handling
 */
export function createApiHandler(handler: ApiHandler) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            await handler(req, res);
        } catch (error) {
            handleApiError(error, res);
        }
    };
}

/**
 * Send Success Response
 */
export function sendSuccess<T>(res: NextApiResponse, data: T, meta: Record<string, any> = {}) {
    const response: ApiResponse<T> = {
        success: true,
        data,
        error: null,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    };
    return res.status(200).json(response);
}

/**
 * Send Error Response
 */
export function sendError(res: NextApiResponse, error: unknown, status = 500) {
    const message = error instanceof Error ? error.message : String(error);

    if (status === 500) {
        console.error('[API Error]', error);
    }

    const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: message,
        meta: {
            timestamp: new Date().toISOString()
        }
    };

    return res.status(status).json(response);
}

/**
 * Internal Error Handler
 */
function handleApiError(error: unknown, res: NextApiResponse) {
    // Zod Validation Errors
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            data: null,
            error: 'Validation Error',
            details: (error as any).errors || (error as any).issues,
            meta: { timestamp: new Date().toISOString() }
        } as ApiResponse<null>);
    }

    // Known Custom Errors (duck typing)
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        const err = error as { statusCode: number; message: string };
        return sendError(res, err.message, err.statusCode);
    }

    // Generic Internal Error
    logger.error('Unhandled API Error', error);
    return sendError(res, 'Internal Server Error', 500);
}
