import { z } from 'zod';
import { createApiHandler, sendSuccess } from '../../../../lib/api/APIWrapper';
import { withValidation } from '../../../../lib/api/validate';
import { withRateLimit } from '../../../../lib/middleware/rateLimit';
import { generateLessonSchema } from '../../../../lib/validators/lesson';
import { lessonController } from '../../../../lib/controllers/LessonController';

// Reuse Shared Schema
const generateSchema = generateLessonSchema;

async function handler(req: any, res: any) {
    // Controller Logic: Coordination only
    // Delegate to Domain Controller
    return lessonController.generate(req, res);
}

// Composition of Middleware: RateLimit -> Validation -> Handler
export default withRateLimit(
    withValidation(generateSchema, createApiHandler(handler))
);
