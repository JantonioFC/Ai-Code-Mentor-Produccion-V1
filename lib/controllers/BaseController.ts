
// lib/controllers/BaseController.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../utils/logger';

export abstract class BaseController {
    protected handleSuccess(res: NextApiResponse, data: any, status: number = 200) {
        return res.status(status).json({
            success: true,
            data
        });
    }

    protected handleError(res: NextApiResponse, error: any, context: string) {
        logger.error(`[${context}] Error: ${error.message}`, { error });

        // Map known errors
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.errors
            });
        }

        if (error.name === 'LowConfidenceError') {
            return res.status(422).json({
                success: false,
                error: 'AI Context Verification Failed',
                message: error.message
            });
        }

        const statusCode = error.status || 500;
        const message = error.message || 'Internal Server Error';

        return res.status(statusCode).json({
            success: false,
            error: message
        });
    }
}
