
import { NextApiRequest, NextApiResponse } from 'next';
import { BaseController } from './BaseController';
// @ts-ignore - Importing JS module
import { smartLessonGenerator } from '../services/SmartLessonGenerator';

export class LessonController extends BaseController {
    async generate(req: NextApiRequest, res: NextApiResponse) {
        try {
            // Input is already validated by middleware, or we can double check
            const params = req.body;

            // Delegate to Agentic Service
            const result = await smartLessonGenerator.generateWithAutonomy(params);

            this.handleSuccess(res, result);
        } catch (error: any) {
            this.handleError(res, error, 'LessonController.generate');
        }
    }
}

export const lessonController = new LessonController();
